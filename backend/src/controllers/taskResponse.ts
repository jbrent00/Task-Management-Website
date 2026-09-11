export const taskInclude = {
    project: { select: { id: true, title: true } },
    taskTags: { include: { tag: { select: { id: true, name: true, color: true } } } },
} as const;

type TaskWithTags = { taskTags: Array<{ tag: { id: number; name: string; color: string } }> };

export function serializeTask<T extends TaskWithTags>(task: T) {
    const { taskTags, ...taskFields } = task;
    return { ...taskFields, tags: taskTags.map(({ tag }) => tag) };
}
