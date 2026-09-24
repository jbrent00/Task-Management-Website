export function canChangeProjectTaskAssignments(project, userId, currentAssigneeIds, nextAssigneeIds) {
    if (!project || project.archivedAt || project.role === 'viewer') return false;
    if (project.role === 'owner') return true;
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
