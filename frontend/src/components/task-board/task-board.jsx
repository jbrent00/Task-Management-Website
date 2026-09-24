import TaskList from '../task-list/task-list';
import { Droppable } from '@hello-pangea/dnd';
import styles from './task-board.module.css';

function TaskBoard ({status, tasks, allTasks, setAllTasks, loading, isManualOrder, isFiltered, selectedTab, projects, tags, members = [], projectMode = false, inlineChecklist = false, onCreateTag, onNotify, onOpenDetails}) {
    
    return (
        <Droppable droppableId={status} isDropDisabled={!isManualOrder}>
        {(provided) => (
            <div className={styles.taskBoard} ref={provided.innerRef} {...provided.droppableProps}>
                <TaskList status={status} tasks={tasks} allTasks={allTasks} setAllTasks={setAllTasks} loading={loading} isManualOrder={isManualOrder} isFiltered={isFiltered} selectedTab={selectedTab} projects={projects} tags={tags} members={members} projectMode={projectMode} inlineChecklist={inlineChecklist} onCreateTag={onCreateTag} onNotify={onNotify} onOpenDetails={onOpenDetails}>
                    {provided.placeholder}
                </TaskList>
            </div>
        )}
        </Droppable>
    );
}

export default TaskBoard;
