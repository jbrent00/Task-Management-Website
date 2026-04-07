import TaskCard from "../task-card/task-card";
import { Draggable } from '@hello-pangea/dnd';
import styles from "./task-list.module.css";

function TaskList ({tasks, status, allTasks, setAllTasks}) {
 
    // We need to map over the tasks of a certain category
    return (
        <div className={styles.taskList}>
            {status === "todo" && <h2>To Do</h2>} 
            {status === "in_progress" && <h2>In Progress</h2>}
            {status === "completed" && <h2>Completed</h2>}
            
            {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                        >
                            <TaskCard task={task} allTasks={allTasks} setAllTasks={setAllTasks}/>
                        </div>
                    )}
                </Draggable>
            ))
            }
        </div>
    );
}

export default TaskList;
