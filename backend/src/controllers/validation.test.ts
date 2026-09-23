import assert from 'node:assert/strict';
import test from 'node:test';
import {
    cleanOptionalText,
    cleanRequiredText,
    isNonNegativeInteger,
    isTaskAssignmentInput,
    isTaskPriority,
    isTaskStatus,
    ownedTaskWhere,
    isChecklistItemsInput,
    isChecklistOrderInput,
    parseOptionalDate,
} from './validation';

test('validates task text fields and limits', () => {
    assert.equal(cleanRequiredText('  Ship it  ', 100), 'Ship it');
    assert.equal(cleanRequiredText('   ', 100), null);
    assert.equal(cleanRequiredText('x'.repeat(101), 100), null);
    assert.equal(cleanOptionalText('', 500), null);
    assert.equal(cleanOptionalText('x'.repeat(501), 500), undefined);
});

test('rejects invalid checklist order arrays', () => {
    assert.equal(isChecklistOrderInput([3, 1, 2]), true);
    assert.equal(isChecklistOrderInput([1, 1]), false);
    assert.equal(isChecklistOrderInput([1, '2']), false);
});

test('validates checklist item text and size limits', () => {
    assert.equal(isChecklistItemsInput([{ text: ' First step ' }]), true);
    assert.equal(isChecklistItemsInput([{ text: ' ' }]), false);
    assert.equal(isChecklistItemsInput([{ text: 'x'.repeat(201) }]), false);
    assert.equal(isChecklistItemsInput(Array.from({ length: 101 }, () => ({ text: 'Step' }))), false);
});

test('accepts only supported task enums and ordering values', () => {
    assert.equal(isTaskPriority('high'), true);
    assert.equal(isTaskPriority('urgent'), false);
    assert.equal(isTaskStatus('in_progress'), true);
    assert.equal(isTaskStatus('blocked'), false);
    assert.equal(isNonNegativeInteger(0), true);
    assert.equal(isNonNegativeInteger(-1), false);
    assert.equal(isNonNegativeInteger(1.5), false);
});

test('parses valid optional dates and rejects malformed dates', () => {
    assert.equal(parseOptionalDate(null), null);
    assert.equal(parseOptionalDate(''), null);
    assert.equal(parseOptionalDate('not-a-date'), undefined);
    assert.equal(parseOptionalDate(123), undefined);
    assert.equal(parseOptionalDate('2026-09-20T17:30:00.000Z')?.toISOString(), '2026-09-20T17:30:00.000Z');
});

test('validates assignment IDs and rejects duplicates', () => {
    assert.equal(isTaskAssignmentInput(null, []), true);
    assert.equal(isTaskAssignmentInput(2, [1, 3]), true);
    assert.equal(isTaskAssignmentInput('2', [1]), false);
    assert.equal(isTaskAssignmentInput(2, [1, 1]), false);
    assert.equal(isTaskAssignmentInput(2, ['1']), false);
});

test('ownership predicates always include both task and user IDs', () => {
    assert.deepEqual(ownedTaskWhere(42, 'user_owner'), { id: 42, createdById: 'user_owner', projectId: null });
});
