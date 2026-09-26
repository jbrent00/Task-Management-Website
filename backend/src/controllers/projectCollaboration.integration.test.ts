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
import createPersonalTask from './createTask';
import { archiveProject, getProjects, updateProject } from './projects';
import updateTask from './updateTask';
import { joinTask, leaveTask } from './taskParticipation';
import { getNotifications, markNotificationsRead } from './notifications';
import deleteTask from './deleteTask';
import bulkUpdateTasks from './bulkUpdateTasks';
import { createTaskComment, deleteTaskComment, getTaskComments, updateTaskComment } from './taskComments';
import { getProjectActivity } from './projectActivity';

type Controller = (req: Request, res: Response) => void | Promise<void>;
type Invocation = { userId: string; params?: Record<string, string>; body?: Record<string, unknown>; query?: Record<string, string> };

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

async function invoke(controller: Controller, { userId, params = {}, body = {}, query = {} }: Invocation) {
    let statusCode = 200;
    let responseBody: unknown;
    const req = { params, body, query, auth: () => ({ userId, tokenType: 'session_token' }) } as unknown as Request;
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
        projectId, createdById: users.owner, ...(assigneeId ? { assignments: { create: { userId: assigneeId } } } : {}),
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

test('creation accepts supported statuses and defaults omitted status to To do', async () => {
    const project = await createProject('creation statuses', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' }, { userId: users.viewer, role: 'viewer' },
    ]);
    const base = { title: `${runId} status task`, description: null, priority: 'low', dueDate: null, orderIndex: 0, tagIds: [], checklistItems: [], assigneeIds: [] };
    const params = { projectId: String(project.id) };
    const inProgress = await invoke(createProjectTask, { userId: users.owner, params, body: { ...base, status: 'in_progress' } });
    assert.equal(inProgress.status, 201);
    assert.equal((inProgress.body as { status: string }).status, 'in_progress');
    const completed = await invoke(createProjectTask, { userId: users.editor, params, body: { ...base, status: 'completed' } });
    assert.equal(completed.status, 201);
    assert.equal((completed.body as { status: string }).status, 'completed');
    const fallback = await invoke(createProjectTask, { userId: users.owner, params, body: base });
    assert.equal((fallback.body as { status: string }).status, 'todo');
    assert.equal((await invoke(createProjectTask, { userId: users.owner, params, body: { ...base, status: 'blocked' } })).status, 400);
    assert.equal((await invoke(createProjectTask, { userId: users.viewer, params, body: { ...base, status: 'completed' } })).status, 403);

    const personal = await invoke(createPersonalTask, { userId: users.owner, body: { ...base, status: 'completed' } });
    assert.equal(personal.status, 201);
    assert.equal((personal.body as { status: string }).status, 'completed');
    const personalId = (personal.body as { id: number }).id;
    const personalFallback = await invoke(createPersonalTask, { userId: users.owner, body: base });
    assert.equal((personalFallback.body as { status: string }).status, 'todo');
    assert.equal((await invoke(createPersonalTask, { userId: users.owner, body: { ...base, status: 'blocked' } })).status, 400);
    await prisma.task.deleteMany({ where: { id: { in: [personalId, (personalFallback.body as { id: number }).id] } } });
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
    const taskBody = { title: 'Updated task', description: null, priority: 'low', status: 'todo', dueDate: null, tagIds: [], assigneeIds: [users.editor] };
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
    assert.equal(await prisma.taskAssignment.count({ where: { taskId: task.id } }), 0);
});

test('project policy defaults preserve the existing open editor workflow', async () => {
    const project = await createProject('policy defaults', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
    ]);
    const stored = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
    assert.equal(stored.editorsCanCreateTasks, true);
    assert.equal(stored.editorsCanAssignOthers, true);
    assert.equal(stored.editorsCanEditAllTasks, true);
    assert.equal(stored.editorsCanJoinTasks, true);
    assert.equal(stored.editorsCanLeaveTasks, true);
});

test('restricted editor policies are enforced for creation, editing, and assignment', async () => {
    const project = await prisma.project.create({ data: {
        title: `${runId} restricted policies`, editorsCanCreateTasks: false, editorsCanAssignOthers: false, editorsCanEditAllTasks: false, editorsCanJoinTasks: true, editorsCanLeaveTasks: true,
        memberships: { create: [{ userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' }, { userId: users.member, role: 'editor' }] },
    } });
    projectIds.push(project.id);
    const ownerTask = await createTask(project.id);
    const body = { title: 'Blocked edit', description: null, priority: 'low', status: 'todo', dueDate: null, tagIds: [], assigneeIds: [] };
    assert.equal((await invoke(updateTask, { userId: users.editor, params: { id: String(ownerTask.id) }, body })).status, 403);
    assert.equal((await invoke(createProjectTask, { userId: users.editor, params: { projectId: String(project.id) }, body: { title: 'No', description: null, priority: 'low', dueDate: null, orderIndex: 0, assigneeIds: [], tagIds: [], checklistItems: [] } })).status, 403);

    const editorTask = await prisma.task.create({ data: { title: 'Editor task', status: 'todo', priority: 'low', orderIndex: 0, projectId: project.id, createdById: users.editor } });
    assert.equal((await invoke(updateTask, { userId: users.editor, params: { id: String(editorTask.id) }, body: { ...body, title: 'Allowed edit' } })).status, 200);
    const assignOther = await invoke(updateTask, { userId: users.editor, params: { id: String(editorTask.id) }, body: { ...body, title: 'Assign other', assigneeIds: [users.member] } });
    assert.equal(assignOther.status, 403);
});

test('project settings endpoint persists every collaboration policy and remains owner-only', async () => {
    const project = await createProject('settings persistence', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
    ]);
    const policies = {
        editorsCanCreateTasks: false,
        editorsCanAssignOthers: false,
        editorsCanEditAllTasks: false,
        editorsCanJoinTasks: false,
        editorsCanLeaveTasks: false,
    };
    const ownerResponse = await invoke(updateProject, {
        userId: users.owner,
        params: { id: String(project.id) },
        body: { title: project.title, description: null, ...policies },
    });
    assert.equal(ownerResponse.status, 200);
    assert.deepEqual(
        Object.fromEntries(Object.keys(policies).map((key) => [key, (ownerResponse.body as Record<string, unknown>)[key]])),
        policies,
    );
    const stored = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
    for (const [key, value] of Object.entries(policies)) assert.equal(stored[key as keyof typeof policies], value);

    assert.equal((await invoke(updateProject, {
        userId: users.editor,
        params: { id: String(project.id) },
        body: { title: project.title, description: null, editorsCanCreateTasks: true },
    })).status, 403);
    assert.equal((await invoke(updateProject, {
        userId: users.owner,
        params: { id: String(project.id) },
        body: { title: project.title, description: null, editorsCanCreateTasks: 'yes' },
    })).status, 400);
});

test('edit-all and participation policies govern edit, delete, reorder, join, and leave', async () => {
    const project = await prisma.project.create({ data: {
        title: `${runId} operation policies`, editorsCanCreateTasks: true, editorsCanAssignOthers: false,
        editorsCanEditAllTasks: false, editorsCanJoinTasks: false, editorsCanLeaveTasks: false,
        memberships: { create: [{ userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' }] },
    } });
    projectIds.push(project.id);
    const ownerTask = await createTask(project.id);
    const editorTask = await prisma.task.create({ data: {
        title: `${runId} editor task`, status: 'todo', priority: 'low', orderIndex: 1,
        projectId: project.id, createdById: users.editor,
    } });
    const assignedTask = await createTask(project.id, users.editor);
    const taskBody = { description: null, priority: 'low', status: 'todo', dueDate: null, tagIds: [] };

    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(ownerTask.id) }, body: { ...taskBody, title: 'Blocked', assigneeIds: [] },
    })).status, 403);
    assert.equal((await invoke(deleteTask, { userId: users.editor, params: { id: String(ownerTask.id) } })).status, 403);
    assert.equal((await invoke(bulkUpdateTasks, {
        userId: users.editor, body: { tasks: [{ id: ownerTask.id, orderIndex: 2, status: 'todo' }] },
    })).status, 403);
    assert.equal((await invoke(joinTask, { userId: users.editor, params: { id: String(ownerTask.id) } })).status, 403);
    assert.equal((await invoke(leaveTask, { userId: users.editor, params: { id: String(assignedTask.id) } })).status, 403);

    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(editorTask.id) }, body: { ...taskBody, title: 'Editor-owned edit', assigneeIds: [] },
    })).status, 200);
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(assignedTask.id) }, body: { ...taskBody, title: 'Assigned edit', assigneeIds: [users.editor] },
    })).status, 200);
    assert.equal((await invoke(bulkUpdateTasks, {
        userId: users.editor, body: { tasks: [{ id: editorTask.id, orderIndex: 3, status: 'in_progress' }] },
    })).status, 200);

    assert.equal((await invoke(createProjectTask, {
        userId: users.owner, params: { projectId: String(project.id) }, body: {
            title: 'Owner override', description: null, priority: 'low', dueDate: null,
            orderIndex: 4, assigneeIds: [users.editor], tagIds: [], checklistItems: [],
        },
    })).status, 201);
});

test('join and leave policies are enforced independently', async () => {
    const project = await prisma.project.create({ data: {
        title: `${runId} split participation`, editorsCanJoinTasks: false, editorsCanLeaveTasks: true,
        memberships: { create: [{ userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' }] },
    } });
    projectIds.push(project.id);
    const unassigned = await createTask(project.id);
    const assigned = await createTask(project.id, users.editor);
    const editor = { userId: users.editor };

    assert.equal((await invoke(joinTask, { ...editor, params: { id: String(unassigned.id) } })).status, 403);
    assert.equal((await invoke(leaveTask, { ...editor, params: { id: String(assigned.id) } })).status, 200);

    await prisma.project.update({ where: { id: project.id }, data: { editorsCanJoinTasks: true, editorsCanLeaveTasks: false } });
    assert.equal((await invoke(joinTask, { ...editor, params: { id: String(unassigned.id) } })).status, 200);
    assert.equal((await invoke(leaveTask, { ...editor, params: { id: String(unassigned.id) } })).status, 403);
});

test('assign-others cannot bypass join or leave policies', async () => {
    const project = await prisma.project.create({ data: {
        title: `${runId} assignment policy composition`, editorsCanAssignOthers: true,
        editorsCanJoinTasks: false, editorsCanLeaveTasks: false,
        memberships: { create: [
            { userId: users.owner, role: 'owner' },
            { userId: users.editor, role: 'editor' },
            { userId: users.member, role: 'editor' },
        ] },
    } });
    projectIds.push(project.id);
    const unassigned = await createTask(project.id);
    const assignedToEditor = await createTask(project.id, users.editor);
    const assignedToMember = await createTask(project.id, users.member);
    const taskBody = { title: 'Policy transition', description: null, priority: 'low', status: 'todo', dueDate: null, tagIds: [] };

    assert.equal((await invoke(createProjectTask, {
        userId: users.editor, params: { projectId: String(project.id) }, body: {
            ...taskBody, orderIndex: 3, assigneeIds: [users.editor], checklistItems: [],
        },
    })).status, 403);
    assert.equal((await invoke(createProjectTask, {
        userId: users.editor, params: { projectId: String(project.id) }, body: {
            ...taskBody, orderIndex: 3, assigneeIds: [users.member], checklistItems: [],
        },
    })).status, 201);
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(unassigned.id) }, body: { ...taskBody, assigneeIds: [users.editor] },
    })).status, 403);
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(assignedToMember.id) }, body: { ...taskBody, assigneeIds: [users.editor] },
    })).status, 403);
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(assignedToEditor.id) }, body: { ...taskBody, assigneeIds: [] },
    })).status, 403);
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(assignedToEditor.id) }, body: { ...taskBody, assigneeIds: [users.member] },
    })).status, 403);

    await prisma.project.update({ where: { id: project.id }, data: {
        editorsCanAssignOthers: false, editorsCanJoinTasks: true, editorsCanLeaveTasks: true,
    } });
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(unassigned.id) }, body: { ...taskBody, assigneeIds: [users.editor] },
    })).status, 200);
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(assignedToMember.id) }, body: { ...taskBody, assigneeIds: [users.editor] },
    })).status, 403);
    assert.equal((await invoke(updateTask, {
        userId: users.editor, params: { id: String(assignedToEditor.id) }, body: { ...taskBody, assigneeIds: [] },
    })).status, 200);

    const ownerOverride = await createTask(project.id, users.editor);
    assert.equal((await invoke(updateTask, {
        userId: users.owner, params: { id: String(ownerOverride.id) }, body: { ...taskBody, assigneeIds: [users.member] },
    })).status, 200);
});

test('concurrent joins allow exactly one claim and leave releases the task', async () => {
    const project = await createProject('task participation', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
    ]);
    const task = await createTask(project.id);
    const request = { userId: users.editor, params: { id: String(task.id) } };
    const joins = await Promise.all([invoke(joinTask, request), invoke(joinTask, request)]);
    assert.deepEqual(joins.map((response) => response.status).sort(), [200, 409]);
    assert.equal(await prisma.taskAssignment.count({ where: { taskId: task.id, userId: users.editor } }), 1);
    assert.equal((await invoke(leaveTask, request)).status, 200);
    assert.equal(await prisma.taskAssignment.count({ where: { taskId: task.id } }), 0);
});

test('assignment and membership changes create private, readable notifications', async () => {
    const project = await createProject('notifications', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' }, { userId: users.member, role: 'viewer' },
    ]);
    const task = await createTask(project.id);
    const taskBody = { title: task.title, description: null, priority: 'low', status: 'todo', dueDate: null, tagIds: [], assigneeIds: [users.editor] };
    assert.equal((await invoke(updateTask, { userId: users.owner, params: { id: String(task.id) }, body: taskBody })).status, 200);
    assert.equal((await invoke(updateMember, { userId: users.owner, params: { projectId: String(project.id), userId: users.member }, body: { role: 'editor' } })).status, 200);

    const editorInbox = await invoke(getNotifications, { userId: users.editor, query: { limit: '20' } });
    assert.equal(editorInbox.status, 200);
    const editorBody = editorInbox.body as { unreadCount: number; items: Array<{ kind: string; notification?: { id: number; type: string } }> };
    const assignment = editorBody.items.find((item) => item.notification?.type === 'task_assigned')?.notification;
    assert.ok(assignment);
    assert.ok(editorBody.unreadCount >= 1);
    assert.equal((await invoke(markNotificationsRead, { userId: users.member, body: { ids: [assignment.id] } })).status, 200);
    assert.equal((await prisma.notification.findUniqueOrThrow({ where: { id: assignment.id } })).readAt, null);
    assert.equal((await invoke(markNotificationsRead, { userId: users.editor, body: { ids: [assignment.id] } })).status, 200);
    assert.ok((await prisma.notification.findUniqueOrThrow({ where: { id: assignment.id } })).readAt);
});

test('comments validate mentions, notify assignees, soft-delete, and record activity', async () => {
    const project = await createProject('comments and activity', [
        { userId: users.owner, role: 'owner' }, { userId: users.editor, role: 'editor' },
        { userId: users.viewer, role: 'viewer' }, { userId: users.member, role: 'viewer' },
    ]);
    const task = await createTask(project.id, users.editor);
    const ownerMention = `@${emails.owner}`;
    const body = `Hello ${ownerMention}`;
    const created = await invoke(createTaskComment, {
        userId: users.viewer, params: { taskId: String(task.id) },
        body: { body, mentions: [{ userId: users.owner, start: body.indexOf(ownerMention), end: body.length }] },
    });
    assert.equal(created.status, 201);
    const commentId = (created.body as { id: number }).id;
    const tasksAfterComment = await invoke(getProjectTasks, { userId: users.owner, params: { projectId: String(project.id) } });
    assert.equal((tasksAfterComment.body as Array<{ id: number; commentCount: number }>).find((item) => item.id === task.id)?.commentCount, 1);
    assert.equal(await prisma.notification.count({ where: { taskId: task.id, userId: { in: [users.owner, users.editor] }, type: { in: ['comment_mentioned', 'task_commented'] } } }), 2);

    const invalid = await invoke(createTaskComment, {
        userId: users.viewer, params: { taskId: String(task.id) }, body: { body, mentions: [{ userId: users.owner, start: 0, end: body.length }] },
    });
    assert.equal(invalid.status, 400);

    const memberMention = `@${emails.member}`; const editedBody = `${body} ${memberMention}`;
    assert.equal((await invoke(updateTaskComment, {
        userId: users.viewer, params: { taskId: String(task.id), commentId: String(commentId) },
        body: { body: editedBody, mentions: [
            { userId: users.owner, start: body.indexOf(ownerMention), end: body.length },
            { userId: users.member, start: editedBody.indexOf(memberMention), end: editedBody.length },
        ] },
    })).status, 200);
    assert.equal(await prisma.notification.count({ where: { taskId: task.id, userId: users.member, type: 'comment_mentioned' } }), 1);

    assert.equal((await invoke(deleteTaskComment, { userId: users.owner, params: { taskId: String(task.id), commentId: String(commentId) } })).status, 204);
    const tasksAfterDeletion = await invoke(getProjectTasks, { userId: users.owner, params: { projectId: String(project.id) } });
    assert.equal((tasksAfterDeletion.body as Array<{ id: number; commentCount: number }>).find((item) => item.id === task.id)?.commentCount, 0);
    const comments = await invoke(getTaskComments, { userId: users.editor, params: { taskId: String(task.id) } });
    const returned = (comments.body as { items: Array<{ body: string | null; mentions: unknown[]; deletedAt: string | Date | null }> }).items[0]!;
    assert.equal(returned.body, null); assert.deepEqual(returned.mentions, []); assert.ok(returned.deletedAt);

    const activity = await invoke(getProjectActivity, { userId: users.owner, params: { projectId: String(project.id) }, query: { category: 'comments' } });
    assert.equal(activity.status, 200);
    assert.deepEqual((activity.body as { items: Array<{ type: string }> }).items.map((item) => item.type), ['comment_deleted', 'comment_edited', 'comment_created']);
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

        const collaborationFoundation = await readFile(new URL('../../prisma/migrations/20260923120000_add_collaboration_foundation/migration.sql', import.meta.url), 'utf8');
        await client.query(collaborationFoundation);
        const splitPolicies = await readFile(new URL('../../prisma/migrations/20260923180000_split_join_leave_policies/migration.sql', import.meta.url), 'utf8');
        await client.query(splitPolicies);
        const multiAssigneeMigration = await readFile(new URL('../../prisma/migrations/20260924120000_add_multi_assignee_comments_activity/migration.sql', import.meta.url), 'utf8');
        await client.query(multiAssigneeMigration);
        const migratedAssignment = await client.query(`SELECT "userId" FROM "TaskAssignment" WHERE "taskId" = $1`, [taskResult.rows[0]!.id]);
        assert.equal(migratedAssignment.rows[0]?.userId, owner);
        const legacyColumn = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'Task' AND column_name = 'assigneeId'`, [schema]);
        assert.equal(legacyColumn.rowCount, 0);
    } finally {
        await client.query('SET search_path TO public');
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        await client.end();
    }
});
