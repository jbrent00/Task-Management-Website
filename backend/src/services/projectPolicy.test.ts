import assert from 'node:assert/strict';
import test from 'node:test';
import { canBeAssigned, canChangeAssignments, canCreateProjectTask, canEditProjectTask, canManageProject, canWriteProject, invitationIsActionable } from './projectPolicy';

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
    const ownerTask = { createdById: 'owner', assignments: [] };
    const editorTask = { createdById: 'editor', assignments: [] };
    const assignedTask = { createdById: 'owner', assignments: [{ userId: 'editor' }, { userId: 'member' }] };

    assert.equal(canCreateProjectTask('editor', open), true);
    assert.equal(canCreateProjectTask('editor', restricted), false);
    assert.equal(canCreateProjectTask('owner', restricted), true);
    assert.equal(canEditProjectTask('editor', open, ownerTask, 'editor'), true);
    assert.equal(canEditProjectTask('editor', restricted, ownerTask, 'editor'), false);
    assert.equal(canEditProjectTask('editor', restricted, editorTask, 'editor'), true);
    assert.equal(canEditProjectTask('editor', restricted, assignedTask, 'editor'), true);
    assert.equal(canChangeAssignments('editor', open, 'editor', [], ['member']), true);
    assert.equal(canChangeAssignments('editor', { ...open, editorsCanAssignOthers: false }, 'editor', [], ['member']), false);
    assert.equal(canChangeAssignments('editor', { ...open, editorsCanAssignOthers: false }, 'editor', [], ['editor']), true);
    assert.equal(canChangeAssignments('editor', { ...open, editorsCanAssignOthers: false, editorsCanJoinTasks: false }, 'editor', [], ['editor']), false);
    assert.equal(canChangeAssignments('editor', { ...open, editorsCanAssignOthers: false, editorsCanLeaveTasks: false }, 'editor', ['editor'], []), false);
    assert.equal(canChangeAssignments('editor', { ...open, editorsCanAssignOthers: false }, 'editor', ['editor'], []), true);
    assert.equal(canChangeAssignments('editor', restricted, 'editor', [], ['editor']), false);
    assert.equal(canChangeAssignments('owner', restricted, 'owner', [], ['member']), true);
});

test('requires every policy implicated by an assignment transition', () => {
    const base = { archivedAt: null, editorsCanCreateTasks: true, editorsCanEditAllTasks: true };
    const policy = (assignOthers: boolean, join: boolean, leave: boolean) => ({
        ...base,
        editorsCanAssignOthers: assignOthers,
        editorsCanJoinTasks: join,
        editorsCanLeaveTasks: leave,
    });
    const cases = [
        { name: 'unassigned to self', current: null, next: 'editor', required: [false, true, false] },
        { name: 'other to self', current: 'member', next: 'editor', required: [true, true, false] },
        { name: 'self to unassigned', current: 'editor', next: null, required: [false, false, true] },
        { name: 'self to other', current: 'editor', next: 'member', required: [true, false, true] },
        { name: 'unassigned to other', current: null, next: 'member', required: [true, false, false] },
        { name: 'other to unassigned', current: 'member', next: null, required: [true, false, false] },
        { name: 'other to different other', current: 'member', next: 'teammate', required: [true, false, false] },
    ] as const;

    for (const assignmentCase of cases) {
        for (const assignOthers of [false, true]) {
            for (const join of [false, true]) {
                for (const leave of [false, true]) {
                    const enabled = [assignOthers, join, leave];
                    const expected = assignmentCase.required.every((required, index) => !required || enabled[index]);
                    assert.equal(
                        canChangeAssignments('editor', policy(assignOthers, join, leave), 'editor', assignmentCase.current ? [assignmentCase.current] : [], assignmentCase.next ? [assignmentCase.next] : []),
                        expected,
                        `${assignmentCase.name}: assignOthers=${assignOthers}, join=${join}, leave=${leave}`,
                    );
                }
            }
        }
    }

    assert.equal(canChangeAssignments('editor', policy(false, false, false), 'editor', ['editor'], ['editor']), true);
    assert.equal(canChangeAssignments('editor', policy(false, false, false), 'editor', ['member'], ['member']), true);
});

test('archive and viewer rules override collaboration settings', () => {
    const archived = { archivedAt: new Date(), editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanJoinTasks: true, editorsCanLeaveTasks: true };
    const task = { createdById: 'viewer', assignments: [] };
    assert.equal(canCreateProjectTask('editor', archived), false);
    assert.equal(canEditProjectTask('owner', archived, task, 'owner'), false);
    assert.equal(canEditProjectTask('viewer', { ...archived, archivedAt: null }, task, 'viewer'), false);
    assert.equal(canChangeAssignments('viewer', { ...archived, archivedAt: null }, 'viewer', [], ['viewer']), false);
});

test('accepts only pending, unexpired invitations for a verified matching email', () => {
    const emails = new Set(['member@example.com']);
    const now = new Date('2026-09-22T12:00:00Z');
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'member@example.com' }, emails, now), true);
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: now, normalizedEmail: 'member@example.com' }, emails, now), false);
    assert.equal(invitationIsActionable({ status: 'revoked', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'member@example.com' }, emails, now), false);
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'other@example.com' }, emails, now), false);
});
