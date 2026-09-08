import { useState } from 'react';
import styles from './create-task-form.module.css';
import { createTask } from '../../api/createTask';
import { useAuth } from '@clerk/react';

function CreateTaskForm ({tasks, setTasks}) {
    const { userId, getToken } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('low');
    const [dueDate, setDueDate] = useState('');


    const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle task creation logic here
    // 1. Send a request to the backend to create a new task. Update tasks state in the parent component
    // (TasksPage) to include the newly created task so it shows up in the UI without needing to refresh the page
    try {
        const token = await getToken();

        // Find the orderIndex to assign to the new task (insert at the bottom of the todo list)
        const todoTasks = tasks.filter(task => task.status === 'todo');
        const orderIndex = todoTasks.length > 0
            ? Math.max(...todoTasks.map(task => task.orderIndex)) + 1
            : 0;

        const newTask = await createTask(token, title, description, userId, priority, dueDate || null, orderIndex);
        setTasks((prevTasks) => [...prevTasks, newTask]); // Add the new task to the bottom of the todo list
    } catch (error) {
        console.error('Error creating task', error);
    }

    // 2. Clear the form fields after successful creation
    setTitle('');
    setDescription('');
    setPriority('low');
    setDueDate('');
};

    return (
        <form onSubmit={handleSubmit} className={styles.createTask}>
            <div className={styles.formIntro}>
                <h2>Create a task</h2>
                <p>Add details now, then organize it on the board.</p>
            </div>
            <div className={styles.field}>
                <label htmlFor="title">Title</label>
                <input type="text" id="title" name="title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className={styles.field}>
                <label htmlFor="description">Description <span className={styles.characterCount}>{description.length}/500</span></label>
                <textarea id="description" name="description" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className={styles.details}>
                <div className={styles.field}>
                    <label htmlFor="priority">Priority</label>
                    <select id="priority" name="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div className={styles.field}>
                    <label htmlFor="dueDate">Due date <span>(optional)</span></label>
                    <input type="datetime-local" id="dueDate" name="dueDate" value={dueDate}
                        min={new Date().toISOString().split('T')[0]} onChange={(e) => setDueDate(e.target.value)} />
                </div>
            </div>
            <button className={styles.submitButton} disabled={!(title && description)} type="submit">Create task</button>
        </form>
    );
}

export default CreateTaskForm;
