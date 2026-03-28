import { getTasks } from '../../api/getTasks';
import { useState, useEffect } from 'react';
import TaskList from '../task-list/task-list';

function TaskBoard () {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTasks().then((data) => {
        setTasks(data);
        setLoading(false);
        });
    }, []);

    return (
        <>{loading ? <h2>Loading...</h2>: <TaskList tasks={tasks}/>}</>
        
    );
}

export default TaskBoard;
