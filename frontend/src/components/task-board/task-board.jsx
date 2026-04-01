import { getTasks } from '../../api/getTasks';
import { useState, useEffect } from 'react';
import TaskList from '../task-list/task-list';

function TaskBoard ({status, tasks, allTasks, setAllTasks, loading}) {
    
    return (
        <>{loading ? <h2>Loading...</h2>: <TaskList status={status} tasks={tasks} allTasks={allTasks} setAllTasks={setAllTasks}/>}</>
        
    );
}

export default TaskBoard;
