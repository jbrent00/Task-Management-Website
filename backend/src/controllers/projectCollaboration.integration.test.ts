import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after, before } from 'node:test';
import type { Request, Response } from 'express';
import pg from 'pg';
import { prisma } from '../services/prisma';
import getAllTasks from './getAllTasks';
import { createInvitation, acceptInvitation } from './projectInvitations';
import { removeMember, transferOwnership, updateMember } from './projectMembers';
import { createProjectTask, getProjectTasks } from './projectTasks';
import { archiveProject, getProjects, updateProject } from './projects';
import updateTask from './updateTask';

type Controller = (req: Request, res: Response) => void | Promise<void>;
type Invocation = { userId: string; params?: Record<string, string>; body?: Record<string, unknown> };

const runId = `collab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const users = {
    owner: `${runId}_owner`,
    editor: `${runId}_editor`,
    viewer: `${runId}_viewer`,
    invitee: `${runId}_invitee`,
    member: `${runId}_member`,
};
const emails = Object.fromEntries(Object.entries(users).map(([key, id]) => [key, `${id}@example.test`])) as Record<keyof typeof users, string>;
const projectIds: number[] = [];

async function invoke(controller: Controller, { userId, params = {}, body = {} }: Invocation) {
    let statusCode = 200;
    let responseBody: unknown;
    const req = { params, body, auth: () => ({ userId, tokenType: 'session_token' }) } as unknown as Request;
    const res = {
        status(code: number) { statusCode = code; return this; },
        json(value: unknown) { responseBody = value; return this; },
        send(value: unknown) { responseBody = value; return this; },
        end() { return this; },
    } as unknown as Response;
    await controller(req, res);
    return { status: statusCode, body: responseBody };
}

async function createProject(title: string, memberships: Array<{ userId: string; role: 'owner' | 'editor' | 'viewer' }> = [{ userId: users.owner, role: 'owner' }]) {
    const project = await prisma.project.create({ data: { title: `${runId} ${title}`, memberships: { create: memberships } } });
    projectIds.push(project.id);
    return project;
}

async function createTask(projectId: number, assigneeId: string | null = null) {
    return prisma.task.create({ data: {
        title: `${runId} task`, description: null, status: 'todo', priority: 'low', orderIndex: 0,
        projectId, createdById: users.owner, assigneeId,
    } });
}

before(async () => {
    await prisma.user.createMany({ data: Object.entries(users).map(([key, id]) => ({ id, primaryEmail: emails[key as keyof typeof users] })) });
    await prisma.userEmail.createMany({ data: Object.entries(users).map(([key, id]) => ({
        userId: id, email: emails[key as keyof typeof users], normalizedEmail: emails[key as keyof typeof users], primary: true,
    })) });
});

after(async () => {
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });
    await prisma.$disconnect();
});

test('concurrent duplicate invitation creation stores one pending invitation', async () => {
    const project = await createProject('duplicate invitation');
    const request = { userId: users.owner, params: { projectId: String(project.id) }, body: { email: emails.invitee.toUpperCase(), role: 'editor' } };
    const responses = await Promise.all([invoke(createInvitation, request), invoke(createInvitation, request)]);

    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    assert.equal(await prisma.projectInvitation.count({ where: { projectId: project.id, normalizedEmail: emails.invitee, status: 'pending' } }), 1);
});

test('concurrent acceptance creates one membership and only one request succeeds', async () => {
    const project = await createProject('concurrent acceptance');
    const invitation = await prisma.projectInvitation.create({ data: {
        projectId: project.id, inviterId: users.owner, email: emails.invitee, normalizedEmail: emails.invitee,
        role: 'editor', expiresAt: new Date(Date.now() + 60_000),
    } });
    const request = { userId: users.invitee, params: { invitationId: String(invitation.id) } };
    const responses = await Promise.all([invoke(acceptInvitation, request), invoke(acceptInvitation, request)]);

    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 404]);
    assert.equal(await prisma.projectMembership.count({ where: { projectId: project.id, userId: users.invitee } }), 1);
    assert.equal((await prisma.projectInvitation.findUniqueOrThrow({ where: { id: invitation.id } })).status, 'accepted');
});

test('owner, editor, and viewer permissions match representative operations', async () => {
    const project = await createProject('authorization matrix', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
        { userId: users.viewer, role: 'viewer' }, { userId: users.member, role: 'viewer' },
    ]);
    const task = await createTask(project.id, users.editor);

    for (const userId of [users.owner, users.editor, users.viewer]) {
        assert.equal((await invoke(getProjectTasks, { userId, params: { projectId: String(project.id) } })).status, 200);
    }
    const taskBody = { title: 'Updated task', description: null, priority: 'low', status: 'todo', dueDate: null, tagIds: [], assigneeId: users.editor };
    assert.equal((await invoke(updateTask, { userId: users.owner, params: { id: String(task.id) }, body: taskBody })).status, 200);
    assert.equal((await invoke(updateTask, { userId: users.editor, params: { id: String(task.id) }, body: taskBody })).status, 200);
    assert.equal((await invoke(updateTask, { userId: users.viewer, params: { id: String(task.id) }, body: taskBody })).status, 403);

    const memberParams = { projectId: String(project.id), userId: users.member };
    assert.equal((await invoke(updateMember, { userId: users.owner, params: memberParams, body: { role: 'editor' } })).status, 200);
    assert.equal((await invoke(updateMember, { userId: users.editor, params: memberParams, body: { role: 'viewer' } })).status, 403);
    assert.equal((await invoke(updateMember, { userId: users.viewer, params: memberParams, body: { role: 'viewer' } })).status, 403);
});

test('ownership transfer preserves exactly one owner', async () => {
    const project = await createProject('ownership transfer', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
    ]);
    const response = await invoke(transferOwnership, {
        userId: users.owner, params: { projectId: String(project.id) }, body: { userId: users.editor },
    });

    assert.equal(response.status, 204);
    const memberships = await prisma.projectMembership.findMany({ where: { projectId: project.id }, orderBy: { userId: 'asc' } });
    assert.equal(memberships.filter((membership) => membership.role === 'owner').length, 1);
    assert.equal(memberships.find((membership) => membership.userId === users.editor)?.role, 'owner');
    assert.equal(memberships.find((membership) => membership.userId === users.owner)?.role, 'editor');
});

test('demotion is blocked while a member has assigned tasks', async () => {
    const project = await createProject('blocked demotion', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
    ]);
    await createTask(project.id, users.editor);
    const response = await invoke(updateMember, {
        userId: users.owner, params: { projectId: String(project.id), userId: users.editor }, body: { role: 'viewer' },
    });

    assert.equal(response.status, 409);
    assert.equal((await prisma.projectMembership.findUniqueOrThrow({ where: { projectId_userId: { projectId: project.id, userId: users.editor } } })).role, 'editor');
});

test('member removal clears project task assignments', async () => {
    const project = await createProject('member removal', [
        { userId: users.owner, role: 'owner' }, { userId: users.member, role: 'editor' },
    ]);
    const task = await createTask(project.id, users.member);
    const response = await invoke(removeMember, {
        userId: users.owner, params: { projectId: String(project.id), userId: users.member },
    });

    assert.equal(response.status, 204);
    assert.equal(await prisma.projectMembership.findUnique({ where: { projectId_userId: { projectId: project.id, userId: users.member } } }), null);
    assert.equal((await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).assigneeId, null);
});

test('archived projects reject mutations and stay out of active project and task results', async () => {
    const project = await createProject('archived project', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
    ]);
    const task = await createTask(project.id, users.editor);
    assert.equal((await invoke(archiveProject, { userId: users.owner, params: { id: String(project.id) } })).status, 200);
    assert.equal((await invoke(updateProject, { userId: users.owner, params: { id: String(project.id) }, body: { title: 'Blocked', description: null } })).status, 403);
    assert.equal((await invoke(createProjectTask, { userId: users.editor, params: { projectId: String(project.id) }, body: {} })).status, 403);

    const projectsResponse = await invoke(getProjects, { userId: users.editor });
    assert.equal(projectsResponse.status, 200);
    const activeProjects = (projectsResponse.body as Array<{ id: number; archivedAt: string | Date | null }>).filter((item) => !item.archivedAt);
    assert.equal(activeProjects.some((item) => item.id === project.id), false);
    const tasksResponse = await invoke(getAllTasks, { userId: users.editor });
    assert.equal(tasksResponse.status, 200);
    assert.equal((tasksResponse.body as Array<{ id: number }>).some((item) => item.id === task.id), false);
});

test('collaborative-projects migration preserves legacy owners, tasks, and tags', async () => {
    const connectionString = process.env.DATABASE_URL;
    assert.ok(connectionString, 'DATABASE_URL is required for migration smoke testing');
    const schema = `migration_smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
        await client.query(`CREATE SCHEMA "${schema}"`);
        await client.query(`SET search_path TO "${schema}"`);
        await client.query(`
            CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');
            CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'completed');
            CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "fname" TEXT, "lname" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE "Project" ("id" SERIAL PRIMARY KEY, "title" TEXT NOT NULL, "normalizedTitle" TEXT NOT NULL, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "userId" TEXT NOT NULL);
            ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_normalizedTitle_key" UNIQUE ("userId", "normalizedTitle");
            ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            CREATE TABLE "Tag" ("id" SERIAL PRIMARY KEY, "name" TEXT NOT NULL, "normalizedName" TEXT NOT NULL, "color" TEXT NOT NULL, "userId" TEXT NOT NULL);
            CREATE TABLE "Task" ("id" SERIAL PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT, "status" "TaskStatus" NOT NULL, "priority" "TaskPriority" NOT NULL, "dueDate" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "orderIndex" INTEGER NOT NULL DEFAULT 0, "projectId" INTEGER, "userId" TEXT NOT NULL);
            ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            CREATE TABLE "TaskTag" ("taskId" INTEGER NOT NULL, "tagId" INTEGER NOT NULL, PRIMARY KEY ("taskId", "tagId"));
            ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        const owner = `${runId}_legacy_owner`;
        await client.query(`INSERT INTO "User" ("id") VALUES ($1)`, [owner]);
        const projectResult = await client.query<{ id: number }>(`INSERT INTO "Project" ("title", "normalizedTitle", "userId") VALUES ('Legacy', 'legacy', $1) RETURNING "id"`, [owner]);
        const projectId = projectResult.rows[0]!.id;
        const taskResult = await client.query<{ id: number }>(`INSERT INTO "Task" ("title", "status", "priority", "createdAt", "projectId", "userId") VALUES ('Legacy task', 'todo', 'low', '2026-01-01T00:00:00Z', $1, $2) RETURNING "id"`, [projectId, owner]);
        const tagResult = await client.query<{ id: number }>(`INSERT INTO "Tag" ("name", "normalizedName", "color", "userId") VALUES ('Legacy tag', 'legacy tag', 'blue', $1) RETURNING "id"`, [owner]);
        await client.query(`INSERT INTO "TaskTag" ("taskId", "tagId") VALUES ($1, $2)`, [taskResult.rows[0]!.id, tagResult.rows[0]!.id]);

        const migration = await readFile(new URL('../../prisma/migrations/20260922190000_add_collaborative_projects/migration.sql', import.meta.url), 'utf8');
        await client.query(migration);
        await client.query(`
            CREATE TABLE "_prisma_migrations" (
                migration_name TEXT NOT NULL,
                finished_at TIMESTAMPTZ,
                rolled_back_at TIMESTAMPTZ
            );
            INSERT INTO "_prisma_migrations" (migration_name, finished_at)
            VALUES ('20260922190000_add_collaborative_projects', '2026-09-22T20:48:30Z');
        `);
        const assigneeBackfill = await readFile(new URL('../../prisma/migrations/20260922220000_backfill_legacy_project_task_assignees/migration.sql', import.meta.url), 'utf8');
        await client.query(assigneeBackfill);

        const membership = await client.query(`SELECT "role" FROM "ProjectMembership" WHERE "projectId" = $1 AND "userId" = $2`, [projectId, owner]);
        assert.equal(membership.rows[0]?.role, 'owner');
        const migratedTask = await client.query(`SELECT "createdById", "assigneeId", "projectId" FROM "Task" WHERE "id" = $1`, [taskResult.rows[0]!.id]);
        assert.equal(migratedTask.rows[0]?.createdById, owner);
        assert.equal(migratedTask.rows[0]?.assigneeId, owner);
        assert.equal(migratedTask.rows[0]?.projectId, projectId);
        const migratedTag = await client.query(`SELECT project_tag."name" FROM "ProjectTaskTag" task_tag JOIN "ProjectTag" project_tag ON project_tag."id" = task_tag."tagId" WHERE task_tag."taskId" = $1`, [taskResult.rows[0]!.id]);
        assert.equal(migratedTag.rows[0]?.name, 'Legacy tag');
    } finally {
        await client.query('SET search_path TO public');
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        await client.end();
    }
});
