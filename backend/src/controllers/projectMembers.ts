import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess } from '../services/authorization';
import { isProjectRole } from './validation';

const projectIdFrom = (req: Request) => Number(req.params.projectId ?? req.params.id);

export async function updateMember(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = projectIdFrom(req); const memberId = String(req.params.userId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId);
    if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can manage members' }); return; }
    if (access.project.archivedAt) { res.status(403).json({ error: 'Archived projects are read-only' }); return; }
    const role = req.body.role;
    if (!isProjectRole(role) || role === 'owner') { res.status(400).json({ error: 'Choose editor or viewer' }); return; }
    const member = await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: memberId } } });
    if (!member) { res.status(404).json({ error: 'Member not found' }); return; }
    if (member.role === 'owner') { res.status(400).json({ error: 'Transfer ownership instead' }); return; }
    if (role === 'viewer' && await prisma.task.count({ where: { projectId, assigneeId: memberId } })) {
        res.status(409).json({ error: 'Unassign this member’s tasks before changing them to viewer' }); return;
    }
    const updated = await prisma.projectMembership.update({ where: { projectId_userId: { projectId, userId: memberId } }, data: { role } });
    res.json(updated);
}

export async function removeMember(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = projectIdFrom(req); const memberId = String(req.params.userId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId);
    if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.project.archivedAt) { res.status(403).json({ error: 'Archived projects are read-only' }); return; }
    const selfLeaving = memberId === userId;
    if (!selfLeaving && access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can remove members' }); return; }
    const member = await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: memberId } } });
    if (!member) { res.status(404).json({ error: 'Member not found' }); return; }
    if (member.role === 'owner') { res.status(400).json({ error: 'Transfer ownership before leaving' }); return; }
    await prisma.$transaction([
        prisma.task.updateMany({ where: { projectId, assigneeId: memberId }, data: { assigneeId: null } }),
        prisma.projectMembership.delete({ where: { projectId_userId: { projectId, userId: memberId } } }),
    ]);
    res.status(204).end();
}

export async function transferOwnership(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = projectIdFrom(req); const nextOwnerId = req.body.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId);
    if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can transfer ownership' }); return; }
    if (access.project.archivedAt) { res.status(403).json({ error: 'Restore the project before transferring ownership' }); return; }
    if (nextOwnerId === userId) { res.status(400).json({ error: 'Choose another editor as the new owner' }); return; }
    const recipient = typeof nextOwnerId === 'string' && await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: nextOwnerId } } });
    if (!recipient || recipient.role === 'viewer') { res.status(400).json({ error: 'Ownership can be transferred to an editor' }); return; }
    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${projectId})`;
        await tx.projectMembership.update({ where: { projectId_userId: { projectId, userId } }, data: { role: 'editor' } });
        await tx.projectMembership.update({ where: { projectId_userId: { projectId, userId: nextOwnerId } }, data: { role: 'owner' } });
    });
    res.status(204).end();
}
