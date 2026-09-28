import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import AppShell from '../components/app-shell/app-shell';
import TaskBoard from '../components/task-board/task-board';
import TaskViewTabs from '../components/task-view-tabs/task-view-tabs';
import TaskViewControls from '../components/task-view-controls/task-view-controls';
import ProjectTagManager from '../components/project-tag-manager/project-tag-manager';
import CreateTaskDialog from '../components/create-task-dialog/create-task-dialog';
import CreateTaskForm from '../components/create-task-form/create-task-form';
import TaskDetailModal from '../components/task-detail-modal/task-detail-modal';
import { DemoActivity } from '../components/demo-collaboration/demo-collaboration';
import ConfirmDialog from '../components/confirm-dialog/confirm-dialog';
import { TaskMutationContext } from '../functions/taskMutationContext';
import { WorkspaceOperationsContext } from '../functions/workspace-context';
import { createDemoOperations } from '../functions/workspace-operations';
import { defaultTaskView, getActiveSort, getTaskTabCounts, getVisibleTasksByStatus, hasActiveTaskFilters, taskStatuses } from '../functions/taskViews';
import taskStyles from './tasks-page.module.css';
import styles from './demo-page.module.css';

const names = { todo: 'To do', in_progress: 'In progress', completed: 'Completed' };

function DemoWorkspace() {
  const operations = useMemo(() => createDemoOperations(), []);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(defaultTaskView);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('todo');
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 960px)').matches);
  const [notice, setNotice] = useState(null);
  const [creating, setCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState('todo');
  const [creationReturnSelector, setCreationReturnSelector] = useState('[data-create-task-trigger]');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [projectSection, setProjectSection] = useState('board');
  const lock = useRef(false);
  const mutation = { busy, begin: () => { if (lock.current) return false; lock.current = true; setBusy(true); return true; }, end: () => { lock.current = false; setBusy(false); } };
  const projectId = Number(location.pathname.match(/^\/demo\/projects\/(\d+)$/)?.[1]);
  const project = projects.find((item) => item.id === projectId);
  const inProjectList = location.pathname === '/demo/projects';
  const inProject = Boolean(projectId);
  const inTasks = location.pathname === '/demo/tasks';

  useEffect(() => {
    let active = true;
    Promise.all([operations.getTasks(), operations.getProjects(), operations.getTags()]).then(([loadedTasks, loadedProjects, loadedTags]) => {
      if (active) { setTasks(loadedTasks); setProjects(loadedProjects); setTags(loadedTags); setLoading(false); }
    });
    return () => { active = false; };
  }, [operations]);
  useEffect(() => { const media = window.matchMedia('(max-width: 960px)'); const update = () => setNarrow(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { if (!notice) return undefined; const timeout = window.setTimeout(() => setNotice(null), 5000); return () => window.clearTimeout(timeout); }, [notice]);

  if (location.pathname === '/demo' || location.pathname === '/demo/') return <Navigate to="/demo/tasks" replace />;
  if (!inTasks && !inProjectList && !inProject) return <Navigate to="/demo/tasks" replace />;

  const scopedTasks = inProject ? tasks.filter((task) => task.projectId === projectId) : tasks;
  const activeView = inProject ? { ...view, projectId: null } : view;
  const visible = getVisibleTasksByStatus(scopedTasks, activeView, searchQuery);
  const counts = getTaskTabCounts(scopedTasks);
  const totalVisible = taskStatuses.reduce((total, status) => total + visible[status].length, 0);
  const filtered = view.selectedTab !== 'all' || hasActiveTaskFilters(activeView) || Boolean(searchQuery.trim());
  const manual = getActiveSort(view) === 'manual';
  const selectedId = Number(searchParams.get('task'));
  const selectedTask = Number.isInteger(selectedId) ? tasks.find((task) => task.id === selectedId) : null;
  const openTask = (id) => setSearchParams((current) => { const next = new URLSearchParams(current); next.set('task', String(id)); return next; });
  const closeTask = () => { setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('task'); return next; }, { replace: true }); window.requestAnimationFrame(() => document.querySelector(`#task-card-${selectedId} [aria-label^="Edit "]`)?.focus()); };
  const createTag = async (name, color) => { const tag = await operations.createTag({ name, color }); setTags((current) => [...current, tag]); return tag; };
  const updateTag = async (id, name, color) => { const tag = await operations.updateTag(id, { name, color }); setTags((current) => current.map((item) => item.id === id ? tag : item)); setTasks(await operations.getTasks()); };
  const deleteTag = async (id) => { await operations.deleteTag(id); setTags((current) => current.filter((tag) => tag.id !== id)); setTasks(await operations.getTasks()); setView((current) => ({ ...current, tagIds: current.tagIds.filter((tagId) => tagId !== id) })); };
  const dragEnd = async ({ source, destination }) => {
    if (!manual || !destination || (source.droppableId === destination.droppableId && source.index === destination.index) || !mutation.begin()) return;
    try {
      const moved = visible[source.droppableId][source.index];
      if (!moved || (!inProject && moved.projectId)) return;
      const next = structuredClone(tasks);
      const sourceList = next.filter((task) => task.status === source.droppableId && (inProject ? task.projectId === projectId : !task.projectId)).sort((a, b) => a.orderIndex - b.orderIndex);
      const destinationList = source.droppableId === destination.droppableId ? sourceList : next.filter((task) => task.status === destination.droppableId && (inProject ? task.projectId === projectId : !task.projectId)).sort((a, b) => a.orderIndex - b.orderIndex);
      const sourceIndex = sourceList.findIndex((task) => task.id === moved.id);
      sourceList.splice(sourceIndex, 1);
      destinationList.splice(destination.index, 0, moved);
      const updates = (sourceList === destinationList ? sourceList : [...sourceList, ...destinationList]).map((task) => ({ id: task.id, status: destinationList.includes(task) ? destination.droppableId : source.droppableId, orderIndex: (destinationList.includes(task) ? destinationList : sourceList).indexOf(task) }));
      await operations.reorderTasks(updates);
      setTasks(await operations.getTasks());
      setNotice({ tone: 'success', message: `Moved “${moved.title}”.` });
    } catch { setNotice({ tone: 'error', message: 'Could not move the task. Please try again.' }); }
    finally { mutation.end(); }
  };
  const reset = async () => { operations.reset(); setTasks(await operations.getTasks()); setProjects(await operations.getProjects()); setTags(await operations.getTags()); setView(defaultTaskView); setSearchQuery(''); setConfirmReset(false); setNotice({ tone: 'success', message: 'Demo restored to its original tasks.' }); };

  return <WorkspaceOperationsContext.Provider value={operations}><TaskMutationContext.Provider value={mutation}><AppShell demo>
    <div className={styles.banner}><div><strong>Guest workspace</strong><span>Your changes stay in this browser.</span></div><div><a href="/" className={styles.homeLink}>Back to home</a><button type="button" onClick={() => setConfirmReset(true)}>Reset demo</button><a href="/sign-up">Create an account</a></div></div>
    {notice && <div className={`${taskStyles.notice} ${taskStyles[notice.tone]}`} role={notice.tone === 'error' ? 'alert' : 'status'}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><XIcon size={18} /></button></div>}
    {inProjectList ? <div className={styles.projectPage}><header><h1>Projects</h1><p>Browse a shared project and work with its sample tasks.</p></header><div className={styles.projectList}>{projects.map((item) => <Link key={item.id} to={`/demo/projects/${item.id}`}><span>Shared project</span><h2>{item.title}</h2><p>{item.description}</p><small>{tasks.filter((task) => task.projectId === item.id && task.status === 'completed').length} of {tasks.filter((task) => task.projectId === item.id).length} tasks complete · {item.memberships.length} members</small></Link>)}</div><p className={styles.limitNote}>Creating projects, invitations, membership settings, notifications, and AI drafting are available with an account. <a href="/sign-up">Create an account</a></p></div> :
    <div className={taskStyles.tasksPage}>
      {inProject && <Link className={styles.back} to="/demo/projects">All projects</Link>}
      <div className={taskStyles.header}><div><h1 className={taskStyles.title}>{inProject ? project?.title ?? 'Project' : 'My tasks'}</h1><p className={taskStyles.taskTotal}>{inProject ? project?.description : <><strong>{totalVisible}</strong>{filtered ? ` of ${scopedTasks.length}` : ''} {(filtered ? scopedTasks.length : totalVisible) === 1 ? 'task' : 'tasks'} in your workspace</>}</p></div>{(!inProject || projectSection === 'board') && <div className={taskStyles.headerActions}><button className={taskStyles.createButton} data-create-task-trigger type="button" onClick={() => { setCreationStatus('todo'); setCreationReturnSelector('[data-create-task-trigger]'); setCreating(true); }}><PlusIcon size={18} weight="bold" />Create task</button></div>}</div>
      {inProject && <><nav className={styles.projectTabs} aria-label="Project sections"><button type="button" aria-current={projectSection === 'board' ? 'page' : undefined} onClick={() => setProjectSection('board')}>Board</button><button type="button" aria-current={projectSection === 'activity' ? 'page' : undefined} onClick={() => setProjectSection('activity')}>Activity</button></nav><p className={styles.limitNote}>This project is a local sample. Discussion and activity history are read-only; invitations and membership settings require an account. <a href="/sign-up">Create an account</a></p></>}
      {inProject && projectSection === 'activity' ? <div className={styles.activityPanel}><DemoActivity tasks={scopedTasks} /></div> : <>
      <CreateTaskDialog open={creating} title="Create task" onClose={() => setCreating(false)} returnFocusSelector={creationReturnSelector}><CreateTaskForm expanded={creating} initialStatus={creationStatus} fixedProjectId={inProject ? projectId : null} onCreated={() => setCreating(false)} tasks={tasks} setTasks={setTasks} tags={tags} onCreateTag={createTag} onNotify={setNotice} /></CreateTaskDialog>
      <TaskViewTabs selectedTab={view.selectedTab} counts={counts} onSelect={(selectedTab) => setView((current) => ({ ...current, selectedTab }))} />
      {!inProject && <ProjectTagManager tags={tags} onCreateTag={createTag} onUpdateTag={updateTag} onDeleteTag={deleteTag} onNotify={setNotice} />}
      <TaskViewControls view={activeView} searchQuery={searchQuery} onSearchChange={setSearchQuery} onViewChange={setView} onClearFilters={() => { setSearchQuery(''); setView((current) => ({ ...defaultTaskView, selectedTab: current.selectedTab, sorts: current.sorts })); }} projects={projects} tags={tags} showProjectFilter={!inProject} />
      {narrow && <nav className={taskStyles.statusSelectors} aria-label="Task status">{taskStatuses.map((status) => <button type="button" key={status} aria-pressed={selectedStatus === status} onClick={() => setSelectedStatus(status)}>{names[status]} <span>{visible[status].length}</span></button>)}</nav>}
      <div className={taskStyles.taskBoards}><DragDropContext onDragEnd={dragEnd}>{taskStatuses.map((status) => <div key={status} hidden={narrow && selectedStatus !== status}><TaskBoard status={status} tasks={visible[status]} setAllTasks={setTasks} loading={loading} isManualOrder={manual && !busy} isFiltered={filtered} selectedTab={view.selectedTab} projectMode={inProject} onNotify={setNotice} onOpenDetails={openTask} onCreateTask={(nextStatus) => { setCreationStatus(nextStatus); setCreationReturnSelector(`[data-create-status="${nextStatus}"]`); setCreating(true); }} /></div>)}</DragDropContext></div>
      </>}
      {selectedTask && <TaskDetailModal key={selectedTask.id} task={selectedTask} project={selectedTask.projectId ? { ...projects.find((item) => item.id === selectedTask.projectId), tags } : null} personalTags={tags} onCreatePersonalTag={createTag} onCreateProjectTag={createTag} onClose={closeTask} onUpdated={(updated) => setTasks((current) => current.map((task) => task.id === updated.id ? updated : task))} onDeleted={(id) => { setTasks((current) => current.filter((task) => task.id !== id)); closeTask(); }} onNotify={setNotice} />}
    </div>}
    {confirmReset && <ConfirmDialog title="Reset the demo?" confirmLabel="Reset demo" tone="warning" onCancel={() => setConfirmReset(false)} onConfirm={reset}>Your local changes to demo tasks, tags, and checklists will be replaced by the original sample.</ConfirmDialog>}
  </AppShell></TaskMutationContext.Provider></WorkspaceOperationsContext.Provider>;
}

export default DemoWorkspace;
