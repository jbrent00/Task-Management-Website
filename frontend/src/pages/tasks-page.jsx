import TaskBoard from '../components/task-board/task-board';
import CreateTaskForm from '../components/create-task-form/create-task-form';
import styles from './tasks-page.module.css';
import { useState, useEffect, useMemo } from 'react';
import { getTasks } from '../api/getTasks';
import { UserButton } from '@clerk/react';
import { useAuth  } from '@clerk/react';
import { DragDropContext } from '@hello-pangea/dnd';
import { updateTasks } from '../api/updateTasks';

function TasksPage () {
    const { getToken, isSignedIn , isLoaded } = useAuth();

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);

    const tasksByStatus = useMemo(() => ({
        todo: tasks.filter((task) => task.status === 'todo').sort((a, b) => a.orderIndex - b.orderIndex),
        in_progress: tasks.filter((task) => task.status === 'in_progress').sort((a, b) => a.orderIndex - b.orderIndex),
        completed: tasks.filter((task) => task.status === 'completed').sort((a, b) => a.orderIndex - b.orderIndex),
    }), [tasks]);

    // Fetch tasks from the backend when the component mounts
    useEffect( () => {
        
        if (!isLoaded) {
            return; // Wait for auth to load before doing anything
        } 

        const fetchTasks = async () => {
            if (!isSignedIn) {
                setLoading(false);
                return;
            }

            try {
                const token = await getToken();
                const data = await getTasks(token);
                setTasks(data);
            } catch (error) {
                console.error('Error fetching tasks', error);
            } finally {
                setLoading(false);
            }
        }

        fetchTasks();
        
        }, [getToken, isLoaded, isSignedIn]);

    // Function to handle drag and drop of tasks between columns
    const handleDragEnd = async (result) => {
        const { source, destination } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceStatus = source.droppableId;
        const destinationStatus = destination.droppableId;
        const sourceTasks = [...tasksByStatus[sourceStatus]];
        const destinationTasks = sourceStatus === destinationStatus
            ? sourceTasks
            : [...tasksByStatus[destinationStatus]];
        const [movedTask] = sourceTasks.splice(source.index, 1);

        if (!movedTask) return;

        destinationTasks.splice(destination.index, 0, movedTask);

        const reorderedLists = sourceStatus === destinationStatus
            ? [[sourceStatus, sourceTasks]]
            : [
                [sourceStatus, sourceTasks],
                [destinationStatus, destinationTasks],
            ];
        const reorderedTasks = reorderedLists.flatMap(([status, list]) =>
            list.map((task, index) => ({ ...task, status, orderIndex: index }))
        );
        const updatesById = new Map(reorderedTasks.map((task) => [task.id, task]));
        const nextTasks = tasks.map((task) => updatesById.get(task.id) ?? task);

        setTasks(nextTasks);

        try {
            const token = await getToken();
            await updateTasks(token, reorderedTasks);
        } catch (error) {
            console.error('Error updating task order', error);
            setTasks(tasks);
        }

    }


    return (
        <div className={styles.tasksPage}>
            <div className={styles.header}>
                <h1>USER BUTTON</h1>
                <div className={styles.userButton}>
                    <UserButton />
                </div>
            </div>
            <div className={styles.createTask}>
                <CreateTaskForm tasks={tasks} setTasks={setTasks}/>
            </div>
            <div className={styles.taskBoards}>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <TaskBoard status="todo" tasks={tasksByStatus.todo} allTasks={tasks} setAllTasks={setTasks} loading={loading}/>
                    <TaskBoard status="in_progress" tasks={tasksByStatus.in_progress} allTasks={tasks} setAllTasks={setTasks} loading={loading}/>
                    <TaskBoard status="completed" tasks={tasksByStatus.completed} allTasks={tasks} setAllTasks={setTasks} loading={loading}/>
                </DragDropContext>
            </div>
        </div>
    );
}

export default TasksPage;
