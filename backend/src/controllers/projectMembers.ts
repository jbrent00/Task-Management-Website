import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess } from '../services/authorization';
import { isProjectRole } from './validation';
import { recordActivity } from '../services/activity';

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
    const member = await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: memberId } }, include: { user: { select: { fname: true, lname: true, primaryEmail: true } } } });
    if (!member) { res.status(404).json({ error: 'Member not found' }); return; }
    if (member.role === 'owner') { res.status(400).json({ error: 'Transfer ownership instead' }); return; }
    if (role === 'viewer' && await prisma.taskAssignment.count({ where: { userId: memberId, task: { projectId } } })) {
        res.status(409).json({ error: 'Unassign this member’s tasks before changing them to viewer' }); return;
    }
    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.projectMembership.update({ where: { projectId_userId: { projectId, userId: memberId } }, data: { role } });
        if (memberId !== userId && member.role !== role) await tx.notification.create({ data: { userId: memberId, actorId: userId, projectId, type: 'role_changed', metadata: { projectTitle: access.project.title, previousRole: member.role, role } } });
        if (member.role !== role) await recordActivity(tx, { projectId, actorId: userId, type: 'member_role_changed', metadata: { memberId, memberName: [member.user.fname, member.user.lname].filter(Boolean).join(' ') || member.user.primaryEmail || 'Member', from: member.role, to: role } });
        return result;
    });
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
    const member = await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: memberId } }, include: { user: { select: { fname: true, lname: true, primaryEmail: true } } } });
    if (!member) { res.status(404).json({ error: 'Member not found' }); return; }
    if (member.role === 'owner') { res.status(400).json({ error: 'Transfer ownership before leaving' }); return; }
    await prisma.$transaction(async (tx) => {
        await tx.taskAssignment.deleteMany({ where: { userId: memberId, task: { projectId } } });
        await tx.projectMembership.delete({ where: { projectId_userId: { projectId, userId: memberId } } });
        if (!selfLeaving) await tx.notification.create({ data: { userId: memberId, actorId: userId, projectId, type: 'project_removed', metadata: { projectTitle: access.project.title } } });
        await recordActivity(tx, { projectId, actorId: userId, type: 'member_removed', metadata: { memberId, memberName: [member.user.fname, member.user.lname].filter(Boolean).join(' ') || member.user.primaryEmail || 'Member', selfLeaving } });
    });
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
        await tx.notification.create({ data: { userId: nextOwnerId, actorId: userId, projectId, type: 'ownership_transferred', metadata: { projectTitle: access.project.title } } });
        await recordActivity(tx, { projectId, actorId: userId, type: 'ownership_transferred', metadata: { previousOwnerId: userId, nextOwnerId } });
    });
    res.status(204).end();
}
