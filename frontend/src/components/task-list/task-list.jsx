import TaskCard from "../task-card/task-card";
import styles from "./task-list.module.css";

function TaskList ({tasks, status, allTasks, setAllTasks}) {
 
    // We need to map over the tasks of a certain category
    return (
        <div className={styles.taskList}>
            {status === "todo" && <h2>To Do</h2>} 
            {status === "in_progress" && <h2>In Progress</h2>}
            {status === "completed" && <h2>Completed</h2>}
            
            {
            tasks.map(
                task => (<TaskCard key={task.id} id={task.id} task={task} allTasks={allTasks} setAllTasks={setAllTasks}/>)
            )
            }
        </div>
    );
}

export default TaskList;
