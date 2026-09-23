import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../services/prisma';
import { getProjectAccess } from '../services/authorization';
import { cleanOptionalText, cleanRequiredText } from './validation';
import { canCreateProjectTask } from '../services/projectPolicy';

const personSelect = { id: true, fname: true, lname: true, primaryEmail: true, imageUrl: true } as const;

export async function getProjects(req: Request, res: Response) {
    const { userId } = getAuth(req); if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    try {
        const memberships = await prisma.projectMembership.findMany({
            where: { userId },
            include: { project: { include: {
                tasks: { select: { status: true, updatedAt: true, dueDate: true, assigneeId: true } },
                memberships: { include: { user: { select: personSelect } }, orderBy: { joinedAt: 'asc' } },
            } } },
            orderBy: { project: { title: 'asc' } },
        });
        const now = new Date();
        res.json(memberships.map(({ role, project }) => ({
            id: project.id, title: project.title, description: project.description, createdAt: project.createdAt, updatedAt: project.updatedAt,
            archivedAt: project.archivedAt, role, memberCount: project.memberships.length,
            members: project.memberships.map((item) => ({ ...item.user, role: item.role, userId: item.userId })),
            taskCount: project.tasks.length, completedTaskCount: project.tasks.filter((task) => task.status === 'completed').length,
            overdueTaskCount: project.tasks.filter((task) => task.status !== 'completed' && task.dueDate && task.dueDate < now).length,
            unassignedTaskCount: project.tasks.filter((task) => task.status !== 'completed' && !task.assigneeId).length,
            lastActivityAt: new Date(Math.max(project.updatedAt.getTime(), ...project.tasks.map((task) => task.updatedAt.getTime()), ...project.memberships.map((item) => item.joinedAt.getTime()))),
            capabilities: { canEdit: role === 'owner', canManageMembers: role === 'owner', canCreateTasks: canCreateProjectTask(role, project) },
        })));
    } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to fetch projects' }); }
}

export async function getProject(req: Request, res: Response) {
    const { userId } = getAuth(req); const id = Number(req.params.id);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(id, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    const project = await prisma.project.findUnique({ where: { id }, include: {
        memberships: { include: { user: { select: personSelect } }, orderBy: { joinedAt: 'asc' } },
        tags: { orderBy: { name: 'asc' } },
        ...(access.role === 'owner' ? { invitations: { where: { status: 'pending', expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' as const } } } : {}),
    } });
    res.json({ ...project, role: access.role, capabilities: {
        canEditProject: access.role === 'owner' && !project?.archivedAt,
        canManageMembers: access.role === 'owner' && !project?.archivedAt,
        canEditTasks: access.role !== 'viewer' && !project?.archivedAt,
        canCreateTasks: project ? canCreateProjectTask(access.role, project) : false,
        canRestore: access.role === 'owner' && Boolean(project?.archivedAt),
        canDelete: access.role === 'owner',
    } });
}

export async function createProject(req: Request, res: Response) {
    const { userId } = getAuth(req); if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const title = cleanRequiredText(req.body.title, 100); const description = cleanOptionalText(req.body.description, 500);
    if (!title || description === undefined) { res.status(400).json({ error: 'Project title is required and description must be at most 500 characters' }); return; }
    try {
        const project = await prisma.project.create({ data: { title, description, memberships: { create: { userId, role: 'owner' } } }, include: { memberships: { include: { user: { select: personSelect } } } } });
        res.status(201).json({ ...project, role: 'owner', memberCount: 1, taskCount: 0, completedTaskCount: 0, overdueTaskCount: 0, unassignedTaskCount: 0, lastActivityAt: project.createdAt, members: project.memberships.map((item) => ({ ...item.user, role: item.role, userId: item.userId })), capabilities: { canEdit: true, canManageMembers: true, canCreateTasks: true } });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create project' }); }
}

export async function updateProject(req: Request, res: Response) {
    const { userId } = getAuth(req); const id = Number(req.params.id);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(id, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can edit project settings' }); return; }
    if (access.project.archivedAt) { res.status(403).json({ error: 'Restore the project before editing it' }); return; }
    const title = cleanRequiredText(req.body.title, 100); const description = cleanOptionalText(req.body.description, 500);
    if (!title || description === undefined) { res.status(400).json({ error: 'Invalid project details' }); return; }
    const policyKeys = ['editorsCanCreateTasks', 'editorsCanAssignOthers', 'editorsCanEditAllTasks', 'editorsCanJoinTasks', 'editorsCanLeaveTasks'] as const;
    if (policyKeys.some((key) => key in req.body && typeof req.body[key] !== 'boolean')) { res.status(400).json({ error: 'Invalid collaboration settings' }); return; }
    const policies = Object.fromEntries(policyKeys.filter((key) => key in req.body).map((key) => [key, req.body[key]]));
    res.json(await prisma.project.update({ where: { id }, data: { title, description, ...policies } }));
}

async function setArchived(req: Request, res: Response, archived: boolean) {
    const { userId } = getAuth(req); const id = Number(req.params.id);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(id, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can change archive state' }); return; }
    res.json(await prisma.project.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } }));
}
export const archiveProject = (req: Request, res: Response) => setArchived(req, res, true);
export const restoreProject = (req: Request, res: Response) => setArchived(req, res, false);

export async function deleteProject(req: Request, res: Response) {
    const { userId } = getAuth(req); const id = Number(req.params.id);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const access = await getProjectAccess(id, userId); if (!access) { res.status(404).json({ error: 'Project not found' }); return; }
    if (access.role !== 'owner') { res.status(403).json({ error: 'Only the owner can delete the project' }); return; }
    if (req.body.confirmTitle !== access.project.title) { res.status(400).json({ error: 'Enter the exact project title to confirm deletion' }); return; }
    await prisma.project.delete({ where: { id } }); res.status(204).end();
}
