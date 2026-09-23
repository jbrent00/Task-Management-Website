import assert from 'node:assert/strict';
import test from 'node:test';
import { canBeAssigned, canChangeAssignment, canCreateProjectTask, canEditProjectTask, canManageProject, canWriteProject, invitationIsActionable } from './projectPolicy';

test('enforces the fixed project role matrix and archive lock', () => {
    assert.equal(canManageProject('owner', null), true);
    assert.equal(canManageProject('editor', null), false);
    assert.equal(canWriteProject('editor', null), true);
    assert.equal(canWriteProject('viewer', null), false);
    assert.equal(canWriteProject('owner', new Date()), false);
});

test('only owners and editors can be task assignees', () => {
    assert.equal(canBeAssigned('owner'), true);
    assert.equal(canBeAssigned('editor'), true);
    assert.equal(canBeAssigned('viewer'), false);
});

test('applies each configurable editor task policy without limiting owners', () => {
    const open = { archivedAt: null, editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanJoinTasks: true, editorsCanLeaveTasks: true };
    const restricted = { ...open, editorsCanCreateTasks: false, editorsCanAssignOthers: false, editorsCanEditAllTasks: false, editorsCanJoinTasks: false, editorsCanLeaveTasks: false };
    const ownerTask = { createdById: 'owner', assigneeId: null };
    const editorTask = { createdById: 'editor', assigneeId: null };
    const assignedTask = { createdById: 'owner', assigneeId: 'editor' };

    assert.equal(canCreateProjectTask('editor', open), true);
    assert.equal(canCreateProjectTask('editor', restricted), false);
    assert.equal(canCreateProjectTask('owner', restricted), true);
    assert.equal(canEditProjectTask('editor', open, ownerTask, 'editor'), true);
    assert.equal(canEditProjectTask('editor', restricted, ownerTask, 'editor'), false);
    assert.equal(canEditProjectTask('editor', restricted, editorTask, 'editor'), true);
    assert.equal(canEditProjectTask('editor', restricted, assignedTask, 'editor'), true);
    assert.equal(canChangeAssignment('editor', open, 'editor', null, 'member'), true);
    assert.equal(canChangeAssignment('editor', { ...open, editorsCanAssignOthers: false }, 'editor', null, 'member'), false);
    assert.equal(canChangeAssignment('editor', { ...open, editorsCanAssignOthers: false }, 'editor', null, 'editor'), true);
    assert.equal(canChangeAssignment('editor', { ...open, editorsCanAssignOthers: false, editorsCanJoinTasks: false }, 'editor', null, 'editor'), false);
    assert.equal(canChangeAssignment('editor', { ...open, editorsCanAssignOthers: false, editorsCanLeaveTasks: false }, 'editor', 'editor', null), false);
    assert.equal(canChangeAssignment('editor', { ...open, editorsCanAssignOthers: false }, 'editor', 'editor', null), true);
    assert.equal(canChangeAssignment('editor', restricted, 'editor', null, 'editor'), false);
    assert.equal(canChangeAssignment('owner', restricted, 'owner', null, 'member'), true);
});

test('archive and viewer rules override collaboration settings', () => {
    const archived = { archivedAt: new Date(), editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanJoinTasks: true, editorsCanLeaveTasks: true };
    const task = { createdById: 'viewer', assigneeId: null };
    assert.equal(canCreateProjectTask('editor', archived), false);
    assert.equal(canEditProjectTask('owner', archived, task, 'owner'), false);
    assert.equal(canEditProjectTask('viewer', { ...archived, archivedAt: null }, task, 'viewer'), false);
    assert.equal(canChangeAssignment('viewer', { ...archived, archivedAt: null }, 'viewer', null, 'viewer'), false);
});

test('accepts only pending, unexpired invitations for a verified matching email', () => {
    const emails = new Set(['member@example.com']);
    const now = new Date('2026-09-22T12:00:00Z');
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'member@example.com' }, emails, now), true);
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: now, normalizedEmail: 'member@example.com' }, emails, now), false);
    assert.equal(invitationIsActionable({ status: 'revoked', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'member@example.com' }, emails, now), false);
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'other@example.com' }, emails, now), false);
});
