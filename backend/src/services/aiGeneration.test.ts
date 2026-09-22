import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyAiGenerationError, normalizeAiGenerationResult, parseAiGenerationInput } from './aiGeneration';

test('parses supported generation requests and normalizes text', () => {
    assert.deepEqual(parseAiGenerationInput({ kind: 'description', title: '  Plan launch  ' }), { kind: 'description', title: 'Plan launch' });
    assert.deepEqual(parseAiGenerationInput({ kind: 'checklist', title: 'Ship release', description: '  Production deploy  ' }), { kind: 'checklist', title: 'Ship release', description: 'Production deploy' });
    assert.deepEqual(parseAiGenerationInput({ kind: 'checklist', title: 'Ship release', description: '' }), { kind: 'checklist', title: 'Ship release' });
});

test('rejects invalid, excessive, or unexpected generation input', () => {
    assert.equal(parseAiGenerationInput({ kind: 'description', title: '' }), null);
    assert.equal(parseAiGenerationInput({ kind: 'description', title: 'x'.repeat(101) }), null);
    assert.equal(parseAiGenerationInput({ kind: 'checklist', title: 'Task', description: 'x'.repeat(501) }), null);
    assert.equal(parseAiGenerationInput({ kind: 'description', title: 'Task', description: 'not accepted here' }), null);
    assert.equal(parseAiGenerationInput({ kind: 'description', title: 'Task', extra: true }), null);
    assert.equal(parseAiGenerationInput({ kind: 'unknown', title: 'Task' }), null);
});

test('normalizes valid description and checklist output', () => {
    assert.deepEqual(normalizeAiGenerationResult('description', { description: '  Define the launch goals.  ' }), { kind: 'description', description: 'Define the launch goals.' });
    assert.deepEqual(normalizeAiGenerationResult('checklist', { items: [' One ', 'Two', 'Three', 'Four', 'Five'] }), { kind: 'checklist', items: ['One', 'Two', 'Three', 'Four', 'Five'] });
});

test('rejects malformed, duplicate, and over-limit AI output', () => {
    assert.equal(normalizeAiGenerationResult('description', { description: 'x'.repeat(501) }), null);
    assert.equal(normalizeAiGenerationResult('description', { description: 'Good', extra: true }), null);
    assert.equal(normalizeAiGenerationResult('checklist', { items: ['One', 'Two', 'Three', 'Four'] }), null);
    assert.equal(normalizeAiGenerationResult('checklist', { items: ['One', 'one', 'Three', 'Four', 'Five'] }), null);
    assert.equal(normalizeAiGenerationResult('checklist', { items: ['One', 'Two', 'Three', 'Four', 'x'.repeat(201)] }), null);
});

test('classifies aborts as timeouts and other failures as provider errors', () => {
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    assert.equal(classifyAiGenerationError(abort), 'timeout');
    assert.equal(classifyAiGenerationError(new Error('provider unavailable')), 'provider');
});
