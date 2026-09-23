export const taskInclude = {
    project: { select: { id: true, title: true, archivedAt: true } },
    createdBy: { select: { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } },
    assignee: { select: { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } },
    taskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    projectTaskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
    checklistItems: { orderBy: { orderIndex: 'asc' as const } },
} as const;

type TaskWithRelations = {
    projectId: number | null;
    taskTags: Array<{ tag: { id: number; name: string; color: string } }>;
    projectTaskTags: Array<{ tag: { id: number; name: string; color: string } }>;
};

export function serializeTask<T extends TaskWithRelations>(task: T, canEdit = true) {
    const { taskTags, projectTaskTags, ...taskFields } = task;
    const source = task.projectId ? projectTaskTags : taskTags;
    return { ...taskFields, tags: source.map(({ tag }) => tag), capabilities: { canEdit, canDelete: canEdit, canReorder: canEdit } };
}
