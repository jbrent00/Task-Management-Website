export const tagColors = ['slate', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple'] as const;
export type TagColor = (typeof tagColors)[number];
export const taskPriorities = ['low', 'medium', 'high'] as const;
export const taskStatuses = ['todo', 'in_progress', 'completed'] as const;
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskStatus = (typeof taskStatuses)[number];

export function cleanRequiredText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return null;
    const cleaned = value.trim();
    return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : null;
}

export function cleanOptionalText(value: unknown, maxLength: number) {
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'string' && value.length <= maxLength ? value : undefined;
}

export const normalize = (value: string) => value.toLocaleLowerCase();

export function isIntegerOrNull(value: unknown): value is number | null {
    return value === null || Number.isInteger(value);
}

export function isTagColor(value: unknown): value is TagColor {
    return typeof value === 'string' && tagColors.includes(value as TagColor);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
    return typeof value === 'string' && taskPriorities.includes(value as TaskPriority);
}

export function isTaskStatus(value: unknown): value is TaskStatus {
    return typeof value === 'string' && taskStatuses.includes(value as TaskStatus);
}

export function isNonNegativeInteger(value: unknown): value is number {
    return Number.isInteger(value) && (value as number) >= 0;
}

export function parseOptionalDate(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function isTaskAssignmentInput(projectId: unknown, tagIds: unknown): projectId is number | null {
    return isIntegerOrNull(projectId)
        && Array.isArray(tagIds)
        && tagIds.every(Number.isInteger)
        && new Set(tagIds).size === tagIds.length;
}

export function ownedTaskWhere(id: number, userId: string) {
    return { id, userId };
}
