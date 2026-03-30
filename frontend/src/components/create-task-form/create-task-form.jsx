import { useState } from 'react';
import styles from './create-task-form.module.css';
import { createTask } from '../../api/createTask';

function CreateTaskForm ({tasks, setTasks}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('low');
    const [dueDate, setDueDate] = useState('');
    const userId = 1; // Assuming userId is 1 for now, can be updated to get from auth context or similar

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Handle task creation logic here
        // 1. Send a request to the backend to create a new task. Update tasks state in the parent component 
        // (TasksPage) 
        // to include the newly created task so it shows up in the UI without needing to refresh the page
        try {
            const newTask = await createTask(title, description, userId, priority, dueDate || null); 
            setTasks((prevTasks) => [newTask, ...prevTasks]); // Add the new task to the existing list of tasks
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
            <h2>Create Task</h2>

            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" value={title} 
            maxLength={100} onChange={(e) => setTitle(e.target.value)} />

            <label htmlFor="description">Description:</label>
            <textarea id="description" name="description" value={description} 
            maxLength={500} onChange={(e) => setDescription(e.target.value)}></textarea>
            <span>{description.length}/500</span>

            <label htmlFor="dueDate">Due Date: <span>(optional)</span></label>
            <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            value={dueDate}
            min={new Date().toISOString().split('T')[0]}  // prevents past dates
            onChange={(e) => setDueDate(e.target.value)}
            />

            <label htmlFor="priority">Priority:</label>
            <select id="priority" name="priority" value={priority} 
            onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>

            <button disabled={!(title && description)} type="submit">Create Task</button>
        </form>
    );
}

export default CreateTaskForm;