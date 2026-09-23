import type { ProjectRole } from '../../generated/prisma/client';

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const canWriteProject = (role: ProjectRole, archivedAt: Date | null) => archivedAt === null && (role === 'owner' || role === 'editor');
export const canManageProject = (role: ProjectRole, archivedAt: Date | null) => archivedAt === null && role === 'owner';
export const canBeAssigned = (role: ProjectRole) => role === 'owner' || role === 'editor';
export const invitationIsActionable = (invitation: { status: string; expiresAt: Date; normalizedEmail: string }, verifiedEmails: Set<string>, now = new Date()) => invitation.status === 'pending' && invitation.expiresAt > now && verifiedEmails.has(invitation.normalizedEmail);
