import { prisma } from '../services/prisma';
import { isTaskAssignmentInput } from './validation';

export async function validatePersonalTags(userId: string, tagIds: unknown) {
    if (!isTaskAssignmentInput(null, tagIds)) return false;
    const ids = tagIds as number[];
    return await prisma.tag.count({ where: { id: { in: ids }, userId } }) === ids.length;
}

export async function validateProjectAssignments(projectId: number, assigneeIds: unknown, tagIds: unknown) {
    if (!Array.isArray(assigneeIds) || !assigneeIds.every((id) => typeof id === 'string') || new Set(assigneeIds).size !== assigneeIds.length || !isTaskAssignmentInput(projectId, tagIds)) return false;
    const ids = tagIds as number[];
    const eligibleAssigneeCount = await prisma.projectMembership.count({ where: { projectId, userId: { in: assigneeIds as string[] }, role: { in: ['owner', 'editor'] } } });
    if (eligibleAssigneeCount !== assigneeIds.length) return false;
    return await prisma.projectTag.count({ where: { id: { in: ids }, projectId } }) === ids.length;
}
