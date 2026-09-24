import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { deleteTask } from '../../api/deleteTask';
import { updateTask } from '../../api/updateTask';
import toLocalDateTimeInput from '../../functions/toLocalDateTime';
import { canChangeProjectTaskAssignments } from '../../functions/projectAssignmentPolicy';
import MemberPicker from '../member-picker/member-picker';
import Checklist from '../checklist/checklist';
import TaskComments from '../task-comments/task-comments';
import ActivityTimeline from '../activity-timeline/activity-timeline';
import styles from './task-detail-modal.module.css';

export default function TaskDetailModal({ task, project, onClose, onUpdated, onDeleted, onNotify }) {
    const { getToken, userId } = useAuth(); const dialog = useRef(null); const closeButton = useRef(null);
    const [title, setTitle] = useState(task.title); const [description, setDescription] = useState(task.description ?? ''); const [status, setStatus] = useState(task.status); const [priority, setPriority] = useState(task.priority); const [dueDate, setDueDate] = useState(task.dueDate ? toLocalDateTimeInput(task.dueDate) : '');
    const [tagIds, setTagIds] = useState((task.tags ?? []).map((tag) => tag.id)); const [assigneeIds, setAssigneeIds] = useState((task.assignees ?? []).map((person) => person.id)); const [saving, setSaving] = useState(false); const [tab, setTab] = useState('details'); const [error, setError] = useState('');
    const canEdit = task.capabilities?.canEdit !== false;
    useEffect(() => {
        closeButton.current?.focus(); const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, []);
    const changeAssignees = (next) => {
        const current = (task.assignees ?? []).map((person) => person.id);
        if (!canChangeProjectTaskAssignments(project, userId, current, next)) { setError('Your project permissions do not allow that assignment change.'); return; }
        setAssigneeIds(next); setError('');
    };
    const save = async (event) => {
        event.preventDefault(); if (!title.trim()) return; setSaving(true); setError('');
        try {
            const updated = await updateTask(await getToken(), task.id, title, description, status, priority, dueDate || null, task.projectId, tagIds, assigneeIds);
            onUpdated(updated); onNotify({ tone: 'success', message: `Saved “${updated.title}”.` });
        } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
    };
    const remove = async () => {
        if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
        setSaving(true); try { await deleteTask(await getToken(), task.id); onDeleted(task.id); onNotify({ tone: 'success', message: `Deleted “${task.title}”.` }); } catch (deleteError) { setError(deleteError.message); setSaving(false); }
    };
    const setChecklistItems = (checklistItems) => onUpdated({ ...task, checklistItems });
    return <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <section ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={`task-detail-${task.id}`} onKeyDown={(event) => {
            if (event.key === 'Escape') { event.preventDefault(); onClose(); }
            if (event.key === 'Tab') { const focusable = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')]; if (!focusable.length) return; if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus(); } }
        }}>
            <header className={styles.header}><div><span>Project task</span><h2 id={`task-detail-${task.id}`}>{task.title}</h2></div><button ref={closeButton} className={styles.close} onClick={onClose} aria-label="Close task details">×</button></header>
            <nav className={styles.tabs} aria-label="Task detail sections">{['details', 'discussion', 'activity'].map((value) => <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>{value}</button>)}</nav>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.content}>
                {tab === 'details' && <form className={styles.form} onSubmit={save}>
                    <label>Title<input maxLength="100" required value={title} disabled={!canEdit} onChange={(event) => setTitle(event.target.value)} /></label>
                    <label>Description<textarea maxLength="500" value={description} disabled={!canEdit} onChange={(event) => setDescription(event.target.value)} /></label>
                    <div className={styles.grid}><label>Status<select value={status} disabled={!canEdit} onChange={(event) => setStatus(event.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label><label>Priority<select value={priority} disabled={!canEdit} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input type="datetime-local" value={dueDate} disabled={!canEdit} onChange={(event) => setDueDate(event.target.value)} /></label></div>
                    <MemberPicker members={project.memberships} selectedIds={assigneeIds} onChange={changeAssignees} disabled={!canEdit || project.archivedAt || project.role === 'viewer'} />
                    <fieldset className={styles.tags}><legend>Tags</legend>{project.tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={tagIds.includes(tag.id)} disabled={!canEdit} onChange={() => setTagIds((current) => current.includes(tag.id) ? current.filter((id) => id !== tag.id) : [...current, tag.id])} />{tag.name}</label>)}</fieldset>
                    <Checklist disabled={saving} readOnly={!canEdit} taskId={task.id} items={task.checklistItems ?? []} getToken={getToken} onItemsChange={setChecklistItems} onNotify={onNotify} />
                    {canEdit && <div className={styles.actions}><button type="button" className={styles.delete} disabled={saving} onClick={remove}>Delete task</button><button className={styles.primary} disabled={saving || !title.trim()}>{saving ? 'Saving…' : 'Save changes'}</button></div>}
                </form>}
                {tab === 'discussion' && <TaskComments task={task} project={project} onChanged={(delta) => delta && onUpdated({ ...task, commentCount: Math.max(0, (task.commentCount ?? 0) + delta) })} />}
                {tab === 'activity' && <ActivityTimeline projectId={project.id} taskId={task.id} />}
            </div>
        </section>
    </div>;
}
