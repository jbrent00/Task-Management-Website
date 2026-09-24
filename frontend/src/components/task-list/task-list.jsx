import TaskCard from '../task-card/task-card';
import { Draggable } from '@hello-pangea/dnd';
import styles from './task-list.module.css';
import { taskViewTabs } from '../../functions/taskViews';

function TaskList({ tasks, status, setAllTasks, loading, isManualOrder, isFiltered, selectedTab, projectMode = false, inlineChecklist = false, onNotify, onOpenDetails, children }) {
    const statusDetails = {
        todo: { label: 'To do', className: 'todo', emptyMessage: 'No tasks yet. Create one above to get started.' },
        in_progress: { label: 'In progress', className: 'inProgress', emptyMessage: 'Move a task here when you are ready to focus.' },
        completed: { label: 'Completed', className: 'completed', emptyMessage: 'Completed tasks will appear here.' },
    };
    const { label, className, emptyMessage } = statusDetails[status];
    const dateViewLabel = taskViewTabs.find(([value]) => value === selectedTab)?.[1] ?? 'All tasks';

    return (
        <section className={`${styles.taskList} ${styles[className]}`} aria-label={`${label} tasks`}>
            <div className={styles.heading}>
                <div className={styles.headingContent}>
                    <span className={styles.statusMarker} aria-hidden="true" />
                    <h2>{label}</h2>
                </div>
                <span className={styles.count}>{tasks.length}</span>
            </div>
            {loading ? <p className={styles.loadingState}>Loading tasks...</p> : tasks.length === 0 ? <p className={styles.emptyState}>{isFiltered ? `No ${label.toLowerCase()} tasks match “${dateViewLabel}” with the current search and filters.` : emptyMessage}</p> : tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={!isManualOrder || (!projectMode && Boolean(task.projectId)) || task.capabilities?.canReorder === false}>
                    {(provided) => (
                        <div className={styles.draggableItem} ref={provided.innerRef} {...provided.draggableProps}>
                            <TaskCard task={task} setAllTasks={setAllTasks} projectMode={projectMode} inlineChecklist={inlineChecklist} onNotify={onNotify} onOpenDetails={onOpenDetails} dragHandleProps={provided.dragHandleProps} isDragEnabled={isManualOrder && (projectMode || !task.projectId) && task.capabilities?.canReorder !== false} />
                        </div>
                    )}
                </Draggable>
            ))}
            {children}
        </section>
    );
}

export default TaskList;
