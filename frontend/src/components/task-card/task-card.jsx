import styles from './task-card.module.css';
import { deleteTask } from '../../api/deleteTask';
import { updateTask } from '../../api/updateTask';
import toLocalDateTimeInput from '../../functions/toLocalDateTime';
import { useState } from 'react';
import { useAuth } from '@clerk/react';
import { getTaskDueState } from '../../functions/taskViews';
import TaskAssignmentFields from '../task-assignment-fields/task-assignment-fields';

function TaskCard ({task, allTasks, setAllTasks, projects = [], tags = [], onCreateTag}) {
    const { getToken } = useAuth();
    const [editing, setEditing] = useState(false);
    const [dueDate, setDueDate] = useState(task.dueDate ? toLocalDateTimeInput(task.dueDate) : '');
    const [status, setStatus] = useState(task.status);
    const [priority, setPriority] = useState(task.priority);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [projectId, setProjectId] = useState(task.projectId);
    const [tagIds, setTagIds] = useState((task.tags ?? []).map((tag) => tag.id));

    const handleDelete = async () => {
        try {
            const token = await getToken();
            await deleteTask(token, task.id);
            setAllTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));
        } catch (error) {
            console.error('Error deleting task', error);
        }
    };

    const handleSave = async () => {
        const dueDateForComparing = task.dueDate ? toLocalDateTimeInput(task.dueDate) : '';

        if (title === task.title && description === task.description && status === task.status
            && priority === task.priority && dueDate === dueDateForComparing && projectId === task.projectId && tagIds.length === (task.tags ?? []).length && tagIds.every((id) => (task.tags ?? []).some((tag) => tag.id === id))) {
            setEditing(false);
            return;
        }

        try {
            const token = await getToken();
            const updatedTask = await updateTask(token, task.id, title, description, status, priority, dueDate || null, projectId, tagIds);
            setAllTasks(allTasks.map((currentTask) => currentTask.id === task.id ? updatedTask : currentTask));
            setEditing(false);
        } catch (error) {
            console.error('Error updating task', error);
        }
    };

    const formattedDueDate = task.dueDate && toLocalDateTimeInput(task.dueDate).replace('T', ' ');
    const dueState = getTaskDueState(task);

    return (
        <article className={`${styles.card} ${dueState ? styles[dueState.tone] : ''}`}>
            {editing ? (
                <div className={styles.editForm}>
                    <div className={styles.field}>
                        <label htmlFor={`task-${task.id}-title`}>Title</label>
                        <input id={`task-${task.id}-title`} type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
                    </div>
                    <TaskAssignmentFields projects={projects} tags={tags} projectId={projectId} tagIds={tagIds} onProjectChange={setProjectId} onTagIdsChange={setTagIds} onCreateTag={onCreateTag} />
                    <div className={styles.field}>
                        <label htmlFor={`task-${task.id}-description`}>Description</label>
                        <textarea id={`task-${task.id}-description`} value={description} onChange={(event) => setDescription(event.target.value)} />
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
                        <input type="datetime-local" id={`task-${task.id}-due-date`} value={toLocalDateTimeInput(dueDate)}
                            min={new Date().toISOString().split('T')[0]} onChange={(event) => setDueDate(event.target.value)} />
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.saveButton} type="button" onClick={handleSave}>Save changes</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.topRow}>
                        <h3 className={styles.title}>{task.title}</h3>
                        <span className={`${styles.priority} ${styles[task.priority]}`}>{task.priority}</span>
                    </div>
                    <p className={styles.description}>{task.description}</p>
                    {task.project && <p className={styles.meta}><span className={styles.dueLabel}>Project</span><span>{task.project.title}</span></p>}
                    {(task.tags ?? []).length > 0 && <p className={styles.meta}><span className={styles.dueLabel}>Tags</span><span>{task.tags.map((tag) => tag.name).join(', ')}</span></p>}
                    {formattedDueDate && <p className={styles.meta}><span className={styles.dueLabel}>{dueState?.label ?? 'Due'}</span><span>{formattedDueDate}</span></p>}
                    <div className={styles.actions}>
                        <button type="button" className={styles.button} onClick={() => setEditing(true)}>Edit</button>
                        <button type="button" onClick={handleDelete} className={`${styles.button} ${styles.deleteButton}`}>Delete</button>
                    </div>
                </>
            )}
        </article>
    );
}

export default TaskCard;
