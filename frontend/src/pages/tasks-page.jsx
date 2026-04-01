import TaskBoard from '../components/task-board/task-board';
import CreateTaskForm from '../components/create-task-form/create-task-form';
import styles from './tasks-page.module.css';
import { useState, useEffect } from 'react';
import { getTasks } from '../api/getTasks';


function TasksPage () {
    // State for a list of all tasks and lists for 3 statuses of tasks
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [todoTasks, setTodoTasks] = useState([]);
    const [inProgressTasks, setInProgressTasks] = useState([]);
    const [completedTasks, setCompletedTasks] = useState([]);

    // Fetch tasks from the backend when the component mounts
    useEffect( () => {
        const fetchTasks = async () => {
            const data = await getTasks();
            setTasks(data);
        }

        fetchTasks();
        setLoading(false);
        }, []);

    // Whenever the tasks state changes, update the 3 status lists
    useEffect( () => {
        setTodoTasks(tasks.filter( task => task.status === 'todo'));
        setInProgressTasks(tasks.filter( task => task.status === 'in_progress'));
        setCompletedTasks(tasks.filter( task => task.status === 'completed'));
    }, [tasks]);


    return (
        <div className={styles.tasksPage}>
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
