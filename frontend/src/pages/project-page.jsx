import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { DragDropContext } from '@hello-pangea/dnd';
import TaskBoard from '../components/task-board/task-board';
import { TaskMutationContext } from '../functions/taskMutationContext';
import { updateTasks } from '../api/updateTasks';
import { createProjectTask, getProjectTasks } from '../api/projectTasks';
import { archiveProject, createProjectTag, deleteProject, deleteProjectTag, getProject, inviteProjectMember, removeProjectMember, restoreProject, revokeProjectInvitation, transferProjectOwnership, updateProject, updateProjectMember } from '../api/projects';
import styles from './project-page.module.css';

const statuses = ['todo', 'in_progress', 'completed'];
const personName = (person) => [person?.fname, person?.lname].filter(Boolean).join(' ') || person?.primaryEmail || 'Member';

export default function ProjectPage() {
    const { projectId } = useParams(); const id = Number(projectId); const navigate = useNavigate(); const { getToken, userId } = useAuth();
    const [project, setProject] = useState(null); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
    const [tab, setTab] = useState('board'); const [creating, setCreating] = useState(false); const [mutationBusy, setMutationBusy] = useState(false); const mutationLock = useRef(false);
    const mutation = { busy: mutationBusy, begin: () => { if (mutationLock.current) return false; mutationLock.current = true; setMutationBusy(true); return true; }, end: () => { mutationLock.current = false; setMutationBusy(false); } };
    const load = useCallback(async () => { try { const token = await getToken(); const [details, loadedTasks] = await Promise.all([getProject(token, id), getProjectTasks(token, id)]); setProject(details); setTasks(loadedTasks); setError(''); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); } }, [getToken, id]);
    useEffect(() => { if (Number.isInteger(id)) load(); }, [id, load]);
    const tasksByStatus = useMemo(() => Object.fromEntries(statuses.map((status) => [status, tasks.filter((task) => task.status === status).sort((a, b) => a.orderIndex - b.orderIndex)])), [tasks]);
    const canEdit = Boolean(project?.capabilities.canEditTasks);
    const notify = ({ message }) => setNotice(message);
    const refreshProject = async () => setProject(await getProject(await getToken(), id));
    const dragEnd = async ({ source, destination }) => {
        if (!destination || !canEdit || (source.droppableId === destination.droppableId && source.index === destination.index)) return;
        if (!mutation.begin()) return;
        const previous = tasks; const sourceList = [...tasksByStatus[source.droppableId]]; const destinationList = source.droppableId === destination.droppableId ? sourceList : [...tasksByStatus[destination.droppableId]];
        const [moved] = sourceList.splice(source.index, 1); destinationList.splice(destination.index, 0, moved);
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
        <header className={styles.hero}><div><div className={styles.kickers}><span>{project.role}</span>{project.archivedAt && <span>Archived</span>}</div><h1>{project.title}</h1><p>{project.description || 'No project description.'}</p></div>{canEdit && tab === 'board' && <button className={styles.primary} onClick={() => setCreating((value) => !value)}>{creating ? 'Cancel' : 'Create task'}</button>}</header>
        {notice && <div className={styles.notice} role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}{error && <p className={styles.error} role="alert">{error}</p>}
        <nav className={styles.tabs} aria-label="Project sections">{['board', 'members', 'settings'].map((value) => <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>{value}</button>)}</nav>
        {tab === 'board' && <>
            {creating && <CreateProjectTask project={project} tasks={tasks} onCreate={(task) => { setTasks((current) => [...current, task]); setCreating(false); setNotice(`Created “${task.title}”.`); }} getToken={getToken} onError={setError} />}
            {canEdit && <ProjectTags project={project} getToken={getToken} onChanged={refreshProject} onError={setError} />}
            <div className={styles.boards}><DragDropContext onDragEnd={dragEnd}>{statuses.map((status) => <TaskBoard key={status} status={status} tasks={tasksByStatus[status]} allTasks={tasks} setAllTasks={setTasks} loading={false} isManualOrder={canEdit && !mutationBusy} isFiltered={false} selectedTab="all" projects={[project]} tags={project.tags} members={project.memberships} projectMode onCreateTag={async (name, color) => { const tag = await createProjectTag(await getToken(), id, name, color); await refreshProject(); return tag; }} onNotify={notify} />)}</DragDropContext></div>
        </>}
        {tab === 'members' && <MembersPanel project={project} currentUserId={userId} getToken={getToken} onChanged={refreshProject} onError={setError} onDeleted={() => navigate('/projects')} />}
        {tab === 'settings' && <SettingsPanel project={project} getToken={getToken} onChanged={load} onError={setError} onDeleted={() => navigate('/projects')} />}
    </div></TaskMutationContext.Provider>;
}

function CreateProjectTask({ project, tasks, onCreate, getToken, onError }) {
    const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [priority, setPriority] = useState('low'); const [dueDate, setDueDate] = useState(''); const [assigneeId, setAssigneeId] = useState(''); const [tagIds, setTagIds] = useState([]); const [saving, setSaving] = useState(false);
    const eligible = project.memberships.filter((member) => member.role !== 'viewer');
    const submit = async (event) => { event.preventDefault(); setSaving(true); try { const orderIndex = tasks.filter((task) => task.status === 'todo').length; onCreate(await createProjectTask(await getToken(), project.id, { title, description, priority, dueDate: dueDate || null, orderIndex, assigneeId: assigneeId || null, tagIds, checklistItems: [] })); } catch (error) { onError(error.message); } finally { setSaving(false); } };
    return <form className={styles.taskForm} onSubmit={submit}><label>Title<input autoFocus required maxLength="100" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Description<textarea maxLength="500" value={description} onChange={(event) => setDescription(event.target.value)} /></label><div className={styles.formGrid}><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><label>Assignee<select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}><option value="">Unassigned</option>{eligible.map((member) => <option key={member.userId} value={member.userId}>{personName(member.user)}</option>)}</select></label></div><fieldset><legend>Tags</legend><div className={styles.tagChoices}>{project.tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={tagIds.includes(tag.id)} onChange={() => setTagIds((current) => current.includes(tag.id) ? current.filter((id) => id !== tag.id) : [...current, tag.id])} />{tag.name}</label>)}</div></fieldset><button className={styles.primary} disabled={saving || !title.trim()}>{saving ? 'Creating…' : 'Create task'}</button></form>;
}

function ProjectTags({ project, getToken, onChanged, onError }) {
    const [name, setName] = useState(''); const [color, setColor] = useState('blue');
    const add = async (event) => { event.preventDefault(); try { await createProjectTag(await getToken(), project.id, name, color); setName(''); await onChanged(); } catch (error) { onError(error.message); } };
    return <section className={styles.tagManager}><strong>Shared tags</strong><div>{project.tags.map((tag) => <span key={tag.id}>{tag.name}<button aria-label={`Delete ${tag.name}`} onClick={async () => { try { await deleteProjectTag(await getToken(), project.id, tag.id); await onChanged(); } catch (error) { onError(error.message); } }}>×</button></span>)}</div><form onSubmit={add}><input maxLength="24" value={name} onChange={(event) => setName(event.target.value)} placeholder="New project tag" /><select value={color} onChange={(event) => setColor(event.target.value)}>{['slate','red','orange','yellow','green','teal','blue','purple'].map((value) => <option key={value}>{value}</option>)}</select><button disabled={!name.trim()}>Add tag</button></form></section>;
}

function MembersPanel({ project, currentUserId, getToken, onChanged, onError }) {
    const [email, setEmail] = useState(''); const [role, setRole] = useState('editor');
    const owner = project.role === 'owner'; const act = async (callback) => { try { await callback(await getToken()); await onChanged(); onError(''); } catch (error) { onError(error.message); } };
    const invite = async (event) => { event.preventDefault(); try { await inviteProjectMember(await getToken(), project.id, email, role); setEmail(''); await onChanged(); onError(''); } catch (error) { onError(error.message); } };
    return <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Members</h2><p>Everyone here can see every task in this project.</p></div></div>{owner && !project.archivedAt && <form className={styles.inviteForm} onSubmit={invite}><label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" /></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label><button className={styles.primary}>Add in-app invitation</button></form>}
        <div className={styles.memberList}>{project.memberships.map((member) => <article key={member.userId}><div className={styles.person}>{member.user.imageUrl ? <img src={member.user.imageUrl} alt="" /> : <span>{personName(member.user).slice(0,1)}</span>}<div><strong>{personName(member.user)} {member.userId === currentUserId && '(you)'}</strong><small>{member.user.primaryEmail}</small></div></div><div className={styles.memberActions}>{owner && member.role !== 'owner' && !project.archivedAt ? <select value={member.role} onChange={(event) => { const nextRole = event.target.value; act((token) => updateProjectMember(token, project.id, member.userId, nextRole)); }}><option value="editor">Editor</option><option value="viewer">Viewer</option></select> : <span className={styles.role}>{member.role}</span>}{owner && member.role === 'editor' && !project.archivedAt && <button onClick={() => window.confirm(`Transfer ownership to ${personName(member.user)}? You will become an editor.`) && act((token) => transferProjectOwnership(token, project.id, member.userId))}>Make owner</button>}{member.role !== 'owner' && (owner || member.userId === currentUserId) && <button className={styles.dangerText} onClick={() => window.confirm(`Remove ${personName(member.user)} from this project?`) && act((token) => removeProjectMember(token, project.id, member.userId))}>{member.userId === currentUserId ? 'Leave' : 'Remove'}</button>}</div></article>)}</div>
        {owner && project.invitations?.length > 0 && <div className={styles.pending}><h3>Pending invitations</h3>{project.invitations.map((invite) => <div key={invite.id}><span><strong>{invite.email}</strong> · {invite.role} · expires {new Date(invite.expiresAt).toLocaleDateString()}</span><button onClick={() => act((token) => revokeProjectInvitation(token, project.id, invite.id))}>Revoke</button></div>)}</div>}
    </section>;
}

function SettingsPanel({ project, getToken, onChanged, onError, onDeleted }) {
    const [title, setTitle] = useState(project.title); const [description, setDescription] = useState(project.description ?? ''); const [confirmTitle, setConfirmTitle] = useState(''); const owner = project.role === 'owner';
    const act = async (callback, after = onChanged) => { try { await callback(await getToken()); await after(); } catch (error) { onError(error.message); } };
    if (!owner) return <section className={styles.panel}><h2>Project settings</h2><p>Only the project owner can change settings.</p></section>;
    return <section className={styles.panel}><h2>Project settings</h2>{!project.archivedAt && <form className={styles.settingsForm} onSubmit={(event) => { event.preventDefault(); act((token) => updateProject(token, project.id, title, description)); }}><label>Name<input required maxLength="100" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Description<textarea maxLength="500" value={description} onChange={(event) => setDescription(event.target.value)} /></label><button className={styles.primary}>Save settings</button></form>}<div className={styles.settingRow}><div><strong>{project.archivedAt ? 'Restore project' : 'Archive project'}</strong><p>{project.archivedAt ? 'Return this project to active work.' : 'Make this project read-only and hide its tasks from My tasks.'}</p></div><button onClick={() => act((token) => project.archivedAt ? restoreProject(token, project.id) : archiveProject(token, project.id))}>{project.archivedAt ? 'Restore' : 'Archive'}</button></div><div className={`${styles.settingRow} ${styles.dangerZone}`}><div><strong>Delete project permanently</strong><p>This deletes every project task, tag, membership, and invitation. Enter <b>{project.title}</b> to confirm.</p><input value={confirmTitle} onChange={(event) => setConfirmTitle(event.target.value)} /></div><button disabled={confirmTitle !== project.title} onClick={() => act((token) => deleteProject(token, project.id, confirmTitle), onDeleted)}>Delete project</button></div></section>;
}
