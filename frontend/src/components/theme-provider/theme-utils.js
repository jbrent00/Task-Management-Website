export const THEME_STORAGE_KEY = 'flowboard:theme';
export const themePreferences = ['system', 'light', 'dark'];

export function getSystemTheme(media = window.matchMedia('(prefers-color-scheme: dark)')) {
    return media.matches ? 'dark' : 'light';
}

export function getStoredTheme(storage = window.localStorage) {
    try {
        const stored = storage.getItem(THEME_STORAGE_KEY);
        return themePreferences.includes(stored) ? stored : 'system';
    } catch {
        return 'system';
    }
}
