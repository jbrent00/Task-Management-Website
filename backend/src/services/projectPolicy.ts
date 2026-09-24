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

export type ProjectTaskIdentity = { createdById: string; assignments?: Array<{ userId: string }> };

export function canCreateProjectTask(role: ProjectRole, project: ProjectTaskPolicy) {
    return !project.archivedAt && (role === 'owner' || (role === 'editor' && project.editorsCanCreateTasks));
}

export function canEditProjectTask(role: ProjectRole, project: ProjectTaskPolicy, task: ProjectTaskIdentity, userId: string) {
    if (project.archivedAt || role === 'viewer') return false;
    if (role === 'owner' || project.editorsCanEditAllTasks) return true;
    const assigneeIds = new Set((task.assignments ?? []).map((assignment) => assignment.userId));
    return assigneeIds.has(userId) || (assigneeIds.size === 0 && task.createdById === userId);
}

export function canChangeAssignments(role: ProjectRole, project: ProjectTaskPolicy, userId: string, currentAssigneeIds: Iterable<string>, nextAssigneeIds: Iterable<string>) {
    if (project.archivedAt || role === 'viewer') return false;
    if (role === 'owner') return true;
    const current = new Set(currentAssigneeIds);
    const next = new Set(nextAssigneeIds);
    const added = [...next].filter((id) => !current.has(id));
    const removed = [...current].filter((id) => !next.has(id));
    const actorAdded = added.includes(userId);
    const actorRemoved = removed.includes(userId);
    const otherAssigneeChanged = [...added, ...removed].some((id) => id !== userId);

    return (!actorAdded || project.editorsCanJoinTasks)
        && (!actorRemoved || project.editorsCanLeaveTasks)
        && (!otherAssigneeChanged || project.editorsCanAssignOthers);
}
