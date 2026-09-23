export function canChangeProjectTaskAssignment(project, userId, currentAssigneeId, nextAssigneeId) {
    if (!project || project.archivedAt || project.role === 'viewer') return false;
    if (project.role === 'owner') return true;
    if (currentAssigneeId === nextAssigneeId) return true;

    const actorAdded = currentAssigneeId !== userId && nextAssigneeId === userId;
    const actorRemoved = currentAssigneeId === userId && nextAssigneeId !== userId;
    const otherAssigneeChanged = (currentAssigneeId !== null && currentAssigneeId !== userId)
        || (nextAssigneeId !== null && nextAssigneeId !== userId);

    return (!actorAdded || project.editorsCanJoinTasks)
        && (!actorRemoved || project.editorsCanLeaveTasks)
        && (!otherAssigneeChanged || project.editorsCanAssignOthers);
}
