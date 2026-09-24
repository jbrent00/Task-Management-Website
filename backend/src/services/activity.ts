import type { Prisma, ProjectActivityType } from '../../generated/prisma/client';

export type ActivityWriter = Pick<Prisma.TransactionClient, 'projectActivity'>;

export function recordActivity(
    tx: ActivityWriter,
    input: {
        projectId: number;
        taskId?: number | null;
        actorId?: string | null;
        type: ProjectActivityType;
        metadata?: Prisma.InputJsonValue;
    },
) {
    return tx.projectActivity.create({
        data: {
            projectId: input.projectId,
            taskId: input.taskId ?? null,
            actorId: input.actorId ?? null,
            type: input.type,
            metadata: input.metadata ?? {},
        },
    });
}
