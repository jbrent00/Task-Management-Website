import { Prisma } from '../../generated/prisma/client';
import { prisma } from './prisma';

export const AI_RATE_LIMIT = 10;
export const AI_RATE_WINDOW_MS = 10 * 60 * 1000;

export type AiRateLimitResult = {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: Date;
    retryAfterSeconds: number;
};

export function getAiRateLimitResult(requestCount: number, windowStartedAt: Date, now: Date, allowed: boolean): AiRateLimitResult {
    const resetAt = new Date(windowStartedAt.getTime() + AI_RATE_WINDOW_MS);
    const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
    return { allowed, limit: AI_RATE_LIMIT, remaining: Math.max(0, AI_RATE_LIMIT - requestCount), resetAt, retryAfterSeconds };
}

export async function reserveAiGeneration(userId: string, now = new Date()): Promise<AiRateLimitResult> {
    const expiredBefore = new Date(now.getTime() - AI_RATE_WINDOW_MS);

    const reset = await prisma.aiGenerationLimit.updateMany({
        where: { userId, windowStartedAt: { lte: expiredBefore } },
        data: { windowStartedAt: now, requestCount: 1 },
    });
    if (reset.count) return getAiRateLimitResult(1, now, now, true);

    const incremented = await prisma.aiGenerationLimit.updateMany({
        where: { userId, windowStartedAt: { gt: expiredBefore }, requestCount: { lt: AI_RATE_LIMIT } },
        data: { requestCount: { increment: 1 } },
    });
    if (incremented.count) {
        const record = await prisma.aiGenerationLimit.findUniqueOrThrow({ where: { userId } });
        return getAiRateLimitResult(record.requestCount, record.windowStartedAt, now, true);
    }

    const record = await prisma.aiGenerationLimit.findUnique({ where: { userId } });
    if (record) return getAiRateLimitResult(record.requestCount, record.windowStartedAt, now, false);

    try {
        await prisma.aiGenerationLimit.create({ data: { userId, windowStartedAt: now, requestCount: 1 } });
        return getAiRateLimitResult(1, now, now, true);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return reserveAiGeneration(userId, now);
        throw error;
    }
}
