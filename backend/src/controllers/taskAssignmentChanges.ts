import type { Prisma } from '../../generated/prisma/client';
import { recordActivity } from '../services/activity';

const personName = (person: { fname: string | null; lname: string | null; primaryEmail: string | null }) =>
    [person.fname, person.lname].filter(Boolean).join(' ') || person.primaryEmail || 'Member';

export async function syncTaskAssignments(
    tx: Prisma.TransactionClient,
    input: {
        taskId: number;
        projectId: number;
        projectTitle: string;
        taskTitle: string;
        actorId: string;
        currentIds: string[];
        nextIds: string[];
    },
) {
    const current = new Set(input.currentIds);
    const next = new Set(input.nextIds);
    const added = [...next].filter((id) => !current.has(id));
    const removed = [...current].filter((id) => !next.has(id));
    if (!added.length && !removed.length) return { added, removed };

    if (removed.length) await tx.taskAssignment.deleteMany({ where: { taskId: input.taskId, userId: { in: removed } } });
    if (added.length) await tx.taskAssignment.createMany({ data: added.map((userId) => ({ taskId: input.taskId, userId })) });

    const changedPeople = await tx.user.findMany({
        where: { id: { in: [...added, ...removed] } },
        select: { id: true, fname: true, lname: true, primaryEmail: true },
    });
    const names = new Map(changedPeople.map((person) => [person.id, personName(person)]));
    const metadata = { projectTitle: input.projectTitle, taskTitle: input.taskTitle };
    await Promise.all([
        ...added.filter((id) => id !== input.actorId).map((userId) => tx.notification.create({ data: { userId, actorId: input.actorId, projectId: input.projectId, taskId: input.taskId, type: 'task_assigned', metadata } })),
        ...removed.filter((id) => id !== input.actorId).map((userId) => tx.notification.create({ data: { userId, actorId: input.actorId, projectId: input.projectId, taskId: input.taskId, type: 'task_unassigned', metadata } })),
    ]);
    await recordActivity(tx, {
        projectId: input.projectId,
        taskId: input.taskId,
        actorId: input.actorId,
        type: 'task_assignees_changed',
        metadata: {
            taskTitle: input.taskTitle,
            added: added.map((userId) => ({ userId, name: names.get(userId) ?? 'Member' })),
            removed: removed.map((userId) => ({ userId, name: names.get(userId) ?? 'Member' })),
        },
    });
    return { added, removed };
}
