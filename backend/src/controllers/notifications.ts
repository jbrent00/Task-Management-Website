import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getVerifiedEmails } from '../services/userProfile';

const personSelect = { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } as const;

export async function getNotifications(req: Request, res: Response) {
    const { userId } = getAuth(req); if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const requestedLimit = Number(req.query.limit ?? 20);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;
    const emails = (await getVerifiedEmails(userId)).map((item) => item.normalizedEmail);
    const now = new Date();
    await prisma.projectInvitation.updateMany({ where: { normalizedEmail: { in: emails }, status: 'pending', expiresAt: { lte: now } }, data: { status: 'expired' } });
    const invitationWhere = { normalizedEmail: { in: emails }, status: 'pending' as const, expiresAt: { gt: now } };
    const [invitations, notifications, unreadCount, pendingActionCount] = await Promise.all([
        prisma.projectInvitation.findMany({
            where: invitationWhere,
            include: { project: { select: { id: true, title: true, description: true } }, inviter: { select: personSelect } },
            orderBy: { createdAt: 'desc' }, take: limit,
        }),
        prisma.notification.findMany({
            where: { userId }, include: { actor: { select: personSelect } }, orderBy: { createdAt: 'desc' }, take: limit,
        }),
        prisma.notification.count({ where: { userId, readAt: null } }),
        prisma.projectInvitation.count({ where: invitationWhere }),
    ]);
    const items = [
        ...invitations.map((invitation) => ({ kind: 'invitation' as const, id: invitation.id, createdAt: invitation.createdAt, invitation })),
        ...notifications.map((notification) => ({ kind: 'notification' as const, id: notification.id, createdAt: notification.createdAt, notification })),
    ].sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime()).slice(0, limit);
    res.json({ pendingActionCount, unreadCount, totalBadgeCount: pendingActionCount + unreadCount, items });
}

export async function markNotificationsRead(req: Request, res: Response) {
    const { userId } = getAuth(req); if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const all = req.body.all === true;
    const ids = req.body.ids;
    if (!all && (!Array.isArray(ids) || !ids.every(Number.isInteger))) { res.status(400).json({ error: 'Provide notification ids or all: true' }); return; }
    const result = await prisma.notification.updateMany({ where: { userId, readAt: null, ...(all ? {} : { id: { in: [...new Set(ids as number[])] } }) }, data: { readAt: new Date() } });
    res.json({ updatedCount: result.count });
}
