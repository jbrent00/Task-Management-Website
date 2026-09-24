import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { deleteTask } from '../../api/deleteTask';
import { updateTask } from '../../api/updateTask';
import toLocalDateTimeInput from '../../functions/toLocalDateTime';
import { canChangeProjectTaskAssignments } from '../../functions/projectAssignmentPolicy';
import MemberPicker from '../member-picker/member-picker';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';
import Checklist from '../checklist/checklist';
import TaskComments from '../task-comments/task-comments';
import ActivityTimeline from '../activity-timeline/activity-timeline';
import ConfirmDialog from '../confirm-dialog/confirm-dialog';
import styles from './task-detail-modal.module.css';

const sortedIds = (items) => [...items].sort((first, second) => String(first).localeCompare(String(second)));

function taskSnapshot(task) {
    return {
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? toLocalDateTimeInput(task.dueDate) : '',
        tagIds: sortedIds((task.tags ?? []).map((tag) => tag.id)),
        assigneeIds: sortedIds((task.assignees ?? []).map((person) => person.id)),
    };
}

export default function TaskDetailModal({
    task,
    project = null,
    personalTags = [],
    onCreatePersonalTag,
    projectLoading = false,
    projectError = '',
    onRetryProject,
    onClose,
    onUpdated,
    onDeleted,
    onNotify,
}) {
    const { getToken, userId } = useAuth();
    const dialog = useRef(null);
    const closeButton = useRef(null);
    const initial = taskSnapshot(task);
    const [title, setTitle] = useState(initial.title);
    const [description, setDescription] = useState(initial.description);
    const [status, setStatus] = useState(initial.status);
    const [priority, setPriority] = useState(initial.priority);
    const [dueDate, setDueDate] = useState(initial.dueDate);
    const [tagIds, setTagIds] = useState(initial.tagIds);
    const [assigneeIds, setAssigneeIds] = useState(initial.assigneeIds);
    const [baseline, setBaseline] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('details');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState(null);
    const isProjectTask = Boolean(task.projectId);
    const canEdit = task.capabilities?.canEdit !== false;
    const canDelete = Boolean(task.capabilities?.canDelete);
    const current = useMemo(() => ({
        title,
        description,
        status,
        priority,
        dueDate,
        tagIds: sortedIds(tagIds),
        assigneeIds: sortedIds(assigneeIds),
    }), [assigneeIds, description, dueDate, priority, status, tagIds, title]);
    const isDirty = JSON.stringify(current) !== JSON.stringify(baseline);

    useEffect(() => {
        closeButton.current?.focus();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, []);

    useEffect(() => {
        if (!isDirty) return undefined;
        const warnBeforeUnload = (event) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', warnBeforeUnload);
        return () => window.removeEventListener('beforeunload', warnBeforeUnload);
    }, [isDirty]);

    const requestClose = () => {
        if (isDirty) {
            setConfirmation('discard');
            return;
        }
        onClose();
    };

    const changeAssignees = (next) => {
        if (!project || !canChangeProjectTaskAssignments(project, userId, baseline.assigneeIds, next)) {
            setError('Your project permissions do not allow that assignment change.');
            return;
        }
        setAssigneeIds(next);
        setError('');
    };

    const applySavedTask = (updated) => {
        const saved = taskSnapshot(updated);
        setTitle(saved.title);
        setDescription(saved.description);
        setStatus(saved.status);
        setPriority(saved.priority);
        setDueDate(saved.dueDate);
        setTagIds(saved.tagIds);
        setAssigneeIds(saved.assigneeIds);
        setBaseline(saved);
        onUpdated(updated);
    };

    const save = async (event) => {
        event.preventDefault();
        if (!title.trim() || saving) return;
        setSaving(true);
        setError('');
        try {
            const updated = await updateTask(await getToken(), task.id, title, description, status, priority, dueDate || null, task.projectId, tagIds, assigneeIds);
            applySavedTask(updated);
            onNotify({ tone: 'success', message: `Saved “${updated.title}”.` });
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setSaving(true);
        setError('');
        try {
            await deleteTask(await getToken(), task.id);
            onDeleted(task.id);
            onNotify({ tone: 'success', message: `Deleted “${task.title}”.` });
        } catch (deleteError) {
            setError(deleteError.message);
            setSaving(false);
            setConfirmation(null);
        }
    };

    const setChecklistItems = (checklistItems) => onUpdated({ ...task, checklistItems });
    const tabs = project ? ['details', 'discussion', 'activity'] : ['details'];

    return <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
        <section ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={`task-detail-${task.id}`} onKeyDown={(event) => {
            if (event.key === 'Escape') { event.preventDefault(); requestClose(); }
            if (event.key === 'Tab') {
                const focusable = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')];
                if (!focusable.length) return;
                if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
                else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus(); }
            }
        }}>
            <header className={styles.header}><div><span>{isProjectTask ? 'Project task' : 'Personal task'}</span><h2 id={`task-detail-${task.id}`}>{task.title}</h2></div><button ref={closeButton} className={styles.close} onClick={requestClose} aria-label="Close task details">×</button></header>
            {!projectLoading && !projectError && <nav className={styles.tabs} aria-label="Task detail sections">{tabs.map((value) => <button key={value} aria-current={tab === value ? 'page' : undefined} onClick={() => setTab(value)}>{value}</button>)}</nav>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.content}>
                {projectLoading && <div className={styles.loadState} role="status"><strong>Loading project details…</strong><p>Preparing assignments, shared tags, discussion, and activity.</p></div>}
                {projectError && <div className={styles.loadState} role="alert"><strong>Could not load project details.</strong><p>{projectError}</p><button type="button" onClick={onRetryProject}>Try again</button></div>}
                {!projectLoading && !projectError && tab === 'details' && <form className={styles.form} onSubmit={save}>
                    <label>Title<input maxLength="100" required value={title} disabled={!canEdit} onChange={(event) => setTitle(event.target.value)} /></label>
                    <label>Description<textarea maxLength="500" value={description} disabled={!canEdit} onChange={(event) => setDescription(event.target.value)} /></label>
                    <div className={styles.grid}><label>Status<select value={status} disabled={!canEdit} onChange={(event) => setStatus(event.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label><label>Priority<select value={priority} disabled={!canEdit} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input type="datetime-local" value={dueDate} disabled={!canEdit} onChange={(event) => setDueDate(event.target.value)} /></label></div>
                    {project && <>
                        <MemberPicker members={project.memberships} selectedIds={assigneeIds} onChange={changeAssignees} disabled={!canEdit || project.archivedAt || project.role === 'viewer'} />
                        <fieldset className={styles.tags}><legend>Tags</legend>{project.tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={tagIds.includes(tag.id)} disabled={!canEdit} onChange={() => setTagIds((value) => value.includes(tag.id) ? value.filter((id) => id !== tag.id) : [...value, tag.id])} />{tag.name}</label>)}</fieldset>
                    </>}
                    {!isProjectTask && canEdit && <TaskAssignmentFields tags={personalTags} projectId={null} tagIds={tagIds} onProjectChange={() => {}} onTagIdsChange={setTagIds} onCreateTag={onCreatePersonalTag} showProject={false} />}
                    {!isProjectTask && !canEdit && <fieldset className={styles.tags}><legend>Tags</legend>{personalTags.map((tag) => <label key={tag.id}><input type="checkbox" checked={tagIds.includes(tag.id)} disabled />{tag.name}</label>)}</fieldset>}
                    <Checklist disabled={saving} readOnly={!canEdit} taskId={task.id} items={task.checklistItems ?? []} getToken={getToken} onItemsChange={setChecklistItems} onNotify={onNotify} />
                    {(canEdit || canDelete) && <div className={styles.actions}>{canDelete && <button type="button" className={styles.delete} disabled={saving} onClick={() => setConfirmation('delete')}>Delete task</button>}{canEdit && <button className={styles.primary} disabled={saving || !title.trim() || !isDirty}>{saving ? 'Saving…' : 'Save changes'}</button>}</div>}
                </form>}
                {project && tab === 'discussion' && <TaskComments task={task} project={project} onChanged={(delta) => delta && onUpdated({ ...task, commentCount: Math.max(0, (task.commentCount ?? 0) + delta) })} />}
                {project && tab === 'activity' && <ActivityTimeline projectId={project.id} taskId={task.id} />}
            </div>
        </section>
        {confirmation === 'discard' && <ConfirmDialog title="Discard unsaved changes?" confirmLabel="Discard changes" tone="warning" onCancel={() => setConfirmation(null)} onConfirm={onClose}>Your edits to “{task.title}” will be lost.</ConfirmDialog>}
        {confirmation === 'delete' && <ConfirmDialog title="Delete task?" confirmLabel="Delete task" busyLabel="Deleting…" busy={saving} onCancel={() => setConfirmation(null)} onConfirm={remove}>Delete “{task.title}”? This cannot be undone.</ConfirmDialog>}
    </div>;
}
