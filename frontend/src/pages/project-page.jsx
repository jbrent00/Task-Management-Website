import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { DragDropContext } from '@hello-pangea/dnd';
import TaskBoard from '../components/task-board/task-board';
import CreateTaskDialog from '../components/create-task-dialog/create-task-dialog';
import { TaskMutationContext } from '../functions/taskMutationContext';
import { updateTasks } from '../api/updateTasks';
import { createProjectTask, getProjectTasks } from '../api/projectTasks';
import { archiveProject, createProjectTag, deleteProject, deleteProjectTag, getProject, inviteProjectMember, removeProjectMember, restoreProject, revokeProjectInvitation, transferProjectOwnership, updateProject, updateProjectMember, updateProjectTag } from '../api/projects';
import { canChangeProjectTaskAssignments } from '../functions/projectAssignmentPolicy';
import MemberPicker from '../components/member-picker/member-picker';
import Checklist from '../components/checklist/checklist';
import TaskTagPicker from '../components/task-tag-picker/task-tag-picker';
import TagColorPicker from '../components/tag-color-picker/tag-color-picker';
import TaskDetailModal from '../components/task-detail-modal/task-detail-modal';
import TaskSelectField from '../components/task-form-controls/task-select-field';
import TaskDateField from '../components/task-form-controls/task-date-field';
import ActivityTimeline from '../components/activity-timeline/activity-timeline';
import ConfirmDialog from '../components/confirm-dialog/confirm-dialog';
import { AiGenerationError, generateTaskDraft } from '../api/aiGeneration';
import styles from './project-page.module.css';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CaretRightIcon } from '@phosphor-icons/react/dist/csr/CaretRight';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';

const statuses = ['todo', 'in_progress', 'completed'];
const personName = (person) => [person?.fname, person?.lname].filter(Boolean).join(' ') || person?.primaryEmail || 'Member';

export default function ProjectPage() {
    const { projectId } = useParams(); const id = Number(projectId); const navigate = useNavigate(); const [searchParams, setSearchParams] = useSearchParams(); const { getToken, userId } = useAuth();
    const [project, setProject] = useState(null); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
    const [tab, setTab] = useState('board'); const [creating, setCreating] = useState(false); const [creationStatus, setCreationStatus] = useState('todo'); const [creationReturnSelector, setCreationReturnSelector] = useState('[data-create-task-trigger]'); const [mutationBusy, setMutationBusy] = useState(false); const mutationLock = useRef(false);
    const [query, setQuery] = useState(''); const [assigneeFilter, setAssigneeFilter] = useState('all'); const [priorityFilter, setPriorityFilter] = useState('all'); const [dueFilter, setDueFilter] = useState('all');
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const mutation = { busy: mutationBusy, begin: () => { if (mutationLock.current) return false; mutationLock.current = true; setMutationBusy(true); return true; }, end: () => { mutationLock.current = false; setMutationBusy(false); } };
    const load = useCallback(async () => { try { const token = await getToken(); const [details, loadedTasks] = await Promise.all([getProject(token, id), getProjectTasks(token, id)]); setProject(details); setTasks(loadedTasks); setError(''); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); } }, [getToken, id]);
    useEffect(() => { if (Number.isInteger(id)) load(); }, [id, load]);
    useEffect(() => { if (!notice) return undefined; const timeoutId = window.setTimeout(() => setNotice(''), 5000); return () => window.clearTimeout(timeoutId); }, [notice]);
    const filteredTasks = useMemo(() => tasks.filter((task) => {
        const search = query.trim().toLowerCase();
        if (search && !`${task.title} ${task.description ?? ''}`.toLowerCase().includes(search)) return false;
        const assigneeIds = (task.assignees ?? []).map((person) => person.id);
        if (assigneeFilter === 'me' && !assigneeIds.includes(userId)) return false;
        if (assigneeFilter === 'unassigned' && assigneeIds.length) return false;
        if (assigneeFilter.startsWith('member:') && !assigneeIds.includes(assigneeFilter.slice(7))) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        const due = task.dueDate ? new Date(task.dueDate) : null; const now = new Date();
        if (dueFilter === 'overdue' && (!due || due >= now || task.status === 'completed')) return false;
        if (dueFilter === 'upcoming' && (!due || due < now || task.status === 'completed')) return false;
        if (dueFilter === 'none' && due) return false;
        return true;
    }), [tasks, query, assigneeFilter, priorityFilter, dueFilter, userId]);
    const hasFilters = Boolean(query.trim()) || assigneeFilter !== 'all' || priorityFilter !== 'all' || dueFilter !== 'all';
    const tasksByStatus = useMemo(() => Object.fromEntries(statuses.map((status) => [status, filteredTasks.filter((task) => task.status === status).sort((a, b) => a.orderIndex - b.orderIndex)])), [filteredTasks]);
    const canEdit = Boolean(project?.capabilities.canEditTasks);
    const canCreate = Boolean(project?.capabilities.canCreateTasks);
    const notify = ({ message }) => setNotice(message);
    const refreshProject = async () => setProject(await getProject(await getToken(), id));
    const createSharedTag = async (name, color) => {
        const tag = await createProjectTag(await getToken(), id, name, color);
        await refreshProject();
        return tag;
    };
    const selectedTaskId = Number(searchParams.get('task')); const selectedTask = Number.isInteger(selectedTaskId) ? tasks.find((task) => task.id === selectedTaskId) : null;
    const openTask = (taskId) => setSearchParams((current) => { const next = new URLSearchParams(current); next.set('task', String(taskId)); return next; });
    const closeTask = () => { const closingId = selectedTaskId; setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('task'); return next; }); window.requestAnimationFrame(() => document.querySelector(`#task-card-${closingId} [aria-label^="Edit "]`)?.focus()); };
    const dragEnd = async ({ source, destination }) => {
        if (!destination || hasFilters || (source.droppableId === destination.droppableId && source.index === destination.index)) return;
        if (!mutation.begin()) return;
        const previous = tasks; const sourceList = [...tasksByStatus[source.droppableId]]; const destinationList = source.droppableId === destination.droppableId ? sourceList : [...tasksByStatus[destination.droppableId]];
        const [moved] = sourceList.splice(source.index, 1); if (!moved?.capabilities?.canReorder) return; destinationList.splice(destination.index, 0, moved);
        const updates = source.droppableId === destination.droppableId
            ? destinationList.map((task, orderIndex) => ({ ...task, status: destination.droppableId, orderIndex }))
            : [...sourceList.map((task, orderIndex) => ({ ...task, status: source.droppableId, orderIndex })), ...destinationList.map((task, orderIndex) => ({ ...task, status: destination.droppableId, orderIndex }))];
        const byId = new Map(updates.map((task) => [task.id, task])); setTasks((current) => current.map((task) => byId.get(task.id) ?? task));
        try { await updateTasks(await getToken(), updates); setNotice(`Moved “${moved.title}”.`); } catch { setTasks(previous); setError('The task move could not be saved.'); } finally { mutation.end(); }
    };
    if (!Number.isInteger(id)) return <div className={styles.page}><p className={styles.error}>Invalid project.</p></div>;
    if (loading) return <div className={styles.page}><p className={styles.loading}>Loading project…</p></div>;
    if (!project) return <div className={styles.page}><p className={styles.error}>{error || 'Project not found.'}</p></div>;
    return <TaskMutationContext.Provider value={mutation}><div className={styles.page}>
        <Link className={styles.back} to="/projects"><ArrowLeftIcon size={18} />All projects</Link>
        <header className={styles.hero}><div><div className={styles.kickers}><span>{project.role}</span>{project.archivedAt && <span>Archived</span>}</div><h1>{project.title}</h1><p>{project.description || 'No project description.'}</p></div>{canCreate && tab === 'board' && <button className={styles.createTrigger} data-create-task-trigger onClick={() => { setCreationStatus('todo'); setCreationReturnSelector('[data-create-task-trigger]'); setCreating(true); }}><PlusIcon size={18} weight="bold" aria-hidden="true" />Create task</button>}</header>
        {notice && <div className={styles.notice} role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><XIcon size={18} /></button></div>}{error && <p className={styles.error} role="alert">{error}</p>}
        <nav className={styles.tabs} aria-label="Project sections">{['board', 'activity', 'members', 'settings'].map((value) => <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>{value}</button>)}</nav>
        {tab === 'board' && <>
            {canCreate && <CreateTaskDialog open={creating} title="Create project task" onClose={() => setCreating(false)} returnFocusSelector={creationReturnSelector}><CreateProjectTask project={project} currentUserId={userId} tasks={tasks} expanded={creating} initialStatus={creationStatus} onCreate={(task) => { setTasks((current) => [...current, task]); setCreating(false); setNotice(`Created “${task.title}”.`); }} onCreateTag={createSharedTag} getToken={getToken} onError={setError} /></CreateTaskDialog>}
            {canEdit && <ProjectTags project={project} getToken={getToken} onChanged={refreshProject} onError={setError} />}
            <section className={styles.collapsibleTool}><button className={styles.toolToggle} type="button" aria-expanded={filtersExpanded} aria-controls="project-task-filters" onClick={() => setFiltersExpanded((value) => !value)}><span><b>Task filters</b><small>{hasFilters ? `${filteredTasks.length} of ${tasks.length} tasks shown` : 'Search and narrow the project board'}</small></span>{filtersExpanded ? <CaretDownIcon aria-hidden="true" size={18} /> : <CaretRightIcon aria-hidden="true" size={18} />}</button><div id="project-task-filters" className={styles.boardControls} aria-label="Project task filters" hidden={!filtersExpanded}><label>Search tasks<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or description" /></label><TaskSelectField label="Assignee" compact value={assigneeFilter} onChange={setAssigneeFilter} options={[{ value: 'all', label: 'All assignees' }, { value: 'me', label: 'Assigned to me' }, { value: 'unassigned', label: 'Unassigned' }, ...project.memberships.filter((member) => member.role !== 'viewer' && member.userId !== userId).map((member) => ({ value: `member:${member.userId}`, label: personName(member.user) }))]} /><TaskSelectField label="Priority" compact value={priorityFilter} onChange={setPriorityFilter} options={[{ value: 'all', label: 'All priorities' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} /><TaskSelectField label="Due" compact value={dueFilter} onChange={setDueFilter} options={[{ value: 'all', label: 'Any due date' }, { value: 'overdue', label: 'Overdue' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'none', label: 'No due date' }]} /><div className={styles.filterSummary}><span>{filteredTasks.length} of {tasks.length} tasks</span>{hasFilters && <button type="button" onClick={() => { setQuery(''); setAssigneeFilter('all'); setPriorityFilter('all'); setDueFilter('all'); }}>Clear filters</button>}</div></div></section>
            <div className={styles.boards}><DragDropContext onDragEnd={dragEnd}>{statuses.map((status) => <TaskBoard key={status} status={status} tasks={tasksByStatus[status]} setAllTasks={setTasks} loading={false} isManualOrder={!hasFilters && !mutationBusy} isFiltered={hasFilters} selectedTab="all" projectMode onNotify={notify} onOpenDetails={openTask} onCreateTask={canCreate ? (nextStatus) => { setCreationStatus(nextStatus); setCreationReturnSelector(`[data-create-status="${nextStatus}"]`); setCreating(true); } : undefined} />)}</DragDropContext></div>
        </>}
        {tab === 'activity' && <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Project activity</h2><p>Key task, discussion, membership, and settings changes.</p></div></div><ActivityTimeline projectId={id} /></section>}
        {tab === 'members' && <MembersPanel project={project} currentUserId={userId} getToken={getToken} onChanged={load} onError={setError} onDeleted={() => navigate('/projects')} />}
        {tab === 'settings' && <SettingsPanel project={project} getToken={getToken} onChanged={load} onError={setError} onNotify={setNotice} onDeleted={() => navigate('/projects')} />}
        {selectedTask && <TaskDetailModal key={selectedTask.id} task={selectedTask} project={project} onCreateProjectTag={project.role !== 'viewer' && !project.archivedAt ? createSharedTag : undefined} onClose={closeTask} onUpdated={(updated) => setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))} onDeleted={(taskId) => { setTasks((current) => current.filter((item) => item.id !== taskId)); closeTask(); }} onNotify={notify} />}
    </div></TaskMutationContext.Provider>;
}

export function CreateProjectTask({ project, currentUserId, tasks, expanded = true, initialStatus = 'todo', onCreate, onCreateTag, getToken, onError }) {
    const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [status, setStatus] = useState(initialStatus); const [priority, setPriority] = useState('low'); const [dueDate, setDueDate] = useState(''); const [assigneeIds, setAssigneeIds] = useState([]); const [tagIds, setTagIds] = useState([]); const [checklistItems, setChecklistItems] = useState([]); const [saving, setSaving] = useState(false); const [generating, setGenerating] = useState(null); const [aiMessage, setAiMessage] = useState(''); const [confirmationKind, setConfirmationKind] = useState(null);
    const [submitError, setSubmitError] = useState('');
    useEffect(() => { if (expanded) setStatus(initialStatus); }, [initialStatus, expanded]);
    const changeAssignees = (next) => {
        if (canChangeProjectTaskAssignments(project, currentUserId, [], next)) setAssigneeIds(next);
        else onError('Your project permissions do not allow one or more selected assignees.');
    };
    const runGeneration = async (kind) => {
        if (!title.trim() || generating) return;
        setConfirmationKind(null);
        setGenerating(kind); setAiMessage('');
        try {
            const result = await generateTaskDraft(await getToken(), kind === 'description' ? { kind, title } : { kind, title, description });
            if (result.kind === 'description') setDescription(result.description);
            else setChecklistItems(result.items.map((text) => ({ id: `draft-${crypto.randomUUID()}`, text, completed: false })));
            setAiMessage(kind === 'description' ? 'Description generated. Review it before creating the task.' : 'Checklist generated. Review it before creating the task.');
        } catch (error) {
            const message = error instanceof AiGenerationError && error.status === 429 ? `AI limit reached. Try again in about ${error.retryAfterSeconds ?? 60} seconds.` : error.message;
            onError(message);
        } finally { setGenerating(null); }
    };
    const generate = (kind) => {
        const hasContent = kind === 'description' ? Boolean(description.trim()) : checklistItems.length > 0;
        if (hasContent) setConfirmationKind(kind);
        else runGeneration(kind);
    };
    const submit = async (event) => { event.preventDefault(); setSaving(true); setSubmitError(''); try { const orderIndex = Math.max(-1, ...tasks.filter((task) => task.status === status).map((task) => task.orderIndex)) + 1; const created = await createProjectTask(await getToken(), project.id, { title, description, status, priority, dueDate: dueDate || null, orderIndex, assigneeIds, tagIds, checklistItems: checklistItems.map(({ text }) => ({ text })) }); onCreate(created); setTitle(''); setDescription(''); setPriority('low'); setDueDate(''); setAssigneeIds([]); setTagIds([]); setChecklistItems([]); setAiMessage(''); } catch (error) { setSubmitError(`${error.message} Your entries were kept so you can try again.`); } finally { setSaving(false); } };
    return <form className={styles.taskForm} onSubmit={submit}>
        <header className={styles.taskFormHeader}><span>{project.title} / New task</span><h2>New project task</h2><p>Add the work, ownership, and context in one place.</p></header>
        <label className={styles.projectTaskTitle}>Title<input autoFocus required maxLength="100" placeholder="What needs to be done?" value={title} disabled={Boolean(generating)} onChange={(event) => setTitle(event.target.value)} /></label>
        <div className={styles.descriptionField}><div className={styles.fieldHeading}><label htmlFor="project-task-description">Description</label><button type="button" className={styles.inlineAction} disabled={!title.trim() || Boolean(generating)} onClick={() => generate('description')}>{generating === 'description' ? 'Generating…' : 'Generate with AI'}</button></div><textarea id="project-task-description" maxLength="500" value={description} disabled={Boolean(generating)} onChange={(event) => setDescription(event.target.value)} /></div>
        <div className={styles.formGrid}><TaskSelectField label="Status" value={status} onChange={setStatus} options={[{ value: 'todo', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }]} /><TaskSelectField label="Priority" value={priority} onChange={setPriority} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} /><TaskDateField label="Due date" value={dueDate} onChange={setDueDate} /></div>
        <div className={styles.assignmentGrid}><MemberPicker members={project.memberships} selectedIds={assigneeIds} onChange={changeAssignees} /><TaskTagPicker tags={project.tags} selectedIds={tagIds} onChange={setTagIds} onCreateTag={onCreateTag} disabled={Boolean(generating)} /></div>
        <Checklist items={checklistItems} draft defaultExpanded disabled={Boolean(generating)} onGenerate={() => generate('checklist')} generating={generating === 'checklist'} generateDisabled={!title.trim() || Boolean(generating)} onItemsChange={setChecklistItems} onNotify={({ message }) => onError(message)} />
        {aiMessage && <p className={styles.aiMessage} role="status">{aiMessage}</p>}
        {submitError && <p className={styles.error} role="alert">{submitError}</p>}
        <footer className={styles.taskFormFooter}><button className={styles.primary} disabled={saving || Boolean(generating) || !title.trim()}>{saving ? 'Creating…' : 'Create task'}</button></footer>
        {confirmationKind && <ConfirmDialog title={`Replace existing ${confirmationKind}?`} confirmLabel="Replace and generate" tone="warning" onCancel={() => setConfirmationKind(null)} onConfirm={() => runGeneration(confirmationKind)}>Generating new content will replace the {confirmationKind} currently in this form.</ConfirmDialog>}
    </form>;
}

export function ProjectTags({ project, getToken, onChanged, onError }) {
    const [name, setName] = useState(''); const [color, setColor] = useState('blue');
    const [expanded, setExpanded] = useState(false);
    const [adding, setAdding] = useState(false);
    const addTrigger = useRef(null);
    const addInput = useRef(null);
    const [editing, setEditing] = useState(null); const [editName, setEditName] = useState(''); const [editColor, setEditColor] = useState('blue'); const [saving, setSaving] = useState(false);
    const editTrigger = useRef(null);
    const [deleteTarget, setDeleteTarget] = useState(null); const [deleting, setDeleting] = useState(false);
    const closeAdd = () => { setAdding(false); setName(''); window.requestAnimationFrame(() => addTrigger.current?.focus()); };
    const add = async (event) => { event.preventDefault(); try { await createProjectTag(await getToken(), project.id, name, color); await onChanged(); closeAdd(); } catch (error) { onError(error.message); } };
    const startEdit = (tag, trigger) => { editTrigger.current = trigger; setEditing(tag.id); setEditName(tag.name); setEditColor(tag.color); };
    const closeEdit = () => { const tagId = editing; setEditing(null); window.requestAnimationFrame(() => (editTrigger.current?.isConnected ? editTrigger.current : document.querySelector(`[data-tag-edit-id="${tagId}"]`))?.focus()); };
    const saveEdit = async (event) => { event.preventDefault(); if (!editing || saving) return; setSaving(true); try { await updateProjectTag(await getToken(), project.id, editing, editName, editColor); await onChanged(); closeEdit(); } catch (error) { onError(error.message); } finally { setSaving(false); } };
    const remove = async () => { if (!deleteTarget || deleting) return; setDeleting(true); try { await deleteProjectTag(await getToken(), project.id, deleteTarget.id); setDeleteTarget(null); await onChanged(); } catch (error) { setDeleteTarget(null); onError(error.message); } finally { setDeleting(false); } };
    return <section className={styles.collapsibleTool}><button className={styles.toolToggle} type="button" aria-expanded={expanded} aria-controls="project-shared-tags" onClick={() => setExpanded((value) => !value)}><span><b>Shared tags</b><small>{project.tags.length} {project.tags.length === 1 ? 'tag' : 'tags'} available to this project</small></span>{expanded ? <CaretDownIcon aria-hidden="true" size={18} /> : <CaretRightIcon aria-hidden="true" size={18} />}</button>
        <div id="project-shared-tags" className={styles.tagManager} hidden={!expanded}>
            <div className={styles.tagManagerIntro}><div><h2>Tags</h2><p>Available to every task in this project.</p></div><button ref={addTrigger} type="button" className={styles.addTagTrigger} aria-label="Create shared tag" aria-expanded={adding} aria-controls="project-add-tag" onClick={() => { if (adding) closeAdd(); else { setAdding(true); window.requestAnimationFrame(() => addInput.current?.focus()); } }}>{adding ? <XIcon size={16} /> : <PlusIcon size={17} />}</button></div>
            {project.tags.length ? <div className={styles.sharedTagList}>{project.tags.map((tag) => <div className={styles.sharedTagRow} key={tag.id}>{editing === tag.id ? <form className={styles.editTagForm} onSubmit={saveEdit}><input aria-label="Tag name" maxLength="24" required autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} /><TagColorPicker label="Tag color" value={editColor} onChange={setEditColor} name={editName} /><button disabled={saving || !editName.trim()}>{saving ? 'Saving…' : 'Save'}</button><button type="button" onClick={closeEdit}>Cancel</button></form> : <><span className={`${styles.sharedTag} ${styles[`sharedTag_${tag.color}`]}`}>{tag.name}</span><div className={styles.sharedTagActions}><button type="button" data-tag-edit-id={tag.id} onClick={(event) => startEdit(tag, event.currentTarget)} aria-label={`Edit ${tag.name}`} title={`Edit ${tag.name}`}><PencilSimpleIcon size={15} aria-hidden="true" /></button><button type="button" onClick={() => setDeleteTarget(tag)} aria-label={`Delete ${tag.name}`} title={`Delete ${tag.name}`}><TrashIcon size={15} aria-hidden="true" /></button></div></>}</div>)}</div> : <p className={styles.emptyTags}>No shared tags yet. Add one to group related tasks.</p>}
            {adding && <form id="project-add-tag" className={styles.addTagForm} onSubmit={add} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); closeAdd(); } }}><label>New tag<input ref={addInput} maxLength="24" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tag name" required /></label><TagColorPicker value={color} onChange={setColor} name={name} action={<button disabled={!name.trim()}>Add tag</button>} /></form>}
        </div>{deleteTarget && <ConfirmDialog title="Delete shared tag?" confirmLabel="Delete tag" busyLabel="Deleting…" busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={remove}>Delete “{deleteTarget.name}”? It will be removed from every task in this project.</ConfirmDialog>}</section>;
}

export function MembersPanel({ project, currentUserId, getToken, onChanged, onError }) {
    const [email, setEmail] = useState(''); const [role, setRole] = useState('editor');
    const [confirmation, setConfirmation] = useState(null); const [actionBusy, setActionBusy] = useState(false);
    const owner = project.role === 'owner'; const act = async (callback) => { setActionBusy(true); try { await callback(await getToken()); await onChanged(); onError(''); } catch (error) { onError(error.message); } finally { setActionBusy(false); } };
    const invite = async (event) => { event.preventDefault(); try { await inviteProjectMember(await getToken(), project.id, email, role); setEmail(''); await onChanged(); onError(''); } catch (error) { onError(error.message); } };
    const confirmMemberAction = async () => {
        const target = confirmation;
        if (!target || actionBusy) return;
        if (target.kind === 'transfer') await act((token) => transferProjectOwnership(token, project.id, target.member.userId));
        else await act((token) => removeProjectMember(token, project.id, target.member.userId));
        setConfirmation(null);
    };
    return <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Members</h2><p>Owners manage the workspace, editors collaborate according to the task settings, and viewers have read-only access.</p></div></div>{owner && !project.archivedAt && <form className={styles.inviteForm} onSubmit={invite}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" /></label><TaskSelectField label="Role" compact value={role} onChange={setRole} options={[{ value: 'editor', label: 'Editor, collaborates on tasks' }, { value: 'viewer', label: 'Viewer, read only' }]} /><button className={styles.primary}>Add in-app invitation</button></form>}
        <div className={styles.memberList}>{project.memberships.map((member) => <article key={member.userId}><div className={styles.person}>{member.user.imageUrl ? <img src={member.user.imageUrl} alt="" /> : <span>{personName(member.user).slice(0,1)}</span>}<div><strong>{personName(member.user)} {member.userId === currentUserId && '(you)'}</strong><small>{member.user.primaryEmail}</small></div></div><div className={styles.memberActions}>{owner && member.role !== 'owner' && !project.archivedAt ? <TaskSelectField label={`Role for ${personName(member.user)}`} hideLabel compact value={member.role} disabled={actionBusy} onChange={(nextRole) => act((token) => updateProjectMember(token, project.id, member.userId, nextRole))} options={[{ value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }]} /> : <span className={styles.role}>{member.role}</span>}{owner && member.role === 'editor' && !project.archivedAt && <button disabled={actionBusy} onClick={() => setConfirmation({ kind: 'transfer', member })}>Make owner</button>}{member.role !== 'owner' && (owner || member.userId === currentUserId) && <button disabled={actionBusy} className={styles.dangerText} onClick={() => setConfirmation({ kind: 'remove', member })}>{member.userId === currentUserId ? 'Leave' : 'Remove'}</button>}</div></article>)}</div>
        {owner && project.invitations?.length > 0 && <div className={styles.pending}><h3>Pending invitations</h3>{project.invitations.map((invite) => <div key={invite.id}><span><strong>{invite.email}</strong> · {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}</span><button onClick={() => act((token) => revokeProjectInvitation(token, project.id, invite.id))}>Revoke</button></div>)}</div>}
        {confirmation?.kind === 'transfer' && <ConfirmDialog title="Transfer project ownership?" confirmLabel="Transfer ownership" tone="warning" busyLabel="Transferring…" busy={actionBusy} onCancel={() => setConfirmation(null)} onConfirm={confirmMemberAction}>{personName(confirmation.member.user)} will become the owner, and you will become an editor.</ConfirmDialog>}
        {confirmation?.kind === 'remove' && <ConfirmDialog title={confirmation.member.userId === currentUserId ? 'Leave project?' : 'Remove project member?'} confirmLabel={confirmation.member.userId === currentUserId ? 'Leave project' : 'Remove member'} busyLabel="Updating…" busy={actionBusy} onCancel={() => setConfirmation(null)} onConfirm={confirmMemberAction}>{confirmation.member.userId === currentUserId ? `You will lose access to “${project.title}”.` : `${personName(confirmation.member.user)} will lose access to this project and will be unassigned from its tasks.`}</ConfirmDialog>}
    </section>;
}

export function SettingsPanel({ project, getToken, onChanged, onError, onNotify, onDeleted }) {
    const [title, setTitle] = useState(project.title); const [description, setDescription] = useState(project.description ?? ''); const [confirmTitle, setConfirmTitle] = useState(''); const [saving, setSaving] = useState(false); const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false); const [deleting, setDeleting] = useState(false); const owner = project.role === 'owner';
    const [policies, setPolicies] = useState({ editorsCanCreateTasks: project.editorsCanCreateTasks, editorsCanAssignOthers: project.editorsCanAssignOthers, editorsCanEditAllTasks: project.editorsCanEditAllTasks, editorsCanJoinTasks: project.editorsCanJoinTasks, editorsCanLeaveTasks: project.editorsCanLeaveTasks });
    const act = async (callback, after = onChanged) => { try { await callback(await getToken()); await after(); } catch (error) { onError(error.message); } };
    if (!owner) return <section className={styles.panel}><h2>Project settings</h2><p>Only the project owner can change settings.</p></section>;
    const toggle = (key) => setPolicies((current) => ({ ...current, [key]: !current[key] }));
    const saveSettings = async (event) => { event.preventDefault(); setSaving(true); onError(''); try { await updateProject(await getToken(), project.id, title, description, policies); await onChanged(); onNotify('Project settings saved.'); } catch (error) { onError(error.message); } finally { setSaving(false); } };
    const deletePermanently = async () => {
        if (confirmTitle !== project.title || deleting) return;
        setDeleting(true);
        try {
            await deleteProject(await getToken(), project.id, confirmTitle);
            await onDeleted();
        } catch (error) {
            onError(error.message);
            setDeleteConfirmationOpen(false);
        } finally { setDeleting(false); }
    };
    return <section className={styles.panel}><h2>Project settings</h2>{!project.archivedAt && <form className={styles.settingsForm} onSubmit={saveSettings}><label>Name<input required maxLength="100" value={title} disabled={saving} onChange={(event) => setTitle(event.target.value)} /></label><label>Description<textarea maxLength="500" value={description} disabled={saving} onChange={(event) => setDescription(event.target.value)} /></label><fieldset className={styles.policySettings} disabled={saving}><legend>Task collaboration</legend><div className={styles.policyHeading}><p>Choose how editors can work inside this project. Owners always retain full control.</p><button type="button" onClick={() => setPolicies({ editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanJoinTasks: true, editorsCanLeaveTasks: true })}>Restore defaults</button></div><PolicyToggle checked={policies.editorsCanCreateTasks} onChange={() => toggle('editorsCanCreateTasks')} title="Editors can create tasks" description="Allow editors to add new work to this project." /><PolicyToggle checked={policies.editorsCanAssignOthers} onChange={() => toggle('editorsCanAssignOthers')} title="Editors can assign other members" description="Allow editors to assign, reassign, or unassign teammates." /><PolicyToggle checked={policies.editorsCanEditAllTasks} onChange={() => toggle('editorsCanEditAllTasks')} title="Editors can edit every task" description="When off, editors edit only assigned work and unassigned tasks they created." /><PolicyToggle checked={policies.editorsCanJoinTasks} onChange={() => toggle('editorsCanJoinTasks')} title="Editors can join tasks" description="Allow editors to add themselves to tasks." /><PolicyToggle checked={policies.editorsCanLeaveTasks} onChange={() => toggle('editorsCanLeaveTasks')} title="Editors can leave tasks" description="Allow editors to remove themselves from tasks." /></fieldset><button className={styles.primary} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></form>}<div className={styles.settingRow}><div><strong>{project.archivedAt ? 'Restore project' : 'Archive project'}</strong><p>{project.archivedAt ? 'Return this project to active work.' : 'Make this project read-only and hide its tasks from My tasks.'}</p></div><button onClick={() => act((token) => project.archivedAt ? restoreProject(token, project.id) : archiveProject(token, project.id))}>{project.archivedAt ? 'Restore' : 'Archive'}</button></div><div className={`${styles.settingRow} ${styles.dangerZone}`}><div><strong>Delete project permanently</strong><p>This deletes every project task, tag, membership, and invitation. Enter <b>{project.title}</b> to confirm.</p><input aria-label="Type project name to confirm deletion" value={confirmTitle} disabled={deleting} onChange={(event) => setConfirmTitle(event.target.value)} /></div><button disabled={confirmTitle !== project.title || deleting} onClick={() => setDeleteConfirmationOpen(true)}>Delete project</button></div>{deleteConfirmationOpen && <ConfirmDialog title="Permanently delete project?" confirmLabel="Delete project" busyLabel="Deleting…" busy={deleting} onCancel={() => setDeleteConfirmationOpen(false)} onConfirm={deletePermanently}>Delete “{project.title}” and all of its tasks, tags, memberships, and invitations? This cannot be undone.</ConfirmDialog>}</section>;
}

function PolicyToggle({ checked, onChange, title, description }) {
    return <label className={styles.policyToggle}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={onChange} /></label>;
}
