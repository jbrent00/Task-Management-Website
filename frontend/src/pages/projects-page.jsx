import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { acceptInvitation, declineInvitation, getMyInvitations } from '../api/projectInvitations';
import { createProject, getProjects } from '../api/projects';
import styles from './projects-page.module.css';

const displayName = (person) => [person?.fname, person?.lname].filter(Boolean).join(' ') || person?.primaryEmail || 'Member';

export default function ProjectsPage() {
    const { getToken, isLoaded } = useAuth();
    const [projects, setProjects] = useState([]); const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
    const [query, setQuery] = useState(''); const [archived, setArchived] = useState(false); const [ownership, setOwnership] = useState('all'); const [sort, setSort] = useState('recent'); const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try { const token = await getToken(); const [items, invites] = await Promise.all([getProjects(token), getMyInvitations(token)]); setProjects(items); setInvitations(invites); setError(''); }
        catch (loadError) { console.error(loadError); setError('Projects could not be loaded. Make sure the backend and database are available.'); }
        finally { setLoading(false); }
    }, [getToken]);
    useEffect(() => { if (isLoaded) load(); }, [isLoaded, load]);
    const visible = useMemo(() => projects.filter((project) => Boolean(project.archivedAt) === archived
        && (ownership === 'all' || (ownership === 'owned' ? project.role === 'owner' : project.role !== 'owner'))
        && `${project.title} ${project.description ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())).sort((first, second) => {
            if (sort === 'name') return first.title.localeCompare(second.title);
            if (sort === 'created') return new Date(second.createdAt) - new Date(first.createdAt);
            if (sort === 'completion') return (second.taskCount ? second.completedTaskCount / second.taskCount : 0) - (first.taskCount ? first.completedTaskCount / first.taskCount : 0);
            return new Date(second.lastActivityAt) - new Date(first.lastActivityAt);
        }), [projects, archived, ownership, query, sort]);
    const submit = async (event) => {
        event.preventDefault(); if (!title.trim()) return; setSaving(true); setError('');
        try { const project = await createProject(await getToken(), title, description); setProjects((current) => [...current, project].sort((a, b) => a.title.localeCompare(b.title))); setTitle(''); setDescription(''); setCreating(false); setNotice(`Created “${project.title}”.`); }
        catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
    };
    const respond = async (invitation, accept) => {
        try { const token = await getToken(); if (accept) await acceptInvitation(token, invitation.id); else await declineInvitation(token, invitation.id); setInvitations((current) => current.filter((item) => item.id !== invitation.id)); if (accept) await load(); window.dispatchEvent(new Event('collaboration:refresh')); setNotice(accept ? `Joined “${invitation.project.title}”.` : `Declined the invitation to “${invitation.project.title}”.`); }
        catch (responseError) { setError(responseError.message); }
    };

    return <div className={styles.page}>
        <header className={styles.hero}><div><p className={styles.eyebrow}>Collaborative workspaces</p><h1>Projects</h1><p>Create a private project, then invite teammates when you are ready.</p></div><button className={styles.primary} type="button" onClick={() => setCreating((value) => !value)}>{creating ? 'Cancel' : 'Create project'}</button></header>
        {notice && <div className={styles.notice} role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {creating && <form className={styles.createForm} onSubmit={submit}><label>Project name<input autoFocus required maxLength="100" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Description<textarea maxLength="500" value={description} onChange={(event) => setDescription(event.target.value)} /></label><button className={styles.primary} disabled={saving || !title.trim()}>{saving ? 'Creating…' : 'Create private project'}</button></form>}
        {invitations.length > 0 && <section className={styles.invites}><div><p className={styles.eyebrow}>Waiting for you</p><h2>Project invitations</h2></div>{invitations.map((invitation) => <article key={invitation.id}><div><strong>{invitation.project.title}</strong><p>{displayName(invitation.inviter)} invited you as {invitation.role}.</p></div><div><button onClick={() => respond(invitation, false)}>Decline</button><button className={styles.primary} onClick={() => respond(invitation, true)}>Accept</button></div></article>)}</section>}
        <section className={styles.toolbar}><label className={styles.search}><span>Search projects</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or description" /></label><label><span>Relationship</span><select value={ownership} onChange={(event) => setOwnership(event.target.value)}><option value="all">All projects</option><option value="owned">Owned by me</option><option value="shared">Shared with me</option></select></label><label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Recently active</option><option value="name">Name</option><option value="completion">Completion</option><option value="created">Recently created</option></select></label><div role="group" aria-label="Project state"><button aria-pressed={!archived} onClick={() => setArchived(false)}>Active</button><button aria-pressed={archived} onClick={() => setArchived(true)}>Archived</button></div></section>
        {loading ? <p className={styles.empty}>Loading projects…</p> : visible.length === 0 ? <div className={styles.empty}><h2>{projects.length ? 'No matching projects' : archived ? 'No archived projects' : 'No projects yet'}</h2><p>{projects.length ? 'Try changing the search, relationship, or project state filters.' : archived ? 'Archived projects will be kept here.' : 'Create your first private project to start organizing work.'}</p></div> : <div className={styles.grid}>{visible.map((project) => {
            const percent = project.taskCount ? Math.round(project.completedTaskCount / project.taskCount * 100) : 0;
            return <Link className={styles.card} to={`/projects/${project.id}`} key={project.id}><div className={styles.cardTop}><span className={styles.role}>{project.role === 'owner' ? 'Owned by me' : `Shared · ${project.role}`}</span>{project.archivedAt && <span className={styles.archived}>Archived</span>}</div><h2>{project.title}</h2><p className={styles.description}>{project.description || 'No description yet.'}</p><div className={styles.health}>{project.overdueTaskCount > 0 && <span className={styles.overdue}>{project.overdueTaskCount} overdue</span>}{project.unassignedTaskCount > 0 && <span>{project.unassignedTaskCount} unassigned</span>}<span>Active {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(project.lastActivityAt))}</span></div><div className={styles.progress} aria-label={`${percent}% complete`}><span style={{ width: `${percent}%` }} /></div><div className={styles.meta}><span>{project.completedTaskCount}/{project.taskCount} tasks complete</span><span>{project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}</span></div><div className={styles.avatars}>{project.members.map((member) => member.imageUrl ? <img key={member.id} src={member.imageUrl} alt={displayName(member)} /> : <span key={member.id} title={displayName(member)}>{displayName(member).slice(0, 1).toUpperCase()}</span>)}</div></Link>;
        })}</div>}
    </div>;
}
