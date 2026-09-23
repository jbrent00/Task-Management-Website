import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess, isProjectWriter } from '../services/authorization';
import { cleanRequiredText, isTagColor, normalize } from './validation';

async function writableProject(req: Request, res: Response) {
    const { userId } = getAuth(req); const projectId = Number(req.params.projectId);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return null; }
    const access = await getProjectAccess(projectId, userId);
    if (!access) { res.status(404).json({ error: 'Project not found' }); return null; }
    if (!isProjectWriter(access.role) || access.project.archivedAt) { res.status(403).json({ error: 'You cannot manage project tags' }); return null; }
    return { projectId };
}

export async function createProjectTag(req: Request, res: Response) {
    const access = await writableProject(req, res); if (!access) return;
    const name = cleanRequiredText(req.body.name, 24); if (!name || !isTagColor(req.body.color)) { res.status(400).json({ error: 'Invalid tag' }); return; }
    try { res.status(201).json(await prisma.projectTag.create({ data: { projectId: access.projectId, name, normalizedName: normalize(name), color: req.body.color } })); }
    catch { res.status(409).json({ error: 'That project tag already exists' }); }
}

export async function updateProjectTag(req: Request, res: Response) {
    const access = await writableProject(req, res); if (!access) return; const id = Number(req.params.tagId);
    const name = cleanRequiredText(req.body.name, 24); if (!name || !isTagColor(req.body.color)) { res.status(400).json({ error: 'Invalid tag' }); return; }
    const result = await prisma.projectTag.updateMany({ where: { id, projectId: access.projectId }, data: { name, normalizedName: normalize(name), color: req.body.color } });
    if (!result.count) { res.status(404).json({ error: 'Tag not found' }); return; }
    res.json(await prisma.projectTag.findUnique({ where: { id } }));
}

export async function deleteProjectTag(req: Request, res: Response) {
    const access = await writableProject(req, res); if (!access) return; const id = Number(req.params.tagId);
    const result = await prisma.projectTag.deleteMany({ where: { id, projectId: access.projectId } });
    if (!result.count) { res.status(404).json({ error: 'Tag not found' }); return; }
    res.status(204).end();
}
