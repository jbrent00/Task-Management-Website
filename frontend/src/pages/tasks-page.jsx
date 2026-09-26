import TaskBoard from '../components/task-board/task-board';
import CreateTaskForm from '../components/create-task-form/create-task-form';
import CreateTaskDialog from '../components/create-task-dialog/create-task-dialog';
import TaskViewControls from '../components/task-view-controls/task-view-controls';
import ProjectTagManager from '../components/project-tag-manager/project-tag-manager';
import TaskViewTabs from '../components/task-view-tabs/task-view-tabs';
import TaskDetailModal from '../components/task-detail-modal/task-detail-modal';
import styles from './tasks-page.module.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TaskMutationContext } from '../functions/taskMutationContext';
import { getTasks } from '../api/getTasks';
import { useAuth } from '@clerk/react';
import { DragDropContext } from '@hello-pangea/dnd';
import { updateTasks } from '../api/updateTasks';
import { getProject, getProjects } from '../api/projects';
import { createTag, deleteTag, getTags, updateTag } from '../api/tags';
import { defaultTaskView, getActiveSort, getTaskTabCounts, getVisibleTasksByStatus, hasActiveTaskFilters, isValidTaskView, taskStatuses } from '../functions/taskViews';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';

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
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tags, setTags] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [view, setView] = useState(defaultTaskView);
    const [searchQuery, setSearchQuery] = useState('');
    const [hydratedViewUserId, setHydratedViewUserId] = useState('');
    const [dateReference, setDateReference] = useState(() => new Date());
    const [notice, setNotice] = useState(null);
    const [creationExpanded, setCreationExpanded] = useState(false);
    const [creationStatus, setCreationStatus] = useState('todo');
    const [creationReturnSelector, setCreationReturnSelector] = useState('[data-create-task-trigger]');
    const creationTrigger = useRef(null);
    const closingTaskId = useRef(null);
    const [selectedStatus, setSelectedStatus] = useState('todo');
    const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 960px)').matches);
    const mutationLock = useRef(false);
    const [mutationBusy, setMutationBusy] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectLoadState, setProjectLoadState] = useState('idle');
    const [projectLoadError, setProjectLoadError] = useState('');
    const [projectLoadRequest, setProjectLoadRequest] = useState(0);
    const mutation = {
        busy: mutationBusy,
        begin: () => {
            if (mutationLock.current) return false;
            mutationLock.current = true;
            setMutationBusy(true);
            return true;
        },
        end: () => { mutationLock.current = false; setMutationBusy(false); },
    };
    useEffect(() => {
        const media = window.matchMedia('(max-width: 960px)');
        const update = () => setNarrow(media.matches);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!notice) return undefined;
        const timeoutId = window.setTimeout(() => setNotice(null), 5000);
        return () => window.clearTimeout(timeoutId);
    }, [notice]);

    useEffect(() => {
        let timerId;
        const scheduleNextRefresh = () => {
            const now = new Date();
            const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            timerId = window.setTimeout(() => {
                setDateReference(new Date());
                scheduleNextRefresh();
            }, nextMidnight.getTime() - now.getTime() + 100);
        };
        scheduleNextRefresh();
        return () => window.clearTimeout(timerId);
    }, []);

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
                const [loadedTasks, loadedProjects, loadedTags] = await Promise.all([getTasks(token), getProjects(token), getTags(token)]);
                setTasks(loadedTasks);
                setProjects(loadedProjects.filter((project) => !project.archivedAt));
                setTags(loadedTags);
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

    const tasksByStatus = useMemo(() => getVisibleTasksByStatus(tasks, view, searchQuery, dateReference), [tasks, view, searchQuery, dateReference]);
    const tabCounts = useMemo(() => getTaskTabCounts(tasks, dateReference), [tasks, dateReference]);
    const totalVisibleTasks = taskStatuses.reduce((total, status) => total + tasksByStatus[status].length, 0);
    const isManualOrder = getActiveSort(view) === 'manual';
    const isFiltered = view.selectedTab !== 'all' || hasActiveTaskFilters(view) || Boolean(searchQuery.trim());
    const requestedTaskId = searchParams.get('task');
    const selectedTaskId = requestedTaskId && /^\d+$/.test(requestedTaskId) ? Number(requestedTaskId) : null;
    const selectedTask = selectedTaskId === null ? null : tasks.find((task) => task.id === selectedTaskId) ?? null;

    const openTask = (taskId) => setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('task', String(taskId));
        return next;
    });
    const closeTask = () => {
        const closingId = selectedTaskId;
        closingTaskId.current = closingId;
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.delete('task');
            return next;
        }, { replace: true });
        window.requestAnimationFrame(() => document.querySelector(`#task-card-${closingId} [aria-label^="Edit "]`)?.focus());
    };

    useEffect(() => {
        if (requestedTaskId === null) { closingTaskId.current = null; return; }
        if (closingTaskId.current !== null && closingTaskId.current === selectedTaskId) return;
        if (loading || loadError || requestedTaskId === null || selectedTask) return;
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.delete('task');
            return next;
        }, { replace: true });
        setNotice({ tone: 'error', message: 'That task is unavailable or you no longer have access to it.' });
    }, [loadError, loading, requestedTaskId, selectedTask, selectedTaskId, setSearchParams]);

    useEffect(() => {
        let cancelled = false;
        if (!selectedTask?.projectId) {
            setSelectedProject(null);
            setProjectLoadState('idle');
            setProjectLoadError('');
            return undefined;
        }
        setSelectedProject(null);
        setProjectLoadState('loading');
        setProjectLoadError('');
        const loadProject = async () => {
            try {
                const project = await getProject(await getToken(), selectedTask.projectId);
                if (!cancelled) { setSelectedProject(project); setProjectLoadState('ready'); }
            } catch (error) {
                if (!cancelled) { setProjectLoadState('error'); setProjectLoadError(error.message); }
            }
        };
        loadProject();
        return () => { cancelled = true; };
    }, [getToken, projectLoadRequest, selectedTask?.id, selectedTask?.projectId]);
    const withToken = async (callback) => {
        if (!mutation.begin()) throw new Error('Another workspace change is still saving. Please try again.');
        try { return await callback(await getToken()); }
        finally { mutation.end(); }
    };
    const handleCreateTag = async (name, color) => { const tag = await withToken((token) => createTag(token, name, color)); setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name))); return tag; };
    const handleUpdateTag = async (id, name, color) => { const tag = await withToken((token) => updateTag(token, id, name, color)); setTags((current) => current.map((item) => item.id === id ? tag : item)); setTasks((current) => current.map((task) => ({ ...task, tags: (task.tags ?? []).map((item) => item.id === id ? tag : item) }))); };
    const handleDeleteTag = async (id) => { await withToken((token) => deleteTag(token, id)); setTags((current) => current.filter((tag) => tag.id !== id)); setTasks((current) => current.map((task) => ({ ...task, tags: (task.tags ?? []).filter((tag) => tag.id !== id) }))); setView((current) => ({ ...current, tagIds: current.tagIds.filter((tagId) => tagId !== id) })); };

    const handleDragEnd = async (result) => {
        if (!isManualOrder) return;
        const { source, destination } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

        const sourceStatus = source.droppableId;
        const destinationStatus = destination.droppableId;
        const movedTask = tasksByStatus[sourceStatus][source.index];
        if (!movedTask || movedTask.projectId) return;
        const sourceVisibleTasks = tasksByStatus[sourceStatus].filter((task) => !task.projectId);
        const destinationVisibleTasks = sourceStatus === destinationStatus ? sourceVisibleTasks : tasksByStatus[destinationStatus].filter((task) => !task.projectId);
        const sourcePersonalIndex = sourceVisibleTasks.findIndex((task) => task.id === movedTask.id);
        sourceVisibleTasks.splice(sourcePersonalIndex, 1);
        if (!mutation.begin()) return;
        const destinationPersonalIndex = tasksByStatus[destinationStatus].slice(0, destination.index).filter((task) => !task.projectId).length;
        destinationVisibleTasks.splice(destinationPersonalIndex, 0, movedTask);

        const allSourceTasks = tasks.filter((task) => task.status === sourceStatus && !task.projectId).sort((first, second) => first.orderIndex - second.orderIndex);
        const allDestinationTasks = sourceStatus === destinationStatus ? allSourceTasks : tasks.filter((task) => task.status === destinationStatus && !task.projectId).sort((first, second) => first.orderIndex - second.orderIndex);
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
            setNotice({ tone: 'success', message: `Moved “${movedTask.title}”.` });
        } catch (error) {
            console.error('Error updating task order', error);
            setTasks(previousTasks);
            setNotice({ tone: 'error', message: `Could not move “${movedTask.title}”. Its previous position was restored.` });
        } finally {
            mutation.end();
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setView((currentView) => ({ ...defaultTaskView, selectedTab: currentView.selectedTab, sorts: currentView.sorts }));
    };

    return (
        <TaskMutationContext.Provider value={mutation}><div className={styles.tasksPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>My tasks</h1>
                    <p className={styles.taskTotal}><strong>{totalVisibleTasks}</strong>{isFiltered ? ` of ${tasks.length}` : ''} {totalVisibleTasks === 1 ? 'task' : 'tasks'} in your workspace</p>
                </div>
                <div className={styles.headerActions}>
                    <button ref={creationTrigger} data-create-task-trigger className={styles.createButton} type="button" onClick={() => { setCreationStatus('todo'); setCreationReturnSelector('[data-create-task-trigger]'); setCreationExpanded(true); }}><PlusIcon size={18} weight="bold" aria-hidden="true" />Create task</button>
                </div>
            </div>
            {notice && <div className={`${styles.notice} ${styles[notice.tone]}`} role={notice.tone === 'error' ? 'alert' : 'status'} aria-live="polite"><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><XIcon size={18} /></button></div>}
            <CreateTaskDialog open={creationExpanded} title="Create task" onClose={() => setCreationExpanded(false)} returnFocusSelector={creationReturnSelector}><CreateTaskForm expanded={creationExpanded} initialStatus={creationStatus} onCreated={() => setCreationExpanded(false)} tasks={tasks} setTasks={setTasks} projects={projects} tags={tags} onCreateTag={handleCreateTag} onNotify={setNotice} /></CreateTaskDialog>
            <TaskViewTabs selectedTab={view.selectedTab} counts={tabCounts} onSelect={(selectedTab) => setView((currentView) => ({ ...currentView, selectedTab }))} />
            <ProjectTagManager tags={tags} onCreateTag={handleCreateTag} onUpdateTag={handleUpdateTag} onDeleteTag={handleDeleteTag} onNotify={setNotice} />
            <TaskViewControls view={view} searchQuery={searchQuery} onSearchChange={setSearchQuery} onViewChange={setView} onClearFilters={handleClearFilters} projects={projects} tags={tags} />
            {loadError && <p className={styles.loadError} role="alert">{loadError}</p>}
            {narrow && <nav className={styles.statusSelectors} aria-label="Task status">{taskStatuses.map((status) => <button type="button" key={status} aria-pressed={selectedStatus === status} onClick={() => setSelectedStatus(status)}>{({ todo: 'To do', in_progress: 'In progress', completed: 'Completed' })[status]} <span>{tasksByStatus[status].length}</span></button>)}</nav>}
            <div className={styles.taskBoards}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    {taskStatuses.map((status) => <div key={status} hidden={narrow && selectedStatus !== status}>
                        <TaskBoard status={status} tasks={tasksByStatus[status]} setAllTasks={setTasks} loading={loading} isManualOrder={isManualOrder && !mutationBusy} isFiltered={isFiltered} selectedTab={view.selectedTab} onNotify={setNotice} onOpenDetails={openTask} onCreateTask={(nextStatus) => { setCreationStatus(nextStatus); setCreationReturnSelector(`[data-create-status="${nextStatus}"]`); setCreationExpanded(true); }} />
                        {narrow && !loading && tasksByStatus[status].length === 0 && taskStatuses.filter((other) => other !== status && tasksByStatus[other].length > 0).map((other) => <button className={styles.switchStatus} type="button" key={other} onClick={() => setSelectedStatus(other)}>Show {({ todo: 'To do', in_progress: 'In progress', completed: 'Completed' })[other]} tasks ({tasksByStatus[other].length})</button>)}
                    </div>)}
                </DragDropContext>
            </div>
            {selectedTask && <TaskDetailModal key={selectedTask.id} task={selectedTask} project={selectedTask.projectId && selectedProject?.id === selectedTask.projectId ? selectedProject : null} personalTags={tags} onCreatePersonalTag={handleCreateTag} projectLoading={Boolean(selectedTask.projectId) && selectedProject?.id !== selectedTask.projectId && projectLoadState !== 'error'} projectError={projectLoadState === 'error' ? projectLoadError : ''} onRetryProject={() => setProjectLoadRequest((request) => request + 1)} onClose={closeTask} onUpdated={(updated) => setTasks((current) => current.map((task) => task.id === updated.id ? updated : task))} onDeleted={(taskId) => { setTasks((current) => current.filter((task) => task.id !== taskId)); closeTask(); }} onNotify={setNotice} />}
        </div></TaskMutationContext.Provider>
    );
}

export default TasksPage;
