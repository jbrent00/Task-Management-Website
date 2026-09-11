import TaskCard from '../task-card/task-card';
import { Draggable } from '@hello-pangea/dnd';
import styles from './task-list.module.css';

function TaskList({ tasks, status, allTasks, setAllTasks, loading, isManualOrder, isFiltered, selectedTab, projects, tags, onCreateTag }) {
    const statusDetails = {
        todo: { label: 'To do', className: 'todo', emptyMessage: 'No tasks yet. Create one above to get started.' },
        in_progress: { label: 'In progress', className: 'inProgress', emptyMessage: 'Move a task here when you are ready to focus.' },
        completed: { label: 'Completed', className: 'completed', emptyMessage: 'Completed tasks will appear here.' },
    };
    const { label, className, emptyMessage } = statusDetails[status];
    const focusedEmptyMessage = selectedTab === 'completedRecently' ? 'No recently completed tasks in this status.' : status === 'completed' && selectedTab !== 'all' ? 'Completed tasks are shown in Completed recently.' : 'No tasks match this date view.';

    return (
        <section className={`${styles.taskList} ${styles[className]}`} aria-label={`${label} tasks`}>
            <div className={styles.heading}>
                <div className={styles.headingContent}>
                    <span className={styles.statusMarker} aria-hidden="true" />
                    <h2>{label}</h2>
                </div>
                <span className={styles.count}>{tasks.length}</span>
            </div>
            {loading ? <p className={styles.loadingState}>Loading tasks...</p> : tasks.length === 0 ? <p className={styles.emptyState}>{isFiltered ? focusedEmptyMessage : emptyMessage}</p> : tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={!isManualOrder}>
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <TaskCard task={task} allTasks={allTasks} setAllTasks={setAllTasks} projects={projects} tags={tags} onCreateTag={onCreateTag} />
                        </div>
                    )}
                </Draggable>
            ))}
        </section>
    );
}

export default TaskList;
