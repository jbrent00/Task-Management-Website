export const tagColors = ['slate', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple'] as const;
export type TagColor = (typeof tagColors)[number];

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
