import { prisma } from '../services/prisma';
import { isTaskAssignmentInput } from './validation';
import { canBeAssigned } from '../services/projectPolicy';

export async function validatePersonalTags(userId: string, tagIds: unknown) {
    if (!isTaskAssignmentInput(null, tagIds)) return false;
    const ids = tagIds as number[];
    return await prisma.tag.count({ where: { id: { in: ids }, userId } }) === ids.length;
}

export async function validateProjectAssignments(projectId: number, assigneeId: unknown, tagIds: unknown) {
    if (!(assigneeId === null || typeof assigneeId === 'string') || !isTaskAssignmentInput(projectId, tagIds)) return false;
    const ids = tagIds as number[];
    if (assigneeId !== null) {
        const membership = await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: assigneeId } } });
        if (!membership || !canBeAssigned(membership.role)) return false;
    }
    return await prisma.projectTag.count({ where: { id: { in: ids }, projectId } }) === ids.length;
}
