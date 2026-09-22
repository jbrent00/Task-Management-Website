const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export class AiGenerationError extends Error {
    constructor(message, status, retryAfterSeconds = null) {
        super(message);
        this.name = 'AiGenerationError';
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export async function generateTaskDraft(token, input) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);
    try {
        const response = await fetch(`${backendURL}/tasks/ai/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(input),
            signal: controller.signal,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new AiGenerationError(body.error || 'AI generation failed', response.status, body.retryAfterSeconds ?? null);
        return body;
    } catch (error) {
        if (error?.name === 'AbortError') throw new AiGenerationError('AI generation timed out', 504);
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}
