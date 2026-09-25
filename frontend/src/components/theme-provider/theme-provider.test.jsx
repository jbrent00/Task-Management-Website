import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from './theme-provider';
import { useTheme } from './theme-context';
import { THEME_STORAGE_KEY } from './theme-utils';

function ThemeProbe() {
    const { preference, resolvedTheme, setPreference } = useTheme();
    return <><span>{preference}:{resolvedTheme}</span><button type="button" onClick={() => setPreference('light')}>Use light</button></>;
}

function createMedia(matches = false) {
    const listeners = new Set();
    return {
        matches,
        addEventListener: vi.fn((_, listener) => listeners.add(listener)),
        removeEventListener: vi.fn((_, listener) => listeners.delete(listener)),
        setMatches(next) {
            this.matches = next;
            listeners.forEach((listener) => listener({ matches: next }));
        },
    };
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        localStorage.clear();
        delete document.documentElement.dataset.theme;
    });

    it('restores and applies a stored preference', () => {
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        window.matchMedia = vi.fn(() => createMedia(false));
        render(<ThemeProvider><ThemeProbe /></ThemeProvider>);
        expect(screen.getByText('dark:dark')).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    it('persists an explicit preference', async () => {
        window.matchMedia = vi.fn(() => createMedia(true));
        render(<ThemeProvider><ThemeProbe /></ThemeProvider>);
        await act(async () => screen.getByRole('button', { name: 'Use light' }).click());
        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    });

    it('tracks operating-system changes while using system', () => {
        const media = createMedia(false);
        window.matchMedia = vi.fn(() => media);
        render(<ThemeProvider><ThemeProbe /></ThemeProvider>);
        expect(screen.getByText('system:light')).toBeInTheDocument();
        act(() => media.setMatches(true));
        expect(screen.getByText('system:dark')).toBeInTheDocument();
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });
});
