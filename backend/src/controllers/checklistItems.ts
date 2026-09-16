import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { Prisma } from '../../generated/prisma/client';
import { cleanRequiredText, isChecklistOrderInput } from './validation';

const getIds = (req: Request) => ({ taskId: Number(req.params.taskId), itemId: Number(req.params.itemId) });

async function ownedTaskId(req: Request, res: Response) {
    const { userId } = getAuth(req);
    const taskId = Number(req.params.taskId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return null; }
    if (!Number.isInteger(taskId) || !await prisma.task.findFirst({ where: { id: taskId, userId }, select: { id: true } })) {
        res.status(404).json({ error: 'Task not found' }); return null;
    }
    return taskId;
}

async function create(req: Request, res: Response) {
    try {
        const taskId = await ownedTaskId(req, res); if (taskId === null) return;
        const text = cleanRequiredText(req.body.text, 200);
        if (!text) { res.status(400).json({ error: 'Checklist item text is required and must be 200 characters or fewer.' }); return; }
        const item = await prisma.$transaction(async (tx) => {
            // PostgreSQL transaction lock serializes concurrent additions to one task.
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(${taskId})`;
            const items = await tx.checklistItem.findMany({ where: { taskId }, select: { orderIndex: true } });
            if (items.length >= 100) return null;
            const orderIndex = items.length ? Math.max(...items.map((item) => item.orderIndex)) + 1 : 0;
            return tx.checklistItem.create({ data: { taskId, text, orderIndex } });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        if (!item) { res.status(400).json({ error: 'A task can contain at most 100 checklist items.' }); return; }
        res.status(201).json(item);
    } catch { res.status(500).json({ error: 'Failed to create checklist item' }); }
}

async function update(req: Request, res: Response) {
    try {
        const taskId = await ownedTaskId(req, res); if (taskId === null) return;
        const { itemId } = getIds(req); const data: { text?: string; completed?: boolean } = {};
        if (!Number.isInteger(itemId)) { res.status(404).json({ error: 'Checklist item not found' }); return; }
        if ('text' in req.body) { const text = cleanRequiredText(req.body.text, 200); if (!text) { res.status(400).json({ error: 'Invalid checklist item text' }); return; } data.text = text; }
        if ('completed' in req.body) { if (typeof req.body.completed !== 'boolean') { res.status(400).json({ error: 'Invalid completed state' }); return; } data.completed = req.body.completed; }
        if (!Object.keys(data).length) { res.status(400).json({ error: 'No checklist item changes supplied' }); return; }
        const item = await prisma.checklistItem.updateMany({ where: { id: itemId, taskId }, data });
        if (!item.count) { res.status(404).json({ error: 'Checklist item not found' }); return; }
        res.status(200).json(await prisma.checklistItem.findUnique({ where: { id: itemId } }));
    } catch { res.status(500).json({ error: 'Failed to update checklist item' }); }
}

async function remove(req: Request, res: Response) {
    try {
        const taskId = await ownedTaskId(req, res); if (taskId === null) return;
        const { itemId } = getIds(req); if (!Number.isInteger(itemId)) { res.status(404).json({ error: 'Checklist item not found' }); return; }
        const deleted = await prisma.$transaction(async (tx) => {
            const result = await tx.checklistItem.deleteMany({ where: { id: itemId, taskId } });
            if (!result.count) return false;
            const remaining = await tx.checklistItem.findMany({ where: { taskId }, orderBy: { orderIndex: 'asc' }, select: { id: true } });
            await Promise.all(remaining.map((item, orderIndex) => tx.checklistItem.update({ where: { id: item.id }, data: { orderIndex } })));
            return true;
        });
        if (!deleted) { res.status(404).json({ error: 'Checklist item not found' }); return; }
        res.status(204).end();
    } catch { res.status(500).json({ error: 'Failed to delete checklist item' }); }
}

async function reorder(req: Request, res: Response) {
    try {
        const taskId = await ownedTaskId(req, res); if (taskId === null) return;
        const ids = req.body.itemIds;
        if (!isChecklistOrderInput(ids)) { res.status(400).json({ error: 'Invalid checklist order' }); return; }
        const items = await prisma.checklistItem.findMany({ where: { taskId }, select: { id: true } });
        if (items.length !== ids.length || !items.every((item) => ids.includes(item.id))) { res.status(400).json({ error: 'Checklist order must contain every item exactly once' }); return; }
        await prisma.$transaction(ids.map((id: number, orderIndex: number) => prisma.checklistItem.update({ where: { id }, data: { orderIndex } })));
        res.status(200).json(await prisma.checklistItem.findMany({ where: { taskId }, orderBy: { orderIndex: 'asc' } }));
    } catch { res.status(500).json({ error: 'Failed to reorder checklist items' }); }
}

export default { create, update, remove, reorder };
