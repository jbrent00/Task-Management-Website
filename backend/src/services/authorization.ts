import { prisma } from './prisma';
import type { ProjectRole } from '../../generated/prisma/client';
import { canWriteProject } from './projectPolicy';

export const writableRoles: ProjectRole[] = ['owner', 'editor'];

export async function getProjectAccess(projectId: number, userId: string) {
    return prisma.projectMembership.findUnique({
        where: { projectId_userId: { projectId, userId } },
        include: { project: true },
    });
}

export async function getTaskAccess(taskId: number, userId: string) {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
            project: {
                include: { memberships: { where: { userId }, select: { role: true } } },
            },
        },
    });
    if (!task) return null;
    if (!task.projectId) {
        return task.createdById === userId ? { task, role: null, canEdit: true } : null;
    }
    const role = task.project?.memberships[0]?.role;
    if (!role) return null;
    return { task, role, canEdit: canWriteProject(role, task.project?.archivedAt ?? null) };
}

export function isProjectWriter(role: ProjectRole) {
    return writableRoles.includes(role);
}
