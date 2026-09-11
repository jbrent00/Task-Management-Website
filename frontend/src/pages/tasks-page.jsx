import TaskBoard from '../components/task-board/task-board';
import CreateTaskForm from '../components/create-task-form/create-task-form';
import TaskViewControls from '../components/task-view-controls/task-view-controls';
import styles from './tasks-page.module.css';
import { useEffect, useMemo, useState } from 'react';
import { getTasks } from '../api/getTasks';
import { UserButton, useAuth } from '@clerk/react';
import { DragDropContext } from '@hello-pangea/dnd';
import { updateTasks } from '../api/updateTasks';
import { createProject, deleteProject, getProjects, updateProject } from '../api/projects';
import { createTag, deleteTag, getTags, updateTag } from '../api/tags';
import { defaultTaskView, getVisibleTasksByStatus, hasActiveTaskFilters, isValidTaskView, noProjectFilter, taskStatuses } from '../functions/taskViews';

const getStorageKey = (userId) => `task-manager:view:${userId}`;

function mergeVisibleOrder(allTasks, previousVisibleTasks, reorderedVisibleTasks) {
    const visibleIds = new Set(previousVisibleTasks.map((task) => task.id));
    const firstVisibleIndex = allTasks.findIndex((task) => visibleIds.has(task.id));
    const remainingTasks = allTasks.filter((task) => !visibleIds.has(task.id));
    const insertionIndex = firstVisibleIndex === -1 ? remainingTasks.length : firstVisibleIndex;
    return [...remainingTasks.slice(0, insertionIndex), ...reorderedVisibleTasks, ...remainingTasks.slice(insertionIndex)];
}

function TasksPage() {
    const { getToken, isSignedIn, isLoaded, userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tags, setTags] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [view, setView] = useState(defaultTaskView);
    const [searchQuery, setSearchQuery] = useState('');
    const [hydratedViewUserId, setHydratedViewUserId] = useState('');
    const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);

    useEffect(() => {
        if (!isLoaded || !userId) {
            setHydratedViewUserId('');
            setAssignmentsLoaded(false);
            return;
        }

        let restoredView = defaultTaskView;
        try {
            const storedView = JSON.parse(localStorage.getItem(getStorageKey(userId)) ?? 'null');
            // Upgrade the previous UI-only name once, then persist the clearer internal value.
            const upgradedStoredView = storedView?.projectId === 'inbox' ? { ...storedView, projectId: noProjectFilter } : storedView;
            restoredView = isValidTaskView(upgradedStoredView) ? upgradedStoredView : defaultTaskView;
        } catch {
            restoredView = defaultTaskView;
        }
        setView(restoredView);
        setHydratedViewUserId(userId);
    }, [isLoaded, userId]);

    useEffect(() => {
        if (userId && hydratedViewUserId === userId) {
            localStorage.setItem(getStorageKey(userId), JSON.stringify(view));
        }
    }, [hydratedViewUserId, userId, view]);

    useEffect(() => {
        if (!isLoaded) return;
        const fetchTasks = async () => {
            if (!isSignedIn) {
                setLoading(false);
                return;
            }
            try {
                const token = await getToken();
                setTasks(await getTasks(token));
                setLoadError('');
                try {
                    const [loadedProjects, loadedTags] = await Promise.all([getProjects(token), getTags(token)]);
                    setProjects(loadedProjects);
                    setTags(loadedTags);
                    setAssignmentsLoaded(true);
                } catch (error) {
                    console.error('Error fetching projects or tags', error);
                }
            } catch (error) {
                console.error('Error fetching tasks', error);
                setLoadError('We could not load your tasks. Check that the backend is running, then refresh the page.');
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [getToken, isLoaded, isSignedIn]);

    useEffect(() => {
        if (!assignmentsLoaded) return;
        setView((current) => ({ ...current, projectId: current.projectId !== noProjectFilter && current.projectId !== null && !projects.some((project) => project.id === current.projectId) ? null : current.projectId, tagIds: current.tagIds.filter((id) => tags.some((tag) => tag.id === id)) }));
    }, [assignmentsLoaded, projects, tags]);

    const tasksByStatus = useMemo(() => getVisibleTasksByStatus(tasks, view, searchQuery), [tasks, view, searchQuery]);
    const totalVisibleTasks = taskStatuses.reduce((total, status) => total + tasksByStatus[status].length, 0);
    const isManualOrder = view.sort === 'manual';
    const isFiltered = hasActiveTaskFilters(view) || Boolean(searchQuery.trim());
    const projectCounts = useMemo(() => projects.reduce((counts, project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        counts[project.id] = { total: projectTasks.length, completed: projectTasks.filter((task) => task.status === 'completed').length };
        return counts;
    }, {}), [projects, tasks]);

    const withToken = async (callback) => callback(await getToken());
    const handleCreateProject = async (title, description) => { const project = await withToken((token) => createProject(token, title, description)); setProjects((current) => [...current, project].sort((a, b) => a.title.localeCompare(b.title))); return project; };
    const handleUpdateProject = async (id, title, description) => { const project = await withToken((token) => updateProject(token, id, title, description)); setProjects((current) => current.map((item) => item.id === id ? project : item).sort((a, b) => a.title.localeCompare(b.title))); setTasks((current) => current.map((task) => task.projectId === id ? { ...task, project: { id, title: project.title } } : task)); };
    const handleDeleteProject = async (id) => { await withToken((token) => deleteProject(token, id)); setProjects((current) => current.filter((project) => project.id !== id)); setTasks((current) => current.map((task) => task.projectId === id ? { ...task, projectId: null, project: null } : task)); };
    const handleCreateTag = async (name, color) => { const tag = await withToken((token) => createTag(token, name, color)); setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name))); return tag; };
    const handleUpdateTag = async (id, name, color) => { const tag = await withToken((token) => updateTag(token, id, name, color)); setTags((current) => current.map((item) => item.id === id ? tag : item).sort((a, b) => a.name.localeCompare(b.name))); setTasks((current) => current.map((task) => ({ ...task, tags: task.tags.map((item) => item.id === id ? tag : item) }))); };
    const handleDeleteTag = async (id) => { await withToken((token) => deleteTag(token, id)); setTags((current) => current.filter((tag) => tag.id !== id)); setTasks((current) => current.map((task) => ({ ...task, tags: task.tags.filter((tag) => tag.id !== id) }))); };

    const handleDragEnd = async (result) => {
        if (!isManualOrder) return;
        const { source, destination } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

        const sourceStatus = source.droppableId;
        const destinationStatus = destination.droppableId;
        const sourceVisibleTasks = [...tasksByStatus[sourceStatus]];
        const destinationVisibleTasks = sourceStatus === destinationStatus ? sourceVisibleTasks : [...tasksByStatus[destinationStatus]];
        const [movedTask] = sourceVisibleTasks.splice(source.index, 1);
        if (!movedTask) return;
        destinationVisibleTasks.splice(destination.index, 0, movedTask);

        const allSourceTasks = tasks.filter((task) => task.status === sourceStatus).sort((first, second) => first.orderIndex - second.orderIndex);
        const allDestinationTasks = sourceStatus === destinationStatus ? allSourceTasks : tasks.filter((task) => task.status === destinationStatus).sort((first, second) => first.orderIndex - second.orderIndex);
        const reorderedByStatus = sourceStatus === destinationStatus
            ? { [sourceStatus]: mergeVisibleOrder(allSourceTasks, tasksByStatus[sourceStatus], destinationVisibleTasks) }
            : {
                [sourceStatus]: mergeVisibleOrder(allSourceTasks, tasksByStatus[sourceStatus], sourceVisibleTasks),
                [destinationStatus]: mergeVisibleOrder(allDestinationTasks, tasksByStatus[destinationStatus], destinationVisibleTasks),
            };

        const reorderedTasks = Object.entries(reorderedByStatus).flatMap(([status, list]) => list.map((task, index) => ({ ...task, status, orderIndex: index })));
        const updatesById = new Map(reorderedTasks.map((task) => [task.id, task]));
        const previousTasks = tasks;
        setTasks(tasks.map((task) => updatesById.get(task.id) ?? task));

        try {
            const token = await getToken();
            await updateTasks(token, reorderedTasks);
        } catch (error) {
            console.error('Error updating task order', error);
            setTasks(previousTasks);
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setView((currentView) => ({ ...defaultTaskView, sort: currentView.sort }));
    };

    return (
        <div className={styles.tasksPage}>
            <div className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Task workspace</p>
                    <h1 className={styles.title}>My tasks</h1>
                    <p className={styles.taskTotal}><strong>{totalVisibleTasks}</strong>{isFiltered ? ` of ${tasks.length}` : ''} {totalVisibleTasks === 1 ? 'task' : 'tasks'} in your workspace</p>
                </div>
                <div className={styles.userButton}><UserButton /></div>
            </div>
            <div className={styles.createTask}><CreateTaskForm tasks={tasks} setTasks={setTasks} projects={projects} tags={tags} onCreateTag={handleCreateTag} /></div>
            <TaskViewControls view={view} searchQuery={searchQuery} onSearchChange={setSearchQuery} onViewChange={setView} onClearFilters={handleClearFilters} projects={projects} tags={tags} projectCounts={projectCounts} onCreateProject={handleCreateProject} onUpdateProject={handleUpdateProject} onDeleteProject={handleDeleteProject} onUpdateTag={handleUpdateTag} onDeleteTag={handleDeleteTag} />
            {loadError && <p className={styles.loadError} role="alert">{loadError}</p>}
            <div className={styles.taskBoards}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    {taskStatuses.map((status) => <TaskBoard key={status} status={status} tasks={tasksByStatus[status]} allTasks={tasks} setAllTasks={setTasks} loading={loading} isManualOrder={isManualOrder} isFiltered={isFiltered} projects={projects} tags={tags} onCreateTag={handleCreateTag} />)}
                </DragDropContext>
            </div>
        </div>
    );
}

export default TasksPage;
