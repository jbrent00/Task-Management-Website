import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getTaskAccess } from '../services/authorization';
import { recordActivity } from '../services/activity';

const personSelect = { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } as const;
const commentInclude = {
    author: { select: personSelect },
    deletedBy: { select: personSelect },
    mentions: { include: { user: { select: personSelect } }, orderBy: { start: 'asc' as const } },
} as const;

type MentionInput = { userId: string; start: number; end: number };
const personName = (person: { fname: string | null; lname: string | null; primaryEmail: string | null }) =>
    [person.fname, person.lname].filter(Boolean).join(' ') || person.primaryEmail || 'Member';

function serializeComment<T extends { deletedAt: Date | null; body: string; mentions: unknown[] }>(comment: T) {
    return comment.deletedAt ? { ...comment, body: null, mentions: [] } : comment;
}

async function validateCommentInput(projectId: number, body: unknown, mentions: unknown): Promise<{ body: string; mentions: MentionInput[] } | null> {
    if (typeof body !== 'string' || !body.trim() || body.length > 2000 || !Array.isArray(mentions)) return null;
    const parsed = mentions as MentionInput[];
    if (!parsed.every((mention) => mention && typeof mention.userId === 'string' && Number.isInteger(mention.start) && Number.isInteger(mention.end) && mention.start >= 0 && mention.end > mention.start && mention.end <= body.length)) return null;
    const sorted = [...parsed].sort((first, second) => first.start - second.start);
    if (sorted.some((mention, index) => index > 0 && mention.start < sorted[index - 1]!.end)) return null;
    const userIds = [...new Set(sorted.map((mention) => mention.userId))];
    const memberships = await prisma.projectMembership.findMany({
        where: { projectId, userId: { in: userIds } },
        include: { user: { select: personSelect } },
    });
    if (memberships.length !== userIds.length) return null;
    const people = new Map(memberships.map((membership) => [membership.userId, membership.user]));
    if (sorted.some((mention) => body.slice(mention.start, mention.end) !== `@${personName(people.get(mention.userId)!)}`)) return null;
    return { body, mentions: sorted };
}

export async function getTaskComments(req: Request, res: Response) {
    const { userId } = getAuth(req); const taskId = Number(req.params.taskId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getTaskAccess(taskId, userId);
    if (!access || !access.task.projectId) { res.status(404).json({ error: 'Project task not found' }); return; }
    const requestedLimit = Number(req.query.limit ?? 20); const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20;
    const cursor = req.query.cursor === undefined ? null : Number(req.query.cursor);
    if (cursor !== null && !Number.isInteger(cursor)) { res.status(400).json({ error: 'Invalid comment cursor' }); return; }
    const rows = await prisma.taskComment.findMany({
        where: { taskId, ...(cursor ? { id: { lt: cursor } } : {}) },
        include: commentInclude,
        orderBy: { id: 'desc' },
        take: limit + 1,
    });
    const hasMore = rows.length > limit; if (hasMore) rows.pop();
    const nextCursor = hasMore ? rows.at(-1)!.id : null;
    res.json({ items: rows.reverse().map(serializeComment), nextCursor });
}

export async function createTaskComment(req: Request, res: Response) {
    const { userId } = getAuth(req); const taskId = Number(req.params.taskId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getTaskAccess(taskId, userId);
    if (!access || !access.task.projectId || !access.task.project) { res.status(404).json({ error: 'Project task not found' }); return; }
    if (access.task.project.archivedAt) { res.status(403).json({ error: 'Archived projects are read-only' }); return; }
    const input = await validateCommentInput(access.task.projectId, req.body.body, req.body.mentions ?? []);
    if (!input) { res.status(400).json({ error: 'Comment or mentions are invalid' }); return; }
    const comment = await prisma.$transaction(async (tx) => {
        const created = await tx.taskComment.create({ data: {
            taskId, authorId: userId, body: input.body,
            mentions: { create: input.mentions.map((mention) => ({ userId: mention.userId, start: mention.start, end: mention.end })) },
        } });
        const mentionedIds = new Set(input.mentions.map((mention) => mention.userId));
        const recipientIds = new Set([...access.task.assignments.map((assignment) => assignment.userId), ...mentionedIds]); recipientIds.delete(userId);
        await Promise.all([...recipientIds].map((recipientId) => tx.notification.create({ data: {
            userId: recipientId, actorId: userId, projectId: access.task.projectId!, taskId,
            type: mentionedIds.has(recipientId) ? 'comment_mentioned' : 'task_commented',
            metadata: { projectTitle: access.task.project!.title, taskTitle: access.task.title, commentId: created.id },
        } })));
        await recordActivity(tx, { projectId: access.task.projectId!, taskId, actorId: userId, type: 'comment_created', metadata: { taskTitle: access.task.title, commentId: created.id } });
        return tx.taskComment.findUniqueOrThrow({ where: { id: created.id }, include: commentInclude });
    });
    res.status(201).json(serializeComment(comment));
}

export async function updateTaskComment(req: Request, res: Response) {
    const { userId } = getAuth(req); const commentId = Number(req.params.commentId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const existing = await prisma.taskComment.findUnique({ where: { id: commentId }, include: { mentions: true, task: { include: { project: true } } } });
    if (!existing?.task.projectId || !existing.task.project) { res.status(404).json({ error: 'Comment not found' }); return; }
    const access = await getTaskAccess(existing.taskId, userId);
    if (!access) { res.status(404).json({ error: 'Comment not found' }); return; }
    if (existing.authorId !== userId) { res.status(403).json({ error: 'Only the author can edit this comment' }); return; }
    if (existing.deletedAt) { res.status(409).json({ error: 'Deleted comments cannot be edited' }); return; }
    if (existing.task.project.archivedAt) { res.status(403).json({ error: 'Archived projects are read-only' }); return; }
    const input = await validateCommentInput(existing.task.projectId, req.body.body, req.body.mentions ?? []);
    if (!input) { res.status(400).json({ error: 'Comment or mentions are invalid' }); return; }
    const previousMentionIds = new Set(existing.mentions.map((mention) => mention.userId));
    const nextMentionIds = new Set(input.mentions.map((mention) => mention.userId));
    const newlyMentioned = [...nextMentionIds].filter((id) => !previousMentionIds.has(id) && id !== userId);
    const comment = await prisma.$transaction(async (tx) => {
        await tx.commentMention.deleteMany({ where: { commentId } });
        const updated = await tx.taskComment.update({ where: { id: commentId }, data: {
            body: input.body, editedAt: new Date(), mentions: { create: input.mentions.map((mention) => ({ userId: mention.userId, start: mention.start, end: mention.end })) },
        } });
        await Promise.all(newlyMentioned.map((recipientId) => tx.notification.create({ data: {
            userId: recipientId, actorId: userId, projectId: existing.task.projectId!, taskId: existing.taskId, type: 'comment_mentioned',
            metadata: { projectTitle: existing.task.project!.title, taskTitle: existing.task.title, commentId },
        } })));
        await recordActivity(tx, { projectId: existing.task.projectId!, taskId: existing.taskId, actorId: userId, type: 'comment_edited', metadata: { taskTitle: existing.task.title, commentId } });
        return tx.taskComment.findUniqueOrThrow({ where: { id: updated.id }, include: commentInclude });
    });
    res.json(serializeComment(comment));
}

export async function deleteTaskComment(req: Request, res: Response) {
    const { userId } = getAuth(req); const commentId = Number(req.params.commentId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const existing = await prisma.taskComment.findUnique({ where: { id: commentId }, include: { task: { include: { project: true } } } });
    if (!existing?.task.projectId || !existing.task.project) { res.status(404).json({ error: 'Comment not found' }); return; }
    const access = await getTaskAccess(existing.taskId, userId);
    if (!access) { res.status(404).json({ error: 'Comment not found' }); return; }
    if (existing.task.project.archivedAt) { res.status(403).json({ error: 'Archived projects are read-only' }); return; }
    if (existing.authorId !== userId && access.role !== 'owner') { res.status(403).json({ error: 'Only the author or project owner can delete this comment' }); return; }
    if (existing.deletedAt) { res.status(204).end(); return; }
    await prisma.$transaction(async (tx) => {
        await tx.commentMention.deleteMany({ where: { commentId } });
        await tx.taskComment.update({ where: { id: commentId }, data: { deletedAt: new Date(), deletedById: userId } });
        await recordActivity(tx, { projectId: existing.task.projectId!, taskId: existing.taskId, actorId: userId, type: 'comment_deleted', metadata: { taskTitle: existing.task.title, commentId } });
    });
    res.status(204).end();
}
