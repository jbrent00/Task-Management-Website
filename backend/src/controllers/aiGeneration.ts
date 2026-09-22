import type { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { classifyAiGenerationError, generateTaskDraft, isAiGenerationConfigured, parseAiGenerationInput } from '../services/aiGeneration';
import { reserveAiGeneration, type AiRateLimitResult } from '../services/aiRateLimit';

function setRateLimitHeaders(res: Response, result: AiRateLimitResult) {
    res.setHeader('RateLimit-Limit', result.limit.toString());
    res.setHeader('RateLimit-Remaining', result.remaining.toString());
    res.setHeader('RateLimit-Reset', Math.ceil(result.resetAt.getTime() / 1000).toString());
}

export default async function aiGeneration(req: Request, res: Response) {
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const input = parseAiGenerationInput(req.body);
    if (!input) { res.status(400).json({ error: 'Invalid AI generation request' }); return; }
    if (!isAiGenerationConfigured()) { res.status(503).json({ error: 'AI generation is not configured' }); return; }

    try {
        const rateLimit = await reserveAiGeneration(userId);
        setRateLimitHeaders(res, rateLimit);
        if (!rateLimit.allowed) {
            res.setHeader('Retry-After', rateLimit.retryAfterSeconds.toString());
            res.status(429).json({ error: 'AI generation limit reached', retryAfterSeconds: rateLimit.retryAfterSeconds });
            return;
        }

        const result = await generateTaskDraft(input, userId);
        res.json(result);
    } catch (error) {
        const failure = classifyAiGenerationError(error);
        if (failure === 'timeout') { res.status(504).json({ error: 'AI generation timed out' }); return; }
        console.error('AI generation failed');
        res.status(502).json({ error: 'AI generation failed' });
    }
}
