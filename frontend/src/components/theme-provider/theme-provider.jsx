import { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './theme-context';
import { getStoredTheme, getSystemTheme, themePreferences, THEME_STORAGE_KEY } from './theme-utils';

export function ThemeProvider({ children }) {
    const [preference, setPreferenceState] = useState(getStoredTheme);
    const [systemTheme, setSystemTheme] = useState(getSystemTheme);
    const resolvedTheme = preference === 'system' ? systemTheme : preference;

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setSystemTheme(getSystemTheme(media));
        handleChange();
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = resolvedTheme;
        document.documentElement.style.colorScheme = resolvedTheme;
    }, [resolvedTheme]);

    const setPreference = (nextPreference) => {
        if (!themePreferences.includes(nextPreference)) return;
        setPreferenceState(nextPreference);
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
        } catch {
            // The active preference still applies when storage is unavailable.
        }
    };

    const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
