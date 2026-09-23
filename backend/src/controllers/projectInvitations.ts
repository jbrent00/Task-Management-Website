import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../services/prisma';
import { getProjectAccess } from '../services/authorization';
import { getVerifiedEmails } from '../services/userProfile';
import { isEmail, isProjectRole, normalize } from './validation';
import { INVITATION_TTL_MS, invitationIsActionable } from '../services/projectPolicy';

const expiresAt = () => new Date(Date.now() + INVITATION_TTL_MS);

export async function createInvitation(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId);
    if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can invite members' }); return; }
    if (access.project.archivedAt) { res.status(403).json({ error: 'Archived projects are read-only' }); return; }
    if (!isEmail(req.body.email) || !isProjectRole(req.body.role) || req.body.role === 'owner') { res.status(400).json({ error: 'A valid email and editor or viewer role are required' }); return; }
    const email = req.body.email.trim(); const normalizedEmail = normalize(email);
    await prisma.projectInvitation.updateMany({ where: { projectId, normalizedEmail, status: 'pending', expiresAt: { lte: new Date() } }, data: { status: 'expired' } });
    const existingUser = await prisma.userEmail.findFirst({ where: { normalizedEmail }, select: { userId: true } });
    if (existingUser && await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId, userId: existingUser.userId } } })) {
        res.status(409).json({ error: 'That user is already a project member' }); return;
    }
    if (await prisma.projectInvitation.findFirst({ where: { projectId, normalizedEmail, status: 'pending', expiresAt: { gt: new Date() } } })) {
        res.status(409).json({ error: 'An active invitation already exists for that email' }); return;
    }
    try {
        const invitation = await prisma.projectInvitation.create({ data: { projectId, inviterId: userId, email, normalizedEmail, role: req.body.role, expiresAt: expiresAt() } });
        res.status(201).json(invitation);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ error: 'An active invitation already exists for that email' }); return;
        }
        throw error;
    }
}

export async function revokeInvitation(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId); const invitationId = Number(req.params.invitationId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(projectId, userId);
    if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can revoke invitations' }); return; }
    if (access.project.archivedAt) { res.status(403).json({ error: 'Archived projects are read-only' }); return; }
    const result = await prisma.projectInvitation.updateMany({ where: { id: invitationId, projectId, status: 'pending' }, data: { status: 'revoked' } });
    if (!result.count) { res.status(404).json({ error: 'Invitation not found' }); return; }
    res.status(204).end();
}

export async function getMyInvitations(req: Request, res: Response) {
    const { userId } = getAuth(req); if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const emails = (await getVerifiedEmails(userId)).map((item) => item.normalizedEmail);
    await prisma.projectInvitation.updateMany({ where: { normalizedEmail: { in: emails }, status: 'pending', expiresAt: { lte: new Date() } }, data: { status: 'expired' } });
    const invitations = await prisma.projectInvitation.findMany({
        where: { normalizedEmail: { in: emails }, status: 'pending', expiresAt: { gt: new Date() } },
        include: { project: { select: { id: true, title: true, description: true } }, inviter: { select: { fname: true, lname: true, primaryEmail: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(invitations);
}

async function respond(req: Request, res: Response, status: 'accepted' | 'declined') {
    const { userId } = getAuth(req); const id = Number(req.params.invitationId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!Number.isInteger(id)) { res.status(404).json({ error: 'Invitation not found' }); return; }
    const emails = new Set((await getVerifiedEmails(userId)).map((item) => item.normalizedEmail));
    try {
        const result = await prisma.$transaction(async (tx) => {
            const now = new Date();
            const invitation = await tx.projectInvitation.findUnique({ where: { id } });
            if (!invitation || !invitationIsActionable(invitation, emails, now)) return null;
            const project = await tx.project.findUnique({ where: { id: invitation.projectId }, select: { archivedAt: true } });
            if (!project || project.archivedAt) return null;
            const claimed = await tx.projectInvitation.updateMany({
                where: { id, status: 'pending', expiresAt: { gt: now }, normalizedEmail: { in: [...emails] } },
                data: { status },
            });
            if (!claimed.count) return null;
            if (status === 'accepted') {
                await tx.projectMembership.upsert({ where: { projectId_userId: { projectId: invitation.projectId, userId } }, update: {}, create: { projectId: invitation.projectId, userId, role: invitation.role } });
            }
            return invitation;
        });
        if (!result) { res.status(404).json({ error: 'Invitation not found or no longer valid' }); return; }
        if (status === 'accepted') res.status(200).json({ projectId: result.projectId });
        else res.status(204).end();
    } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to respond to invitation' }); }
}

export const acceptInvitation = (req: Request, res: Response) => respond(req, res, 'accepted');
export const declineInvitation = (req: Request, res: Response) => respond(req, res, 'declined');
