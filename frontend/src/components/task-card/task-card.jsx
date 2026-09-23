import styles from './task-card.module.css';
import { deleteTask } from '../../api/deleteTask';
import { updateTask } from '../../api/updateTask';
import toLocalDateTimeInput, { getLocalDateTimeMinimum } from '../../functions/toLocalDateTime';
import { useEffect, useRef, useState } from 'react';
import TaskActions from './task-actions';
import { useTaskMutation } from '../../functions/taskMutationContext';
import { useAuth } from '@clerk/react';
import { getTaskDueState } from '../../functions/taskViews';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';
import Checklist from '../checklist/checklist';
import { joinProjectTask, leaveProjectTask } from '../../api/projectTasks';

function TaskCard ({task, setAllTasks, projects = [], tags = [], members = [], projectMode = false, onCreateTag, onNotify, dragHandleProps, isDragEnabled}) {
    const { getToken } = useAuth();
    const mutation = useTaskMutation();
    const [checklistOpenRequest, setChecklistOpenRequest] = useState(0);
    const editTitle = useRef(null);
    const deleteCancel = useRef(null);
    const cardRef = useRef(null);
    const [editing, setEditing] = useState(false);
    const [dueDate, setDueDate] = useState(task.dueDate ? toLocalDateTimeInput(task.dueDate) : '');
    const [status, setStatus] = useState(task.status);
    const [priority, setPriority] = useState(task.priority);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [projectId, setProjectId] = useState(task.projectId);
    const [tagIds, setTagIds] = useState((task.tags ?? []).map((tag) => tag.id));
    const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? null);
    const [saving, setSaving] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => { if (editing) editTitle.current?.focus(); }, [editing]);
    useEffect(() => { if (confirmingDelete) deleteCancel.current?.focus(); }, [confirmingDelete]);

    const resetDraft = () => {
        setTitle(task.title);
        setDescription(task.description ?? '');
        setStatus(task.status);
        setPriority(task.priority);
        setDueDate(task.dueDate ? toLocalDateTimeInput(task.dueDate) : '');
        setProjectId(task.projectId);
        setTagIds((task.tags ?? []).map((tag) => tag.id));
        setAssigneeId(task.assigneeId ?? null);
    };

    const handleDelete = async () => {
        if (!mutation.begin()) return;
        setDeleting(true);
        try {
            const token = await getToken();
            await deleteTask(token, task.id);
            setAllTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));
            onNotify({ tone: 'success', message: `Deleted “${task.title}”.` });
        } catch (error) {
            console.error('Error deleting task', error);
            setConfirmingDelete(false);
            onNotify({ tone: 'error', message: `Could not delete “${task.title}”. Please try again.` });
        } finally {
            setDeleting(false);
            mutation.end();
        }
    };

    const handleSave = async () => {
        const dueDateForComparing = task.dueDate ? toLocalDateTimeInput(task.dueDate) : '';

        if (title === task.title && description === task.description && status === task.status
            && priority === task.priority && dueDate === dueDateForComparing && projectId === task.projectId && assigneeId === task.assigneeId && tagIds.length === (task.tags ?? []).length && tagIds.every((id) => (task.tags ?? []).some((tag) => tag.id === id))) {
            setEditing(false);
            return;
        }

        if (!title.trim() || title.length > 100 || description.length > 500) {
            onNotify({ tone: 'error', message: 'Task titles are required and task details must stay within their character limits.' });
            return;
        }

        if (!mutation.begin()) return;
        setSaving(true);
        try {
            const token = await getToken();
            const updatedTask = await updateTask(token, task.id, title, description, status, priority, dueDate || null, projectId, tagIds, assigneeId);
            setAllTasks((currentTasks) => currentTasks.map((currentTask) => currentTask.id === task.id ? updatedTask : currentTask));
            setEditing(false);
            onNotify({ tone: 'success', message: `Saved “${updatedTask.title}”.` });
        } catch (error) {
            console.error('Error updating task', error);
            onNotify({ tone: 'error', message: `Could not save “${task.title}”. Your changes are still open.` });
        } finally {
            setSaving(false);
            mutation.end();
        }
    };

    const handleCompletion = async () => {
        if (!mutation.begin()) return;
        setSaving(true);
        try {
            const updated = await updateTask(await getToken(), task.id, task.title, task.description ?? '', task.status === 'completed' ? 'todo' : 'completed', task.priority, task.dueDate, task.projectId, (task.tags ?? []).map((tag) => tag.id), task.assigneeId ?? null);
            setAllTasks((current) => current.map((item) => item.id === task.id ? updated : item));
            onNotify({ tone: 'success', message: `${updated.status === 'completed' ? 'Completed' : 'Reopened'} “${updated.title}”.` });
        } catch {
            onNotify({ tone: 'error', message: `Could not change the status of “${task.title}”. Please try again.` });
        } finally { setSaving(false); mutation.end(); }
    };
    const handleParticipation = async () => {
        const joining = task.capabilities?.canJoin;
        if (!joining && !task.capabilities?.canLeave) return;
        if (!mutation.begin()) return;
        setSaving(true);
        try {
            const updated = joining ? await joinProjectTask(await getToken(), task.id) : await leaveProjectTask(await getToken(), task.id);
            setAllTasks((current) => current.map((item) => item.id === task.id ? updated : item));
            onNotify({ tone: 'success', message: `${joining ? 'Joined' : 'Left'} “${task.title}”.` });
        } catch (error) { onNotify({ tone: 'error', message: error.message }); }
        finally { setSaving(false); mutation.end(); }
    };
    const formattedDueDate = task.dueDate && new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(task.dueDate));
    const dueState = getTaskDueState(task);
    const visibleTags = (task.tags ?? []).slice(0, 3);
    const remainingTagCount = (task.tags ?? []).length - visibleTags.length;
    const setChecklistItems = (checklistItems) => setAllTasks((currentTasks) => currentTasks.map((currentTask) => currentTask.id === task.id ? { ...currentTask, checklistItems } : currentTask));

    return (
        <article ref={cardRef} className={`${styles.card} ${dueState ? styles[dueState.tone] : ''}`}>
            {editing ? (
                <div className={styles.editForm}>
                    <div className={styles.field}>
                        <label htmlFor={`task-${task.id}-title`}>Title</label>
                        <input ref={editTitle} id={`task-${task.id}-title`} type="text" value={title} maxLength="100" required onChange={(event) => setTitle(event.target.value)} />
                    </div>
                    {(!task.projectId || projectMode) && <TaskAssignmentFields projects={projects} tags={tags} projectId={projectId} tagIds={tagIds} onProjectChange={setProjectId} onTagIdsChange={setTagIds} onCreateTag={onCreateTag} showProject={false} members={members} assigneeId={assigneeId} onAssigneeChange={task.projectId && task.capabilities?.canAssignOthers !== false ? setAssigneeId : undefined} />}
                    <div className={styles.field}>
                        <label htmlFor={`task-${task.id}-description`}>Description</label>
                        <textarea id={`task-${task.id}-description`} value={description} maxLength="500" onChange={(event) => setDescription(event.target.value)} />
                    </div>
                    <div className={styles.editGrid}>
                        <div className={styles.field}>
                            <label htmlFor={`task-${task.id}-status`}>Status</label>
                            <select id={`task-${task.id}-status`} value={status} onChange={(event) => setStatus(event.target.value)}>
                                <option value="todo">To do</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor={`task-${task.id}-priority`}>Priority</label>
                            <select id={`task-${task.id}-priority`} value={priority} onChange={(event) => setPriority(event.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label htmlFor={`task-${task.id}-due-date`}>Due date</label>
                        <input type="datetime-local" id={`task-${task.id}-due-date`} value={dueDate}
                            min={getLocalDateTimeMinimum()} onInput={(event) => setDueDate(event.currentTarget.value)} />
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.cancelButton} type="button" onClick={() => { resetDraft(); setEditing(false); }}>Cancel</button>
                        <button className={styles.saveButton} type="button" disabled={mutation.busy} onClick={handleSave}>{saving ? 'Saving…' : 'Save changes'}</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.dragSurface}>
                        <div className={styles.topRow}>
                            <div className={styles.titleGroup}>{isDragEnabled && <span className={`${styles.dragGrip} ${styles.dragEnabled}`} {...dragHandleProps} aria-label={`Drag ${task.title} to reorder`} title="Drag this task to reorder it">⋮⋮</span>}<h3 className={styles.title}>{task.title}</h3></div>
                            <span className={`${styles.priority} ${styles[task.priority]}`}>{task.priority}</span>
                        </div>
                        {task.description && <p className={styles.description}>{task.description}</p>}
                        {task.project && <p className={styles.meta}><span className={styles.dueLabel}>Project</span><span>{task.project.title}</span></p>}
                        <p className={styles.meta}><span className={styles.dueLabel}>Assignee</span><span>{task.assignee ? ([task.assignee.fname, task.assignee.lname].filter(Boolean).join(' ') || task.assignee.primaryEmail) : 'Unassigned'}</span></p>
                        {visibleTags.length > 0 && <div className={styles.meta}><span className={styles.dueLabel}>Tags</span><span className={styles.tagList}>{visibleTags.map((tag) => <span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`} key={tag.id}>{tag.name}</span>)}{remainingTagCount > 0 && <span className={`${styles.tag} ${styles.tagMore}`} aria-label={`${remainingTagCount} more tags`}>+{remainingTagCount}</span>}</span></div>}
                        {formattedDueDate && <p className={styles.meta}><span className={styles.dueLabel}>{dueState?.label ?? 'Due'}</span><span>{formattedDueDate}</span></p>}
                    </div>
                    <div className={styles.cardControls}>
                        {(task.capabilities?.canJoin || task.capabilities?.canLeave) && <button className={styles.participation} type="button" disabled={mutation.busy} onClick={handleParticipation}>{task.capabilities.canJoin ? 'Join task' : 'Leave task'}</button>}
                        {task.capabilities?.canEdit !== false && <label className={styles.completion}><input type="checkbox" checked={task.status === 'completed'} disabled={mutation.busy} onChange={handleCompletion} aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} ${task.title}`} /><span>{task.status === 'completed' ? 'Completed' : 'Complete'}</span></label>}
                        {(task.capabilities?.canEdit !== false || task.capabilities?.canJoin || task.capabilities?.canLeave) && <TaskActions taskId={task.id} disabled={mutation.busy} onParticipation={(task.capabilities?.canJoin || task.capabilities?.canLeave) ? handleParticipation : undefined} participationLabel={task.capabilities?.canJoin ? 'Join task' : 'Leave task'} onEdit={task.capabilities?.canEdit !== false ? () => { resetDraft(); setEditing(true); } : undefined} onDelete={task.capabilities?.canDelete ? () => setConfirmingDelete(true) : undefined} onAddChecklist={task.capabilities?.canEdit !== false && (task.checklistItems ?? []).length === 0 ? () => setChecklistOpenRequest((current) => current + 1) : undefined} />}
                    </div>
                </>
            )}
            <Checklist hideEmpty openRequest={checklistOpenRequest} disabled={saving || deleting} readOnly={task.capabilities?.canEdit === false} taskId={task.id} items={task.checklistItems ?? []} getToken={getToken} onItemsChange={setChecklistItems} onNotify={onNotify} />
            {confirmingDelete && <div className={styles.dialogBackdrop}><section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby={`delete-task-${task.id}-title`} onKeyDown={(event) => {
                if (event.key === 'Escape' && !deleting) { setConfirmingDelete(false); cardRef.current?.querySelector('[aria-haspopup="menu"]')?.focus(); }
                if (event.key === 'Tab') {
                    const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')];
                    if (!buttons.length) { event.preventDefault(); return; }
                    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
                    if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
                }
            }}>
                <h2 id={`delete-task-${task.id}-title`}>Delete task?</h2>
                <p>Delete “{task.title}”? This cannot be undone.</p>
                <div className={styles.dialogActions}>
                    <button ref={deleteCancel} type="button" className={styles.cancelButton} disabled={deleting} onClick={() => { setConfirmingDelete(false); cardRef.current?.querySelector('[aria-haspopup="menu"]')?.focus(); }}>Cancel</button>
                    <button type="button" className={`${styles.button} ${styles.deleteButton}`} disabled={deleting} onClick={handleDelete}>{deleting ? 'Deleting…' : 'Delete task'}</button>
                </div>
            </section></div>}
        </article>
    );
}

export default TaskCard;
