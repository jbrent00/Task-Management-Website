import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { cleanRequiredText, isTagColor, normalize, tagColors } from './validation';

function currentUserId(req: Request, res: Response) {
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return null; }
    return userId;
}

function tagInput(body: Record<string, unknown>) {
    const name = cleanRequiredText(body.name, 24);
    return name && isTagColor(body.color) ? { name, color: body.color } : null;
}

export async function getTags(req: Request, res: Response) {
    const userId = currentUserId(req, res);
    if (!userId) return;
    try { res.json(await prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } })); }
    catch (error) { console.error('Error fetching tags:', error); res.status(500).json({ error: 'Failed to fetch tags' }); }
}

export async function createTag(req: Request, res: Response) {
    const userId = currentUserId(req, res);
    if (!userId) return;
    const input = tagInput(req.body);
    if (!input) { res.status(400).json({ error: `Tag name is required (up to 24 characters) and color must be one of: ${tagColors.join(', ')}` }); return; }
    try { res.status(201).json(await prisma.tag.create({ data: { ...input, normalizedName: normalize(input.name), userId } })); }
    catch (error: unknown) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') { res.status(409).json({ error: 'You already have a tag with that name' }); return; }
        console.error('Error creating tag:', error); res.status(500).json({ error: 'Failed to create tag' });
    }
}

export async function updateTag(req: Request, res: Response) {
    const userId = currentUserId(req, res); const id = Number(req.params.id);
    if (!userId) return;
    const input = tagInput(req.body);
    if (!Number.isInteger(id) || !input) { res.status(400).json({ error: 'Invalid tag details' }); return; }
    try {
        const result = await prisma.tag.updateMany({ where: { id, userId }, data: { ...input, normalizedName: normalize(input.name) } });
        if (!result.count) { res.status(404).json({ error: 'Tag not found' }); return; }
        res.json(await prisma.tag.findUniqueOrThrow({ where: { id } }));
    } catch (error: unknown) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') { res.status(409).json({ error: 'You already have a tag with that name' }); return; }
        console.error('Error updating tag:', error); res.status(500).json({ error: 'Failed to update tag' });
    }
}

export async function deleteTag(req: Request, res: Response) {
    const userId = currentUserId(req, res); const id = Number(req.params.id);
    if (!userId) return;
    if (!Number.isInteger(id)) { res.status(400).json({ error: 'Invalid tag ID' }); return; }
    try {
        const result = await prisma.tag.deleteMany({ where: { id, userId } });
        if (!result.count) { res.status(404).json({ error: 'Tag not found' }); return; }
        res.status(204).send();
    } catch (error) { console.error('Error deleting tag:', error); res.status(500).json({ error: 'Failed to delete tag' }); }
}
