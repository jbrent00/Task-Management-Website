import type { ProjectRole } from '../../generated/prisma/client';

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const canWriteProject = (role: ProjectRole, archivedAt: Date | null) => archivedAt === null && (role === 'owner' || role === 'editor');
export const canManageProject = (role: ProjectRole, archivedAt: Date | null) => archivedAt === null && role === 'owner';
export const canBeAssigned = (role: ProjectRole) => role === 'owner' || role === 'editor';
export const invitationIsActionable = (invitation: { status: string; expiresAt: Date; normalizedEmail: string }, verifiedEmails: Set<string>, now = new Date()) => invitation.status === 'pending' && invitation.expiresAt > now && verifiedEmails.has(invitation.normalizedEmail);

export type ProjectTaskPolicy = {
    archivedAt: Date | null;
    editorsCanCreateTasks: boolean;
    editorsCanAssignOthers: boolean;
    editorsCanEditAllTasks: boolean;
    editorsCanJoinTasks: boolean;
    editorsCanLeaveTasks: boolean;
};

export type ProjectTaskIdentity = { createdById: string; assigneeId: string | null };

export function canCreateProjectTask(role: ProjectRole, project: ProjectTaskPolicy) {
    return !project.archivedAt && (role === 'owner' || (role === 'editor' && project.editorsCanCreateTasks));
}

export function canEditProjectTask(role: ProjectRole, project: ProjectTaskPolicy, task: ProjectTaskIdentity, userId: string) {
    if (project.archivedAt || role === 'viewer') return false;
    if (role === 'owner' || project.editorsCanEditAllTasks) return true;
    return task.assigneeId === userId || (task.assigneeId === null && task.createdById === userId);
}

export function canChangeAssignment(role: ProjectRole, project: ProjectTaskPolicy, userId: string, currentAssigneeId: string | null, nextAssigneeId: string | null) {
    if (project.archivedAt || role === 'viewer') return false;
    if (role === 'owner') return true;
    if (currentAssigneeId === nextAssigneeId) return true;

    // Model an assignment change by its independent effects. These checks map
    // directly to additions/removals when tasks support multiple assignees.
    const actorAdded = currentAssigneeId !== userId && nextAssigneeId === userId;
    const actorRemoved = currentAssigneeId === userId && nextAssigneeId !== userId;
    const otherAssigneeChanged = (currentAssigneeId !== null && currentAssigneeId !== userId)
        || (nextAssigneeId !== null && nextAssigneeId !== userId);

    return (!actorAdded || project.editorsCanJoinTasks)
        && (!actorRemoved || project.editorsCanLeaveTasks)
        && (!otherAssigneeChanged || project.editorsCanAssignOthers);
}
