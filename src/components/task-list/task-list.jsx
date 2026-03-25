import TaskCard from "../task-card/task-card";
import styles from "./task-list.module.css";

function TaskList ({tasks}) {
    console.log(tasks);
    // We need to map over the tasks of a certain category
    return (
        <div className={styles.taskList}>
            {tasks.map(
                task => (<TaskCard key={task.id} task={task}/>)
            )}
        </div>
    );
}

export default TaskList;