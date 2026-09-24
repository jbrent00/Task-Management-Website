import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { getProjectActivity } from '../../api/projects';
import styles from './activity-timeline.module.css';

const actorName = (activity) => [activity.actor?.fname, activity.actor?.lname].filter(Boolean).join(' ') || activity.actor?.primaryEmail || 'A former member';
const copies = {
    task_created: (item) => `created “${item.metadata.taskTitle ?? 'a task'}”`,
    task_status_changed: (item) => `moved “${item.metadata.taskTitle ?? 'a task'}” from ${String(item.metadata.from).replaceAll('_', ' ')} to ${String(item.metadata.to).replaceAll('_', ' ')}`,
    task_assignees_changed: (item) => `updated assignees on “${item.metadata.taskTitle ?? 'a task'}”`,
    comment_created: (item) => `commented on “${item.metadata.taskTitle ?? 'a task'}”`,
    comment_edited: (item) => `edited a comment on “${item.metadata.taskTitle ?? 'a task'}”`,
    comment_deleted: (item) => `deleted a comment on “${item.metadata.taskTitle ?? 'a task'}”`,
    member_joined: (item) => `joined the project as ${item.metadata.role ?? 'a member'}`,
    member_removed: (item) => `removed ${item.metadata.memberName ?? 'a member'} from the project`,
    member_role_changed: (item) => `changed ${item.metadata.memberName ?? 'a member'} from ${item.metadata.from} to ${item.metadata.to}`,
    ownership_transferred: () => 'transferred project ownership',
    project_settings_updated: () => 'updated project settings',
    project_archived: () => 'archived the project',
    project_restored: () => 'restored the project',
};

export default function ActivityTimeline({ projectId, taskId = null }) {
    const { getToken } = useAuth();
    const [category, setCategory] = useState('all');
    const [items, setItems] = useState([]); const [cursor, setCursor] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
    const load = useCallback(async (append = false) => {
        setLoading(true);
        try {
            const page = await getProjectActivity(await getToken(), projectId, { category, taskId, cursor: append ? cursor : null });
            setItems((current) => append ? [...current, ...page.items] : page.items); setCursor(page.nextCursor); setError('');
        } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
    }, [getToken, projectId, category, taskId, cursor]);
    useEffect(() => { load(false); }, [projectId, category, taskId]); // eslint-disable-line react-hooks/exhaustive-deps
    return <section className={styles.timeline} aria-label={taskId ? 'Task activity' : 'Project activity'}>
        {!taskId && <div className={styles.filters} role="group" aria-label="Activity category">{['all', 'tasks', 'comments', 'members', 'settings'].map((value) => <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!loading && items.length === 0 && <p className={styles.empty}>No activity has been recorded here yet.</p>}
        <div className={styles.items}>{items.map((item) => <article key={item.id}><span className={styles.dot} /><div><p><strong>{actorName(item)}</strong> {copies[item.type]?.(item) ?? 'updated the project'}</p><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt))}</time></div></article>)}</div>
        {cursor && <button className={styles.more} disabled={loading} onClick={() => load(true)}>{loading ? 'Loading…' : 'Load older activity'}</button>}
        {loading && items.length === 0 && <p className={styles.empty}>Loading activity…</p>}
    </section>;
}
