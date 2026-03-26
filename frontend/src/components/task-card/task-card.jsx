import styles from './task-card.module.css';

function TaskCard ({task}) {
    return (
        <div className={styles.card}>
            <h3 className={styles.title}>{task.title}</h3>
            <p className={styles.description}>{task.description}</p>
        </div>
    );
}

export default TaskCard;
