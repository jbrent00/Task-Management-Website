import { prisma } from '../services/prisma';
import { isIntegerOrNull } from './validation';

export async function validateTaskAssignments(userId: string, projectId: unknown, tagIds: unknown) {
    if (!isIntegerOrNull(projectId) || !Array.isArray(tagIds) || !tagIds.every(Number.isInteger)) return false;
    const ids = tagIds as number[];
    if (new Set(ids).size !== ids.length) return false;
    if (projectId !== null) {
        const project = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
        if (!project) return false;
    }
    const tagCount = await prisma.tag.count({ where: { id: { in: ids }, userId } });
    return tagCount === ids.length;
}
