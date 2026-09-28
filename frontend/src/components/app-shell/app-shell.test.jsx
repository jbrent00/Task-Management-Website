import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../theme-provider/theme-provider';
import AppShell from './app-shell';

vi.mock('@clerk/react', () => ({ UserButton: () => <button type="button">User account</button> }));
vi.mock('../collaboration-inbox/collaboration-inbox', () => ({ default: () => <button type="button">Notifications</button> }));

describe('AppShell', () => {
    beforeEach(() => localStorage.clear());

    it('exposes the preserved product navigation in desktop and mobile landmarks', () => {
        render(<MemoryRouter initialEntries={['/tasks']}><ThemeProvider><AppShell><h1>Workspace</h1></AppShell></ThemeProvider></MemoryRouter>);
        expect(screen.getAllByRole('link', { name: 'My tasks' })).toHaveLength(2);
        expect(screen.getAllByRole('link', { name: 'Projects' })).toHaveLength(2);
        for (const link of screen.getAllByRole('link', { name: 'Flowboard home' })) expect(link).toHaveAttribute('href', '/');
        expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();
    });

    it('persists the collapsed desktop sidebar preference', () => {
        render(<MemoryRouter><ThemeProvider><AppShell>Content</AppShell></ThemeProvider></MemoryRouter>);
        fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
        expect(localStorage.getItem('flowboard:sidebar-collapsed')).toBe('true');
        expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    });

    it('takes guests from the product logo back to the landing page', () => {
        render(<MemoryRouter initialEntries={['/demo/tasks']}><ThemeProvider><AppShell demo>Guest workspace</AppShell></ThemeProvider></MemoryRouter>);
        expect(screen.getAllByRole('link', { name: 'Flowboard home' })).toHaveLength(2);
        for (const link of screen.getAllByRole('link', { name: 'Flowboard home' })) expect(link).toHaveAttribute('href', '/');
    });
});
