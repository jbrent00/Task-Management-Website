import styles from './task-card.module.css';
import { deleteTask } from '../../api/deleteTask';
import { updateTask } from '../../api/updateTask';
import toLocalDateTimeInput from '../../functions/toLocalDateTime';
import { useState } from 'react';
import { useAuth } from '@clerk/react';

function TaskCard ({task, allTasks, setAllTasks}) {
    const { getToken } = useAuth();

    const [editing, setEditing] = useState(false);
    const [dueDate, setDueDate] = useState(
    task.dueDate ? toLocalDateTimeInput(task.dueDate) : '');
    const [status, setStatus] = useState(task.status);
    const [priority, setPriority] = useState(task.priority);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);

    const handleDelete = async () => {
        const taskId = task.id;
        try {
            const token = await getToken();

            await deleteTask(token, taskId);
            // After deleting the task, we want to update the list of tasks in the parent component
            setAllTasks(allTasks.filter( t => t.id !== taskId));    
        } 
        catch (error) {
            console.error('Error deleting task', error);
        }
    };

    const handleSave = async () => {
        // Needed for properly checking if dueDate has changed, since it can be null, state uses ''
        const dueDateForComparing = task.dueDate ? toLocalDateTimeInput(task.dueDate) : '';

        if (title === task.title && description === task.description && status === task.status 
            && priority === task.priority && dueDate === dueDateForComparing) {
                setEditing(false);
                return; // No changes, so we can skip the API call
        }
        
        try {
            const token = await getToken();
            const updatedTask = await updateTask(token, task.id, title, description, status, priority, dueDate || null);
            // Update allTasks array with the updated task
            setAllTasks( allTasks.map(
                t => t.id === task.id ? updatedTask : t
            ));

            setEditing(false);
        } catch (error) {
            console.error('Error updating task', error);
        }
    }

    return (
        <div className={styles.card}>
            { editing ? 
            <>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                className={styles.editTitle}
            />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} 
                className={styles.editDescription}
            />

            <label htmlFor="status">Status:</label>    
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
            </select>

            <label htmlFor="priority">Priority:</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>

            <label htmlFor="dueDate" className={styles.editDateLabel}>
                Due Date: <span>(optional)</span>
            </label>    
            <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            value={toLocalDateTimeInput(dueDate)}
            min={new Date().toISOString().split('T')[0]}  // prevents past dates
            onChange={(e) => setDueDate(e.target.value)}
            />

            <button className={styles.saveButton} onClick={handleSave}>Save</button> 
            
            
            </>
            :
            <>
            <h3 className={styles.title}>{task.title}</h3>
            <p className={styles.description}>{task.description}</p>
            {task.dueDate && (
            <span>
                Due: {toLocalDateTimeInput(task.dueDate).replace('T', ' ')}
            </span>
            )}
            <button className={styles.button} onClick={() => setEditing(true)}>Edit</button>
            <button onClick={handleDelete} className={styles.button}>Delete</button>
            </>
            }
        </div>
    );
}

export default TaskCard;
