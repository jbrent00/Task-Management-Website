import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { acceptInvitation, declineInvitation } from '../../api/projectInvitations';
import { getNotifications, markNotificationsRead } from '../../api/notifications';
import styles from './collaboration-inbox.module.css';
import { BellIcon } from '@phosphor-icons/react/dist/csr/Bell';

const personName = (person) => [person?.fname, person?.lname].filter(Boolean).join(' ') || person?.primaryEmail || 'A teammate';
const relativeTime = (value) => {
    const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    if (Math.abs(seconds) < 60) return formatter.format(seconds, 'second');
    const minutes = Math.round(seconds / 60); if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
    const hours = Math.round(minutes / 60); if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
    return formatter.format(Math.round(hours / 24), 'day');
};

const notificationCopy = (notification) => {
    const actor = personName(notification.actor); const data = notification.metadata ?? {};
    const copies = {
        task_assigned: `${actor} assigned you “${data.taskTitle ?? 'a task'}” in ${data.projectTitle ?? 'a project'}.`,
        task_unassigned: `${actor} unassigned you from “${data.taskTitle ?? 'a task'}” in ${data.projectTitle ?? 'a project'}.`,
        task_commented: `${actor} commented on “${data.taskTitle ?? 'a task'}” in ${data.projectTitle ?? 'a project'}.`,
        comment_mentioned: `${actor} mentioned you on “${data.taskTitle ?? 'a task'}” in ${data.projectTitle ?? 'a project'}.`,
        role_changed: `${actor} changed your role in ${data.projectTitle ?? 'a project'} to ${data.role ?? 'a new role'}.`,
        project_removed: `${actor} removed you from ${data.projectTitle ?? 'a project'}.`,
        ownership_transferred: `${actor} transferred ownership of ${data.projectTitle ?? 'a project'} to you.`,
    };
    return copies[notification.type] ?? 'Your collaboration workspace changed.';
};

export default function CollaborationInbox() {
    const { getToken, isLoaded, userId } = useAuth(); const navigate = useNavigate();
    const [data, setData] = useState({ items: [], totalBadgeCount: 0, unreadCount: 0, pendingActionCount: 0 });
    const [open, setOpen] = useState(false); const [busyId, setBusyId] = useState(null); const [error, setError] = useState('');
    const root = useRef(null); const trigger = useRef(null); const panel = useRef(null);
    const refresh = useCallback(async () => {
        if (!isLoaded || !userId) return;
        try { setData(await getNotifications(await getToken())); setError(''); }
        catch (loadError) { console.error(loadError); setError('Notifications could not be refreshed.'); }
    }, [getToken, isLoaded, userId]);
    useEffect(() => { refresh(); }, [refresh]);
    useEffect(() => {
        const intervalId = window.setInterval(refresh, 60_000);
        const focus = () => refresh(); const custom = () => refresh();
        window.addEventListener('focus', focus); window.addEventListener('collaboration:refresh', custom);
        return () => { window.clearInterval(intervalId); window.removeEventListener('focus', focus); window.removeEventListener('collaboration:refresh', custom); };
    }, [refresh]);
    useEffect(() => {
        if (!open) return undefined;
        panel.current?.querySelector('button, a')?.focus();
        const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
        const escape = (event) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
        document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, [open]);
    const respond = async (invitation, accept) => {
        setBusyId(`invitation-${invitation.id}`);
        try {
            const token = await getToken();
            if (accept) { const result = await acceptInvitation(token, invitation.id); await refresh(); setOpen(false); navigate(`/projects/${result.projectId}`); }
            else { await declineInvitation(token, invitation.id); await refresh(); }
        } catch (responseError) { setError(responseError.message); }
        finally { setBusyId(null); }
    };
    const markRead = async (input) => { await markNotificationsRead(await getToken(), input); await refresh(); };
    return <div className={styles.root} ref={root}>
        <button ref={trigger} className={styles.trigger} type="button" aria-label={`Collaboration inbox${data.totalBadgeCount ? `, ${data.totalBadgeCount} items` : ''}`} aria-haspopup="dialog" aria-expanded={open} aria-controls="collaboration-inbox" onClick={() => setOpen((value) => !value)}><BellIcon aria-hidden="true" size={20} />{data.totalBadgeCount > 0 && <b>{data.totalBadgeCount > 99 ? '99+' : data.totalBadgeCount}</b>}</button>
        {open && <section ref={panel} id="collaboration-inbox" className={styles.panel} role="dialog" aria-modal="false" aria-label="Collaboration inbox">
            <div className={styles.heading}><div><strong>Collaboration inbox</strong><small>{data.pendingActionCount} awaiting action · {data.unreadCount} unread</small></div>{data.unreadCount > 0 && <button type="button" onClick={() => markRead({ all: true })}>Mark all read</button>}</div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.items}>{data.items.length === 0 ? <p className={styles.empty}>You’re all caught up.</p> : data.items.map((item) => item.kind === 'invitation' ? <article className={styles.item} key={`invitation-${item.id}`}>
                <div><span className={styles.kind}>Invitation</span><p><strong>{personName(item.invitation.inviter)}</strong> invited you to <strong>{item.invitation.project.title}</strong> as {item.invitation.role}.</p><small>{relativeTime(item.createdAt)}</small></div>
                <div className={styles.actions}><button type="button" disabled={busyId === `invitation-${item.id}`} onClick={() => respond(item.invitation, false)}>Decline</button><button className={styles.primary} type="button" disabled={busyId === `invitation-${item.id}`} onClick={() => respond(item.invitation, true)}>Accept and open</button></div>
            </article> : <article className={`${styles.item} ${!item.notification.readAt ? styles.unread : ''}`} key={`notification-${item.id}`}>
                <div><span className={styles.kind}>{item.notification.type.replaceAll('_', ' ')}</span><p>{notificationCopy(item.notification)}</p><small>{relativeTime(item.createdAt)}</small></div>
                <div className={styles.actions}>{!item.notification.readAt && <button type="button" onClick={() => markRead({ ids: [item.id] })}>Mark read</button>}{item.notification.projectId && item.notification.type !== 'project_removed' && <Link to={`/projects/${item.notification.projectId}${item.notification.taskId ? `?task=${item.notification.taskId}` : ''}`} onClick={() => { if (!item.notification.readAt) markRead({ ids: [item.id] }); setOpen(false); }}>Open</Link>}</div>
            </article>)}</div>
        </section>}
    </div>;
}
