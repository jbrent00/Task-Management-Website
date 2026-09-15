import { prisma } from '../services/prisma';
import { isTaskAssignmentInput } from './validation';

export async function validateTaskAssignments(userId: string, projectId: unknown, tagIds: unknown) {
    if (!isTaskAssignmentInput(projectId, tagIds)) return false;
    const ids = tagIds as number[];
    if (projectId !== null) {
        const project = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
        if (!project) return false;
    }
    const tagCount = await prisma.tag.count({ where: { id: { in: ids }, userId } });
    return tagCount === ids.length;
}
