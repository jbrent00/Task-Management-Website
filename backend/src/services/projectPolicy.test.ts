import assert from 'node:assert/strict';
import test from 'node:test';
import { canBeAssigned, canManageProject, canWriteProject, invitationIsActionable } from './projectPolicy';

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

test('accepts only pending, unexpired invitations for a verified matching email', () => {
    const emails = new Set(['member@example.com']);
    const now = new Date('2026-09-22T12:00:00Z');
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'member@example.com' }, emails, now), true);
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: now, normalizedEmail: 'member@example.com' }, emails, now), false);
    assert.equal(invitationIsActionable({ status: 'revoked', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'member@example.com' }, emails, now), false);
    assert.equal(invitationIsActionable({ status: 'pending', expiresAt: new Date('2026-09-23T12:00:00Z'), normalizedEmail: 'other@example.com' }, emails, now), false);
});
