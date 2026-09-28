import { useAuth } from '@clerk/react';
import { joinProjectTask, leaveProjectTask } from '../../api/projectTasks';
import { getTaskDueState } from '../../functions/taskViews';
import { useTaskMutation } from '../../functions/taskMutationContext';
import MyTasksProjectCard from './my-tasks-project-card';
import PersonalTaskCard from './personal-task-card';
import ProjectBoardTaskCard from './project-board-task-card';
import { createAuthenticatedOperations } from '../../functions/workspace-operations';
import { useWorkspaceOperations } from '../../functions/workspace-context';

function AuthenticatedTaskCard(props) {
    const { getToken } = useAuth();
    return <TaskCardContent {...props} operations={createAuthenticatedOperations(getToken)} />;
}

function TaskCardContent({ task, setAllTasks, projectMode = false, onNotify, onOpenDetails, dragHandleProps, isDragEnabled, operations }) {
    const mutation = useTaskMutation();
    const currentAssigneeIds = (task.assignees ?? []).map((person) => person.id);
    const handleCompletion = async () => {
        if (!mutation.begin()) return;
        try {
            const updated = await operations.updateTask(task.id, { title: task.title, description: task.description ?? '', status: task.status === 'completed' ? 'todo' : 'completed', priority: task.priority, dueDate: task.dueDate, projectId: task.projectId, tagIds: (task.tags ?? []).map((tag) => tag.id), assigneeIds: currentAssigneeIds });
            setAllTasks((current) => current.map((item) => item.id === task.id ? updated : item));
            onNotify({ tone: 'success', message: `${updated.status === 'completed' ? 'Completed' : 'Reopened'} “${updated.title}”.` });
        } catch {
            onNotify({ tone: 'error', message: `Could not change the status of “${task.title}”. Please try again.` });
        } finally { mutation.end(); }
    };
    const canParticipate = task.capabilities?.canJoin || task.capabilities?.canLeave;
    const handleParticipation = async () => {
        const joining = task.capabilities?.canJoin;
        if (!joining && !task.capabilities?.canLeave) return;
        if (!mutation.begin()) return;
        try {
            const updated = joining ? await joinProjectTask(await operations.getToken(), task.id) : await leaveProjectTask(await operations.getToken(), task.id);
            setAllTasks((current) => current.map((item) => item.id === task.id ? updated : item));
            onNotify({ tone: 'success', message: `${joining ? 'Joined' : 'Left'} “${task.title}”.` });
        } catch (error) { onNotify({ tone: 'error', message: error.message }); }
        finally { mutation.end(); }
    };
    const view = {
        task,
        dueState: getTaskDueState(task),
        formattedDueDate: task.dueDate && new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(task.dueDate)),
    };
    const common = {
        view,
        busy: mutation.busy,
        onCompletion: handleCompletion,
        onOpenDetails: onOpenDetails ? () => onOpenDetails(task.id) : undefined,
        onParticipation: canParticipate ? handleParticipation : undefined,
        dragHandleProps,
        isDragEnabled,
    };
    if (projectMode) return <ProjectBoardTaskCard {...common} />;
    if (task.projectId || task.project) return <MyTasksProjectCard {...common} />;
    return <PersonalTaskCard {...common} />;
}

export default function TaskCard(props) {
    const operations = useWorkspaceOperations();
    return operations ? <TaskCardContent {...props} operations={operations} /> : <AuthenticatedTaskCard {...props} />;
}
