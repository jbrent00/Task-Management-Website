import TaskBoard from '../components/task-board/task-board';
import CreateTaskForm from '../components/create-task-form/create-task-form';
import TaskViewControls from '../components/task-view-controls/task-view-controls';
import styles from './tasks-page.module.css';
import { useEffect, useMemo, useState } from 'react';
import { getTasks } from '../api/getTasks';
import { UserButton, useAuth } from '@clerk/react';
import { DragDropContext } from '@hello-pangea/dnd';
import { updateTasks } from '../api/updateTasks';
import { defaultTaskView, getVisibleTasksByStatus, hasActiveTaskFilters, isValidTaskView, taskStatuses } from '../functions/taskViews';

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
    const [loadError, setLoadError] = useState('');
    const [view, setView] = useState(defaultTaskView);
    const [searchQuery, setSearchQuery] = useState('');
    const [hydratedViewUserId, setHydratedViewUserId] = useState('');

    useEffect(() => {
        if (!isLoaded || !userId) {
            setHydratedViewUserId('');
            return;
        }

        let restoredView = defaultTaskView;
        try {
            const storedView = JSON.parse(localStorage.getItem(getStorageKey(userId)) ?? 'null');
            restoredView = isValidTaskView(storedView) ? storedView : defaultTaskView;
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
            } catch (error) {
                console.error('Error fetching tasks', error);
                setLoadError('We could not load your tasks. Check that the backend is running, then refresh the page.');
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [getToken, isLoaded, isSignedIn]);

    const tasksByStatus = useMemo(() => getVisibleTasksByStatus(tasks, view, searchQuery), [tasks, view, searchQuery]);
    const totalVisibleTasks = taskStatuses.reduce((total, status) => total + tasksByStatus[status].length, 0);
    const isManualOrder = view.sort === 'manual';
    const isFiltered = hasActiveTaskFilters(view) || Boolean(searchQuery.trim());

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
            <div className={styles.createTask}><CreateTaskForm tasks={tasks} setTasks={setTasks} /></div>
            <TaskViewControls view={view} searchQuery={searchQuery} onSearchChange={setSearchQuery} onViewChange={setView} onClearFilters={handleClearFilters} />
            {loadError && <p className={styles.loadError} role="alert">{loadError}</p>}
            <div className={styles.taskBoards}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    {taskStatuses.map((status) => <TaskBoard key={status} status={status} tasks={tasksByStatus[status]} allTasks={tasks} setAllTasks={setTasks} loading={loading} isManualOrder={isManualOrder} isFiltered={isFiltered} />)}
                </DragDropContext>
            </div>
        </div>
    );
}

export default TasksPage;
