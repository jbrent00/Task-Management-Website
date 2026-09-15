import styles from './task-card.module.css';
import { deleteTask } from '../../api/deleteTask';
import { updateTask } from '../../api/updateTask';
import toLocalDateTimeInput, { getLocalDateTimeMinimum } from '../../functions/toLocalDateTime';
import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { getTaskDueState } from '../../functions/taskViews';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';

function TaskCard ({task, allTasks, setAllTasks, projects = [], tags = [], onCreateTag, onNotify, dragHandleProps, isDragEnabled}) {
    const { getToken } = useAuth();
    const [editing, setEditing] = useState(false);
    const [dueDate, setDueDate] = useState(task.dueDate ? toLocalDateTimeInput(task.dueDate) : '');
    const [status, setStatus] = useState(task.status);
    const [priority, setPriority] = useState(task.priority);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [projectId, setProjectId] = useState(task.projectId);
    const [tagIds, setTagIds] = useState((task.tags ?? []).map((tag) => tag.id));
    const [saving, setSaving] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const resetDraft = () => {
        setTitle(task.title);
        setDescription(task.description ?? '');
        setStatus(task.status);
        setPriority(task.priority);
        setDueDate(task.dueDate ? toLocalDateTimeInput(task.dueDate) : '');
        setProjectId(task.projectId);
        setTagIds((task.tags ?? []).map((tag) => tag.id));
    };

    const handleDelete = async () => {
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
        }
    };

    const handleSave = async () => {
        const dueDateForComparing = task.dueDate ? toLocalDateTimeInput(task.dueDate) : '';

        if (title === task.title && description === task.description && status === task.status
            && priority === task.priority && dueDate === dueDateForComparing && projectId === task.projectId && tagIds.length === (task.tags ?? []).length && tagIds.every((id) => (task.tags ?? []).some((tag) => tag.id === id))) {
            setEditing(false);
            return;
        }

        if (!title.trim() || title.length > 100 || description.length > 500) {
            onNotify({ tone: 'error', message: 'Task titles are required and task details must stay within their character limits.' });
            return;
        }

        setSaving(true);
        try {
            const token = await getToken();
            const updatedTask = await updateTask(token, task.id, title, description, status, priority, dueDate || null, projectId, tagIds);
            setAllTasks(allTasks.map((currentTask) => currentTask.id === task.id ? updatedTask : currentTask));
            setEditing(false);
            onNotify({ tone: 'success', message: `Saved “${updatedTask.title}”.` });
        } catch (error) {
            console.error('Error updating task', error);
            onNotify({ tone: 'error', message: `Could not save “${task.title}”. Your changes are still open.` });
        } finally {
            setSaving(false);
        }
    };

    const formattedDueDate = task.dueDate && toLocalDateTimeInput(task.dueDate).replace('T', ' ');
    const dueState = getTaskDueState(task);
    const visibleTags = (task.tags ?? []).slice(0, 3);
    const remainingTagCount = (task.tags ?? []).length - visibleTags.length;

    return (
        <article className={`${styles.card} ${dueState ? styles[dueState.tone] : ''}`}>
            {editing ? (
                <div className={styles.editForm}>
                    <div className={styles.field}>
                        <label htmlFor={`task-${task.id}-title`}>Title</label>
                        <input id={`task-${task.id}-title`} type="text" value={title} maxLength="100" required onChange={(event) => setTitle(event.target.value)} />
                    </div>
                    <TaskAssignmentFields projects={projects} tags={tags} projectId={projectId} tagIds={tagIds} onProjectChange={setProjectId} onTagIdsChange={setTagIds} onCreateTag={onCreateTag} />
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
                        <button className={styles.saveButton} type="button" disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : 'Save changes'}</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className={`${styles.dragSurface} ${isDragEnabled ? styles.dragEnabled : ''}`} {...(isDragEnabled ? dragHandleProps : {})} role={isDragEnabled ? 'button' : undefined} tabIndex={isDragEnabled ? 0 : undefined} aria-label={isDragEnabled ? `Drag ${task.title} to reorder` : undefined} title={isDragEnabled ? 'Drag this task to reorder it' : undefined}>
                        <div className={styles.topRow}>
                            <div className={styles.titleGroup}><span className={styles.dragGrip} aria-hidden="true">⋮⋮</span><h3 className={styles.title}>{task.title}</h3></div>
                            <span className={`${styles.priority} ${styles[task.priority]}`}>{task.priority}</span>
                        </div>
                        <p className={styles.description}>{task.description}</p>
                        {task.project && <p className={styles.meta}><span className={styles.dueLabel}>Project</span><span>{task.project.title}</span></p>}
                        {visibleTags.length > 0 && <div className={styles.meta}><span className={styles.dueLabel}>Tags</span><span className={styles.tagList}>{visibleTags.map((tag) => <span className={`${styles.tag} ${styles[`tag_${tag.color}`]}`} key={tag.id}>{tag.name}</span>)}{remainingTagCount > 0 && <span className={`${styles.tag} ${styles.tagMore}`} aria-label={`${remainingTagCount} more tags`}>+{remainingTagCount}</span>}</span></div>}
                        {formattedDueDate && <p className={styles.meta}><span className={styles.dueLabel}>{dueState?.label ?? 'Due'}</span><span>{formattedDueDate}</span></p>}
                    </div>
                    <div className={styles.actions}>
                        <button type="button" className={styles.button} onClick={() => setEditing(true)}>Edit</button>
                        <button type="button" onClick={() => setConfirmingDelete(true)} className={`${styles.button} ${styles.deleteButton}`}>Delete</button>
                    </div>
                </>
            )}
            {confirmingDelete && <div className={styles.dialogBackdrop}><section className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby={`delete-task-${task.id}-title`}>
                <h2 id={`delete-task-${task.id}-title`}>Delete task?</h2>
                <p>Delete “{task.title}”? This cannot be undone.</p>
                <div className={styles.dialogActions}>
                    <button type="button" className={styles.cancelButton} disabled={deleting} onClick={() => setConfirmingDelete(false)}>Cancel</button>
                    <button type="button" className={`${styles.button} ${styles.deleteButton}`} disabled={deleting} onClick={handleDelete}>{deleting ? 'Deleting…' : 'Delete task'}</button>
                </div>
            </section></div>}
        </article>
    );
}

export default TaskCard;
