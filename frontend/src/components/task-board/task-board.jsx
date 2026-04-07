import { getTasks } from '../../api/getTasks';
import { useState, useEffect } from 'react';
import TaskList from '../task-list/task-list';
import { Droppable } from '@hello-pangea/dnd';

function TaskBoard ({status, tasks, allTasks, setAllTasks, loading}) {
    
    return (
        
        <Droppable droppableId={status}>
        {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
                {loading 
                    ? <h2>Loading...</h2> 
                    : <TaskList status={status} tasks={tasks} allTasks={allTasks} setAllTasks={setAllTasks}/>
                }
                {provided.placeholder}
            </div>
        )}
        </Droppable>
        
    );
}

export default TaskBoard;
