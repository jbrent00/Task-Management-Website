import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { DragDropContext } from '@hello-pangea/dnd';
import TaskBoard from '../components/task-board/task-board';
import { TaskMutationContext } from '../functions/taskMutationContext';
import { updateTasks } from '../api/updateTasks';
import { createProjectTask, getProjectTasks } from '../api/projectTasks';
import { archiveProject, createProjectTag, deleteProject, deleteProjectTag, getProject, inviteProjectMember, removeProjectMember, restoreProject, revokeProjectInvitation, transferProjectOwnership, updateProject, updateProjectMember } from '../api/projects';
import { canChangeProjectTaskAssignments } from '../functions/projectAssignmentPolicy';
import MemberPicker from '../components/member-picker/member-picker';
import Checklist from '../components/checklist/checklist';
import TaskDetailModal from '../components/task-detail-modal/task-detail-modal';
import ActivityTimeline from '../components/activity-timeline/activity-timeline';
import { AiGenerationError, generateTaskDraft } from '../api/aiGeneration';
import styles from './project-page.module.css';

const statuses = ['todo', 'in_progress', 'completed'];
const personName = (person) => [person?.fname, person?.lname].filter(Boolean).join(' ') || person?.primaryEmail || 'Member';

export default function ProjectPage() {
    const { projectId } = useParams(); const id = Number(projectId); const navigate = useNavigate(); const [searchParams, setSearchParams] = useSearchParams(); const { getToken, userId } = useAuth();
    const [project, setProject] = useState(null); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
    const [tab, setTab] = useState('board'); const [creating, setCreating] = useState(false); const [mutationBusy, setMutationBusy] = useState(false); const mutationLock = useRef(false);
    const [query, setQuery] = useState(''); const [assigneeFilter, setAssigneeFilter] = useState('all'); const [priorityFilter, setPriorityFilter] = useState('all'); const [dueFilter, setDueFilter] = useState('all');
    const [filtersExpanded, setFiltersExpanded] = useState(() => !window.matchMedia('(max-width: 680px)').matches);
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
    const selectedTaskId = Number(searchParams.get('task')); const selectedTask = Number.isInteger(selectedTaskId) ? tasks.find((task) => task.id === selectedTaskId) : null;
    const openTask = (taskId) => setSearchParams((current) => { const next = new URLSearchParams(current); next.set('task', String(taskId)); return next; });
    const closeTask = () => { const closingId = selectedTaskId; setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('task'); return next; }); window.requestAnimationFrame(() => document.querySelector(`#task-card-${closingId} [aria-haspopup="menu"]`)?.focus()); };
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
    if (loading) return <div className={styles.page}><p>Loading project…</p></div>;
    if (!project) return <div className={styles.page}><p className={styles.error}>{error || 'Project not found.'}</p></div>;
    return <TaskMutationContext.Provider value={mutation}><div className={styles.page}>
        <Link className={styles.back} to="/projects">← All projects</Link>
        <header className={styles.hero}><div><div className={styles.kickers}><span>{project.role}</span>{project.archivedAt && <span>Archived</span>}</div><h1>{project.title}</h1><p>{project.description || 'No project description.'}</p></div>{canCreate && tab === 'board' && <button className={styles.primary} onClick={() => setCreating((value) => !value)}>{creating ? 'Cancel' : 'Create task'}</button>}</header>
        {notice && <div className={styles.notice} role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}{error && <p className={styles.error} role="alert">{error}</p>}
        <nav className={styles.tabs} aria-label="Project sections">{['board', 'activity', 'members', 'settings'].map((value) => <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>{value}</button>)}</nav>
        {tab === 'board' && <>
            {creating && <CreateProjectTask project={project} currentUserId={userId} tasks={tasks} onCreate={(task) => { setTasks((current) => [...current, task]); setCreating(false); setNotice(`Created “${task.title}”.`); }} getToken={getToken} onError={setError} />}
            {canEdit && <ProjectTags project={project} getToken={getToken} onChanged={refreshProject} onError={setError} />}
            <section className={styles.collapsibleTool}><button className={styles.toolToggle} type="button" aria-expanded={filtersExpanded} aria-controls="project-task-filters" onClick={() => setFiltersExpanded((value) => !value)}><span><b>Task filters</b><small>{hasFilters ? `${filteredTasks.length} of ${tasks.length} tasks shown` : 'Search and narrow the project board'}</small></span><span aria-hidden="true">{filtersExpanded ? '−' : '+'}</span></button><div id="project-task-filters" className={styles.boardControls} aria-label="Project task filters" hidden={!filtersExpanded}><label>Search tasks<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or description" /></label><label>Assignee<select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option value="all">All assignees</option><option value="me">Assigned to me</option><option value="unassigned">Unassigned</option>{project.memberships.filter((member) => member.role !== 'viewer' && member.userId !== userId).map((member) => <option key={member.userId} value={`member:${member.userId}`}>{personName(member.user)}</option>)}</select></label><label>Priority<select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Due<select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)}><option value="all">Any due date</option><option value="overdue">Overdue</option><option value="upcoming">Upcoming</option><option value="none">No due date</option></select></label><div className={styles.filterSummary}><span>{filteredTasks.length} of {tasks.length} tasks</span>{hasFilters && <button type="button" onClick={() => { setQuery(''); setAssigneeFilter('all'); setPriorityFilter('all'); setDueFilter('all'); }}>Clear filters</button>}</div></div></section>
            <div className={styles.boards}><DragDropContext onDragEnd={dragEnd}>{statuses.map((status) => <TaskBoard key={status} status={status} tasks={tasksByStatus[status]} allTasks={tasks} setAllTasks={setTasks} loading={false} isManualOrder={!hasFilters && !mutationBusy} isFiltered={hasFilters} selectedTab="all" projects={[project]} tags={project.tags} members={project.memberships} projectMode onCreateTag={async (name, color) => { const tag = await createProjectTag(await getToken(), id, name, color); await refreshProject(); return tag; }} onNotify={notify} onOpenDetails={openTask} />)}</DragDropContext></div>
        </>}
        {tab === 'activity' && <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Project activity</h2><p>Key task, discussion, membership, and settings changes.</p></div></div><ActivityTimeline projectId={id} /></section>}
        {tab === 'members' && <MembersPanel project={project} currentUserId={userId} getToken={getToken} onChanged={load} onError={setError} onDeleted={() => navigate('/projects')} />}
        {tab === 'settings' && <SettingsPanel project={project} getToken={getToken} onChanged={load} onError={setError} onNotify={setNotice} onDeleted={() => navigate('/projects')} />}
        {selectedTask && <TaskDetailModal key={selectedTask.id} task={selectedTask} project={project} onClose={closeTask} onUpdated={(updated) => setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))} onDeleted={(taskId) => { setTasks((current) => current.filter((item) => item.id !== taskId)); closeTask(); }} onNotify={notify} />}
    </div></TaskMutationContext.Provider>;
}

function CreateProjectTask({ project, currentUserId, tasks, onCreate, getToken, onError }) {
    const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [priority, setPriority] = useState('low'); const [dueDate, setDueDate] = useState(''); const [assigneeIds, setAssigneeIds] = useState([]); const [tagIds, setTagIds] = useState([]); const [checklistItems, setChecklistItems] = useState([]); const [saving, setSaving] = useState(false); const [generating, setGenerating] = useState(null); const [aiMessage, setAiMessage] = useState('');
    const changeAssignees = (next) => {
        if (canChangeProjectTaskAssignments(project, currentUserId, [], next)) setAssigneeIds(next);
        else onError('Your project permissions do not allow one or more selected assignees.');
    };
    const generate = async (kind) => {
        if (!title.trim() || generating) return;
        if ((kind === 'description' && description.trim()) || (kind === 'checklist' && checklistItems.length)) if (!window.confirm(`Replace the current ${kind}?`)) return;
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
    const submit = async (event) => { event.preventDefault(); setSaving(true); try { const orderIndex = tasks.filter((task) => task.status === 'todo').length; onCreate(await createProjectTask(await getToken(), project.id, { title, description, priority, dueDate: dueDate || null, orderIndex, assigneeIds, tagIds, checklistItems: checklistItems.map(({ text }) => ({ text })) })); } catch (error) { onError(error.message); } finally { setSaving(false); } };
    return <form className={styles.taskForm} onSubmit={submit}>
        <label>Title<input autoFocus required maxLength="100" value={title} disabled={Boolean(generating)} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Description <button type="button" className={styles.inlineAction} disabled={!title.trim() || Boolean(generating)} onClick={() => generate('description')}>{generating === 'description' ? 'Generating…' : 'Generate with AI'}</button><textarea maxLength="500" value={description} disabled={Boolean(generating)} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className={styles.formGrid}><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><MemberPicker members={project.memberships} selectedIds={assigneeIds} onChange={changeAssignees} /></div>
        <fieldset><legend>Tags</legend><div className={styles.tagChoices}>{project.tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={tagIds.includes(tag.id)} onChange={() => setTagIds((current) => current.includes(tag.id) ? current.filter((id) => id !== tag.id) : [...current, tag.id])} />{tag.name}</label>)}</div></fieldset>
        <Checklist items={checklistItems} draft disabled={Boolean(generating)} onGenerate={() => generate('checklist')} generating={generating === 'checklist'} generateDisabled={!title.trim() || Boolean(generating)} onItemsChange={setChecklistItems} onNotify={({ message }) => onError(message)} />
        {aiMessage && <p className={styles.aiMessage} role="status">{aiMessage}</p>}
        <button className={styles.primary} disabled={saving || Boolean(generating) || !title.trim()}>{saving ? 'Creating…' : 'Create task'}</button>
    </form>;
}

function ProjectTags({ project, getToken, onChanged, onError }) {
    const [name, setName] = useState(''); const [color, setColor] = useState('blue');
    const [expanded, setExpanded] = useState(() => !window.matchMedia('(max-width: 680px)').matches);
    const add = async (event) => { event.preventDefault(); try { await createProjectTag(await getToken(), project.id, name, color); setName(''); await onChanged(); } catch (error) { onError(error.message); } };
    return <section className={styles.collapsibleTool}><button className={styles.toolToggle} type="button" aria-expanded={expanded} aria-controls="project-shared-tags" onClick={() => setExpanded((value) => !value)}><span><b>Shared tags</b><small>{project.tags.length} {project.tags.length === 1 ? 'tag' : 'tags'} available to this project</small></span><span aria-hidden="true">{expanded ? '−' : '+'}</span></button><div id="project-shared-tags" className={styles.tagManager} hidden={!expanded}><div>{project.tags.map((tag) => <span key={tag.id}>{tag.name}<button aria-label={`Delete ${tag.name}`} onClick={async () => { try { await deleteProjectTag(await getToken(), project.id, tag.id); await onChanged(); } catch (error) { onError(error.message); } }}>×</button></span>)}</div><form onSubmit={add}><input maxLength="24" value={name} onChange={(event) => setName(event.target.value)} placeholder="New project tag" aria-label="New project tag" /><select value={color} onChange={(event) => setColor(event.target.value)} aria-label="New tag color">{['slate','red','orange','yellow','green','teal','blue','purple'].map((value) => <option key={value}>{value}</option>)}</select><button disabled={!name.trim()}>Add tag</button></form></div></section>;
}

function MembersPanel({ project, currentUserId, getToken, onChanged, onError }) {
    const [email, setEmail] = useState(''); const [role, setRole] = useState('editor');
    const owner = project.role === 'owner'; const act = async (callback) => { try { await callback(await getToken()); await onChanged(); onError(''); } catch (error) { onError(error.message); } };
    const invite = async (event) => { event.preventDefault(); try { await inviteProjectMember(await getToken(), project.id, email, role); setEmail(''); await onChanged(); onError(''); } catch (error) { onError(error.message); } };
    return <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Members</h2><p>Owners manage the workspace, editors collaborate according to the task settings, and viewers have read-only access.</p></div></div>{owner && !project.archivedAt && <form className={styles.inviteForm} onSubmit={invite}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" /></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="editor">Editor — collaborates on tasks</option><option value="viewer">Viewer — read only</option></select></label><button className={styles.primary}>Add in-app invitation</button></form>}
        <div className={styles.memberList}>{project.memberships.map((member) => <article key={member.userId}><div className={styles.person}>{member.user.imageUrl ? <img src={member.user.imageUrl} alt="" /> : <span>{personName(member.user).slice(0,1)}</span>}<div><strong>{personName(member.user)} {member.userId === currentUserId && '(you)'}</strong><small>{member.user.primaryEmail}</small></div></div><div className={styles.memberActions}>{owner && member.role !== 'owner' && !project.archivedAt ? <select value={member.role} onChange={(event) => { const nextRole = event.target.value; act((token) => updateProjectMember(token, project.id, member.userId, nextRole)); }}><option value="editor">Editor</option><option value="viewer">Viewer</option></select> : <span className={styles.role}>{member.role}</span>}{owner && member.role === 'editor' && !project.archivedAt && <button onClick={() => window.confirm(`Transfer ownership to ${personName(member.user)}? You will become an editor.`) && act((token) => transferProjectOwnership(token, project.id, member.userId))}>Make owner</button>}{member.role !== 'owner' && (owner || member.userId === currentUserId) && <button className={styles.dangerText} onClick={() => window.confirm(`Remove ${personName(member.user)} from this project?`) && act((token) => removeProjectMember(token, project.id, member.userId))}>{member.userId === currentUserId ? 'Leave' : 'Remove'}</button>}</div></article>)}</div>
        {owner && project.invitations?.length > 0 && <div className={styles.pending}><h3>Pending invitations</h3>{project.invitations.map((invite) => <div key={invite.id}><span><strong>{invite.email}</strong> · {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}</span><button onClick={() => act((token) => revokeProjectInvitation(token, project.id, invite.id))}>Revoke</button></div>)}</div>}
    </section>;
}

function SettingsPanel({ project, getToken, onChanged, onError, onNotify, onDeleted }) {
    const [title, setTitle] = useState(project.title); const [description, setDescription] = useState(project.description ?? ''); const [confirmTitle, setConfirmTitle] = useState(''); const [saving, setSaving] = useState(false); const owner = project.role === 'owner';
    const [policies, setPolicies] = useState({ editorsCanCreateTasks: project.editorsCanCreateTasks, editorsCanAssignOthers: project.editorsCanAssignOthers, editorsCanEditAllTasks: project.editorsCanEditAllTasks, editorsCanJoinTasks: project.editorsCanJoinTasks, editorsCanLeaveTasks: project.editorsCanLeaveTasks });
    const act = async (callback, after = onChanged) => { try { await callback(await getToken()); await after(); } catch (error) { onError(error.message); } };
    if (!owner) return <section className={styles.panel}><h2>Project settings</h2><p>Only the project owner can change settings.</p></section>;
    const toggle = (key) => setPolicies((current) => ({ ...current, [key]: !current[key] }));
    const saveSettings = async (event) => { event.preventDefault(); setSaving(true); onError(''); try { await updateProject(await getToken(), project.id, title, description, policies); await onChanged(); onNotify('Project settings saved.'); } catch (error) { onError(error.message); } finally { setSaving(false); } };
    return <section className={styles.panel}><h2>Project settings</h2>{!project.archivedAt && <form className={styles.settingsForm} onSubmit={saveSettings}><label>Name<input required maxLength="100" value={title} disabled={saving} onChange={(event) => setTitle(event.target.value)} /></label><label>Description<textarea maxLength="500" value={description} disabled={saving} onChange={(event) => setDescription(event.target.value)} /></label><fieldset className={styles.policySettings} disabled={saving}><legend>Task collaboration</legend><div className={styles.policyHeading}><p>Choose how editors can work inside this project. Owners always retain full control.</p><button type="button" onClick={() => setPolicies({ editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanJoinTasks: true, editorsCanLeaveTasks: true })}>Restore defaults</button></div><PolicyToggle checked={policies.editorsCanCreateTasks} onChange={() => toggle('editorsCanCreateTasks')} title="Editors can create tasks" description="Allow editors to add new work to this project." /><PolicyToggle checked={policies.editorsCanAssignOthers} onChange={() => toggle('editorsCanAssignOthers')} title="Editors can assign other members" description="Allow editors to assign, reassign, or unassign teammates." /><PolicyToggle checked={policies.editorsCanEditAllTasks} onChange={() => toggle('editorsCanEditAllTasks')} title="Editors can edit every task" description="When off, editors edit only assigned work and unassigned tasks they created." /><PolicyToggle checked={policies.editorsCanJoinTasks} onChange={() => toggle('editorsCanJoinTasks')} title="Editors can join tasks" description="Allow editors to add themselves to tasks." /><PolicyToggle checked={policies.editorsCanLeaveTasks} onChange={() => toggle('editorsCanLeaveTasks')} title="Editors can leave tasks" description="Allow editors to remove themselves from tasks." /></fieldset><button className={styles.primary} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></form>}<div className={styles.settingRow}><div><strong>{project.archivedAt ? 'Restore project' : 'Archive project'}</strong><p>{project.archivedAt ? 'Return this project to active work.' : 'Make this project read-only and hide its tasks from My tasks.'}</p></div><button onClick={() => act((token) => project.archivedAt ? restoreProject(token, project.id) : archiveProject(token, project.id))}>{project.archivedAt ? 'Restore' : 'Archive'}</button></div><div className={`${styles.settingRow} ${styles.dangerZone}`}><div><strong>Delete project permanently</strong><p>This deletes every project task, tag, membership, and invitation. Enter <b>{project.title}</b> to confirm.</p><input value={confirmTitle} onChange={(event) => setConfirmTitle(event.target.value)} /></div><button disabled={confirmTitle !== project.title} onClick={() => act((token) => deleteProject(token, project.id, confirmTitle), onDeleted)}>Delete project</button></div></section>;
}

function PolicyToggle({ checked, onChange, title, description }) {
    return <label className={styles.policyToggle}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={onChange} /></label>;
}
