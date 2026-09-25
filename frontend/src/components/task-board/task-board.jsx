import TaskList from '../task-list/task-list';
import { Droppable } from '@hello-pangea/dnd';
import styles from './task-board.module.css';

function TaskBoard ({status, tasks, setAllTasks, loading, isManualOrder, isFiltered, selectedTab, projectMode = false, onNotify, onOpenDetails}) {
    
    return (
        <Droppable droppableId={status} isDropDisabled={!isManualOrder}>
        {(provided) => (
            <div className={styles.taskBoard} ref={provided.innerRef} {...provided.droppableProps}>
                <TaskList status={status} tasks={tasks} setAllTasks={setAllTasks} loading={loading} isManualOrder={isManualOrder} isFiltered={isFiltered} selectedTab={selectedTab} projectMode={projectMode} onNotify={onNotify} onOpenDetails={onOpenDetails}>
                    {provided.placeholder}
                </TaskList>
            </div>
        )}
        </Droppable>
    );
}

export default TaskBoard;
