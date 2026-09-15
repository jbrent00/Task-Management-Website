import TaskList from '../task-list/task-list';
import { Droppable } from '@hello-pangea/dnd';

function TaskBoard ({status, tasks, allTasks, setAllTasks, loading, isManualOrder, isFiltered, selectedTab, projects, tags, onCreateTag, onNotify}) {
    
    return (
        <Droppable droppableId={status} isDropDisabled={!isManualOrder}>
        {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
                <TaskList status={status} tasks={tasks} allTasks={allTasks} setAllTasks={setAllTasks} loading={loading} isManualOrder={isManualOrder} isFiltered={isFiltered} selectedTab={selectedTab} projects={projects} tags={tags} onCreateTag={onCreateTag} onNotify={onNotify}/>
                {provided.placeholder}
            </div>
        )}
        </Droppable>
    );
}

export default TaskBoard;
