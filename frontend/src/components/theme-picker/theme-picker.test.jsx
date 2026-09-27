import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider/theme-provider';
import { THEME_STORAGE_KEY } from '../theme-provider/theme-utils';
import ThemePicker from './theme-picker';

describe('ThemePicker', () => {
  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });

  it('shows readable choices and applies a theme preference', () => {
    render(<ThemeProvider><ThemePicker /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Theme: System' }));
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toBeVisible();
    expect(screen.getByRole('menuitemradio', { name: 'Dark' })).toBeVisible();
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Dark' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('supports arrow navigation and Escape without changing the theme', () => {
    render(<ThemeProvider><ThemePicker /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Theme: System' }));
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(screen.getByRole('menuitemradio', { name: 'Light' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Theme: System' })).toHaveFocus();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});
