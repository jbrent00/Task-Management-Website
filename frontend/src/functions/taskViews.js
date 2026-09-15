export const taskStatuses = ['todo', 'in_progress', 'completed'];
export const taskPriorities = ['high', 'medium', 'low'];
export const taskSorts = ['manual', 'priority', 'dueDate', 'title', 'createdAt', 'completedAt'];
export const taskViewTabs = [
    ['all', 'All tasks'],
    ['today', 'Today'],
    ['upcoming', 'Next 7 days'],
    ['overdue', 'Overdue'],
    ['noDueDate', 'Unscheduled'],
    ['completed', 'Completed'],
    ['completedRecently', 'Completed recently'],
];
export const noProjectFilter = 'no_project';

const defaultSorts = { all: 'manual', today: 'dueDate', upcoming: 'dueDate', overdue: 'dueDate', noDueDate: 'dueDate', completed: 'completedAt', completedRecently: 'completedAt' };
export const defaultTaskView = { selectedTab: 'all', sorts: defaultSorts, priorityFilters: [], statusFilters: [], dueFilters: [], projectId: null, tagIds: [] };

const priorityRank = { high: 0, medium: 1, low: 2 };
const stableCompare = (first, second) => first.title.localeCompare(second.title, undefined, { sensitivity: 'base' }) || first.id - second.id;
const dateValue = (value) => {
    const timestamp = value ? new Date(value).getTime() : Number.NaN;
    return Number.isNaN(timestamp) ? null : timestamp;
};
const localDateKey = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const isActiveTask = (task) => task.status !== 'completed';

export const getActiveSort = (view) => view.sorts[view.selectedTab];
export const hasActiveTaskFilters = (view) => view.priorityFilters.length > 0 || view.statusFilters.length > 0 || view.dueFilters.length > 0 || view.projectId !== null || view.tagIds.length > 0;

export const isOverdue = (task, now = new Date()) => isActiveTask(task) && Boolean(task.dueDate) && localDateKey(task.dueDate) < localDateKey(now);

export const getTaskDueState = (task, now = new Date()) => {
    if (!isActiveTask(task) || !task.dueDate) return null;
    const dueKey = localDateKey(task.dueDate);
    const todayKey = localDateKey(now);
    if (dueKey < todayKey) {
        const days = Math.round((new Date(`${todayKey}T00:00`) - new Date(`${dueKey}T00:00`)) / 86400000);
        return { tone: 'overdue', label: `Overdue by ${days} day${days === 1 ? '' : 's'}` };
    }
    if (dueKey === todayKey) return { tone: 'dueSoon', label: 'Due today' };
    if (dueKey === localDateKey(addDays(now, 1))) return { tone: 'dueSoon', label: 'Due tomorrow' };
    return { tone: 'scheduled', label: 'Due' };
};

export const matchesTaskTab = (task, selectedTab, now = new Date()) => {
    const todayKey = localDateKey(now);
    const dueKey = task.dueDate ? localDateKey(task.dueDate) : null;
    if (selectedTab === 'all') return true;
    if (selectedTab === 'completed') return task.status === 'completed';
    if (selectedTab === 'completedRecently') {
        const completedKey = task.completedAt ? localDateKey(task.completedAt) : null;
        return task.status === 'completed' && completedKey !== null && completedKey >= localDateKey(addDays(now, -6)) && completedKey <= todayKey;
    }
    if (!isActiveTask(task)) return false;
    if (selectedTab === 'overdue') return dueKey !== null && dueKey < todayKey;
    if (selectedTab === 'today') return dueKey === todayKey;
    if (selectedTab === 'upcoming') return dueKey !== null && dueKey > todayKey && dueKey <= localDateKey(addDays(now, 7));
    return dueKey === null;
};

export const getTaskTabCounts = (tasks, now = new Date()) => Object.fromEntries(taskViewTabs.map(([tab]) => [tab, tasks.filter((task) => matchesTaskTab(task, tab, now)).length]));

export const isValidTaskView = (view) => view && typeof view === 'object' && taskViewTabs.some(([tab]) => tab === view.selectedTab)
    && view.sorts && typeof view.sorts === 'object' && taskViewTabs.every(([tab]) => taskSorts.includes(view.sorts[tab]))
    && Array.isArray(view.priorityFilters) && view.priorityFilters.every((value) => taskPriorities.includes(value))
    && Array.isArray(view.statusFilters) && view.statusFilters.every((value) => taskStatuses.includes(value))
    && Array.isArray(view.dueFilters) && view.dueFilters.every((value) => ['overdue', 'noDueDate'].includes(value))
    && (view.projectId === null || view.projectId === noProjectFilter || Number.isInteger(view.projectId))
    && Array.isArray(view.tagIds) && view.tagIds.every(Number.isInteger);

export const getVisibleTasksByStatus = (tasks, view, searchQuery, now = new Date()) => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
    const sort = getActiveSort(view);
    const filteredTasks = tasks.filter((task) => {
        const searchableText = `${task.title} ${task.description ?? ''}`.toLocaleLowerCase();
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
        const matchesPriority = !view.priorityFilters.length || view.priorityFilters.includes(task.priority);
        const matchesStatus = !view.statusFilters.length || view.statusFilters.includes(task.status);
        const matchesDue = !view.dueFilters.length || (view.dueFilters.includes('overdue') && isOverdue(task, now)) || (view.dueFilters.includes('noDueDate') && !task.dueDate);
        const matchesProject = view.projectId === null || (view.projectId === noProjectFilter ? task.projectId === null : task.projectId === view.projectId);
        const matchesTags = !view.tagIds.length || (task.tags ?? []).some((tag) => view.tagIds.includes(tag.id));
        return matchesTaskTab(task, view.selectedTab, now) && matchesSearch && matchesPriority && matchesStatus && matchesDue && matchesProject && matchesTags;
    });

    const compareTasks = (first, second) => {
        if (sort === 'manual') return (first.orderIndex - second.orderIndex) || stableCompare(first, second);
        if (sort === 'priority') return (priorityRank[first.priority] - priorityRank[second.priority]) || stableCompare(first, second);
        if (sort === 'title') return stableCompare(first, second);
        if (sort === 'createdAt') return (dateValue(second.createdAt) ?? 0) - (dateValue(first.createdAt) ?? 0) || stableCompare(first, second);
        if (sort === 'completedAt') return (dateValue(second.completedAt) ?? 0) - (dateValue(first.completedAt) ?? 0) || stableCompare(first, second);
        const firstDue = dateValue(first.dueDate);
        const secondDue = dateValue(second.dueDate);
        if (firstDue === null && secondDue === null) return (priorityRank[first.priority] - priorityRank[second.priority]) || stableCompare(first, second);
        if (firstDue === null) return 1;
        if (secondDue === null) return -1;
        return (firstDue - secondDue) || (priorityRank[first.priority] - priorityRank[second.priority]) || stableCompare(first, second);
    };

    return taskStatuses.reduce((groups, status) => {
        groups[status] = filteredTasks.filter((task) => task.status === status).sort(compareTasks);
        return groups;
    }, {});
};
