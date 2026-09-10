export const taskStatuses = ['todo', 'in_progress', 'completed'];
export const taskPriorities = ['high', 'medium', 'low'];
export const taskSorts = ['manual', 'priority', 'dueDate', 'title', 'createdAt'];

export const defaultTaskView = { sort: 'manual', priorityFilters: [], statusFilters: [], dueFilters: [] };

const priorityRank = { high: 0, medium: 1, low: 2 };
const stableCompare = (first, second) => first.title.localeCompare(second.title, undefined, { sensitivity: 'base' }) || first.id - second.id;
const dateValue = (value) => {
    const timestamp = value ? new Date(value).getTime() : Number.NaN;
    return Number.isNaN(timestamp) ? null : timestamp;
};

export const hasActiveTaskFilters = (view) => view.priorityFilters.length > 0 || view.statusFilters.length > 0 || view.dueFilters.length > 0;

export const isOverdue = (task, now = Date.now()) => {
    const dueTimestamp = dateValue(task.dueDate);
    return task.status !== 'completed' && dueTimestamp !== null && dueTimestamp < now;
};

export const isValidTaskView = (view) => view && typeof view === 'object' && taskSorts.includes(view.sort)
    && Array.isArray(view.priorityFilters) && view.priorityFilters.every((value) => taskPriorities.includes(value))
    && Array.isArray(view.statusFilters) && view.statusFilters.every((value) => taskStatuses.includes(value))
    && Array.isArray(view.dueFilters) && view.dueFilters.every((value) => ['overdue', 'noDueDate'].includes(value));

export const getVisibleTasksByStatus = (tasks, view, searchQuery) => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
    const now = Date.now();
    const filteredTasks = tasks.filter((task) => {
        const searchableText = `${task.title} ${task.description ?? ''}`.toLocaleLowerCase();
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
        const matchesPriority = !view.priorityFilters.length || view.priorityFilters.includes(task.priority);
        const matchesStatus = !view.statusFilters.length || view.statusFilters.includes(task.status);
        const matchesDue = !view.dueFilters.length || (view.dueFilters.includes('overdue') && isOverdue(task, now)) || (view.dueFilters.includes('noDueDate') && !task.dueDate);
        return matchesSearch && matchesPriority && matchesStatus && matchesDue;
    });

    const compareTasks = (first, second) => {
        if (view.sort === 'manual') return (first.orderIndex - second.orderIndex) || stableCompare(first, second);
        if (view.sort === 'priority') return (priorityRank[first.priority] - priorityRank[second.priority]) || stableCompare(first, second);
        if (view.sort === 'title') return stableCompare(first, second);
        if (view.sort === 'createdAt') return (dateValue(second.createdAt) ?? 0) - (dateValue(first.createdAt) ?? 0) || stableCompare(first, second);
        const firstDue = dateValue(first.dueDate);
        const secondDue = dateValue(second.dueDate);
        if (firstDue === null && secondDue === null) return stableCompare(first, second);
        if (firstDue === null) return 1;
        if (secondDue === null) return -1;
        return (firstDue - secondDue) || stableCompare(first, second);
    };

    return taskStatuses.reduce((groups, status) => {
        groups[status] = filteredTasks.filter((task) => task.status === status).sort(compareTasks);
        return groups;
    }, {});
};
