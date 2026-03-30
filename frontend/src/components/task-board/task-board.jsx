import { getTasks } from '../../api/getTasks';
import { useState, useEffect } from 'react';
import TaskList from '../task-list/task-list';

function TaskBoard ({status, tasks, loading}) {
    
    return (
        <>{loading ? <h2>Loading...</h2>: <TaskList status={status} tasks={tasks}/>}</>
        
    );
}

export default TaskBoard;
