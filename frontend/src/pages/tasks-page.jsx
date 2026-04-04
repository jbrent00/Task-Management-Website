import TaskBoard from '../components/task-board/task-board';
import CreateTaskForm from '../components/create-task-form/create-task-form';
import styles from './tasks-page.module.css';
import { useState, useEffect } from 'react';
import { getTasks } from '../api/getTasks';
import { UserButton } from '@clerk/react';
import { useAuth  } from '@clerk/react';

function TasksPage () {
    const { getToken, isSignedIn , isLoaded } = useAuth();

    // State for a list of all tasks and lists for 3 statuses of tasks
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [todoTasks, setTodoTasks] = useState([]);
    const [inProgressTasks, setInProgressTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);

    // Fetch tasks from the backend when the component mounts
    useEffect( () => {
        if (!isLoaded) {
            return; // Wait for auth to load before doing anything
        } 

        const fetchTasks = async () => {
            // UPDATE
            // Send to sign-in page if not authenticated, otherwise fetch tasks
            if (!isSignedIn) {
                console.error('User is not authenticated');
                return;
            }
               
            const token = await getToken();
            const data = await getTasks(token);
            setTasks(data);
        }

        fetchTasks();
        setLoading(false);
        }, [isLoaded]);

    // Whenever the tasks state changes, update the 3 status lists
    useEffect( () => {
        setTodoTasks(tasks.filter( task => task.status === 'todo'));
        setInProgressTasks(tasks.filter( task => task.status === 'in_progress'));
        setCompletedTasks(tasks.filter( task => task.status === 'completed'));
    }, [tasks]);


    return (
        <div className={styles.tasksPage}>
            <div className={styles.header}>
                <h1>USER BUTTON</h1>
                <div className={styles.userButton}>
                    <UserButton />
                </div>
            </div>
            <div className={styles.createTask}>
                <CreateTaskForm tasks={tasks} setTasks={setTasks}/>
            </div>
            <div className={styles.taskBoards}>
                <TaskBoard status="todo" tasks={todoTasks} allTasks={tasks} setAllTasks={setTasks} loading={loading}/>
                <TaskBoard status="in_progress" tasks={inProgressTasks} allTasks={tasks} setAllTasks={setTasks} loading={loading}/>
                <TaskBoard status="completed" tasks={completedTasks} allTasks={tasks} setAllTasks={setTasks} loading={loading}/>
            </div>
        </div>
    );
}

export default TasksPage;
