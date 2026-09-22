import assert from 'node:assert/strict';
import test from 'node:test';
import { AI_RATE_LIMIT, AI_RATE_WINDOW_MS, getAiRateLimitResult } from './aiRateLimit';

test('reports the first and tenth requests within the fixed window', () => {
    const start = new Date('2026-09-22T12:00:00.000Z');
    const first = getAiRateLimitResult(1, start, start, true);
    assert.equal(first.allowed, true);
    assert.equal(first.remaining, AI_RATE_LIMIT - 1);
    assert.equal(first.resetAt.getTime(), start.getTime() + AI_RATE_WINDOW_MS);

    const tenth = getAiRateLimitResult(10, start, new Date(start.getTime() + 1000), true);
    assert.equal(tenth.allowed, true);
    assert.equal(tenth.remaining, 0);
});

test('reports retry guidance for a rejected eleventh request', () => {
    const start = new Date('2026-09-22T12:00:00.000Z');
    const now = new Date(start.getTime() + 60_000);
    const rejected = getAiRateLimitResult(10, start, now, false);
    assert.equal(rejected.allowed, false);
    assert.equal(rejected.remaining, 0);
    assert.equal(rejected.retryAfterSeconds, 9 * 60);
});

test('never reports a retry interval below one second', () => {
    const start = new Date('2026-09-22T12:00:00.000Z');
    const rejected = getAiRateLimitResult(10, start, new Date(start.getTime() + AI_RATE_WINDOW_MS + 1), false);
    assert.equal(rejected.retryAfterSeconds, 1);
});
