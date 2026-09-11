import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { cleanOptionalText, cleanRequiredText, normalize } from './validation';

function currentUserId(req: Request, res: Response) {
    const { userId } = getAuth(req);
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return null;
    }
    return userId;
}

export async function getProjects(req: Request, res: Response) {
    const userId = currentUserId(req, res);
    if (!userId) return;
    try {
        res.json(await prisma.project.findMany({
            where: { userId }, orderBy: { title: 'asc' }, select: { id: true, title: true, description: true, createdAt: true },
        }));
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
}

export async function createProject(req: Request, res: Response) {
    const userId = currentUserId(req, res);
    if (!userId) return;
    const title = cleanRequiredText(req.body.title, 100);
    const description = cleanOptionalText(req.body.description, 500);
    if (!title || description === undefined) {
        res.status(400).json({ error: 'Project title is required (up to 100 characters) and description must be at most 500 characters' });
        return;
    }
    try {
        const project = await prisma.project.create({ data: { userId, title, normalizedTitle: normalize(title), description } });
        res.status(201).json(project);
    } catch (error: unknown) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
            res.status(409).json({ error: 'You already have a project with that name' });
            return;
        }
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
}

export async function updateProject(req: Request, res: Response) {
    const userId = currentUserId(req, res);
    const id = Number(req.params.id);
    if (!userId) return;
    const title = cleanRequiredText(req.body.title, 100);
    const description = cleanOptionalText(req.body.description, 500);
    if (!Number.isInteger(id) || !title || description === undefined) {
        res.status(400).json({ error: 'Invalid project details' });
        return;
    }
    try {
        const result = await prisma.project.updateMany({ where: { id, userId }, data: { title, normalizedTitle: normalize(title), description } });
        if (!result.count) { res.status(404).json({ error: 'Project not found' }); return; }
        res.json(await prisma.project.findUniqueOrThrow({ where: { id } }));
    } catch (error: unknown) {
        if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') { res.status(409).json({ error: 'You already have a project with that name' }); return; }
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
}

export async function deleteProject(req: Request, res: Response) {
    const userId = currentUserId(req, res);
    const id = Number(req.params.id);
    if (!userId) return;
    if (!Number.isInteger(id)) { res.status(400).json({ error: 'Invalid project ID' }); return; }
    try {
        const result = await prisma.project.deleteMany({ where: { id, userId } });
        if (!result.count) { res.status(404).json({ error: 'Project not found' }); return; }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
}
