import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedPage } from './App';

let authState = 'signed-out';

vi.mock('@clerk/react', () => ({
    Show: ({ when, children }) => when === authState ? children : null,
    UserButton: () => null,
    useAuth: () => ({ isLoaded: true, userId: 'user-1', getToken: vi.fn() }),
}));
vi.mock('./components/app-shell/app-shell', () => ({ default: ({ children }) => <div data-testid="shell">{children}</div> }));

function TestRoutes() {
    return <MemoryRouter initialEntries={['/tasks']}><Routes>
        <Route path="/tasks" element={<ProtectedPage><h1>Protected workspace</h1></ProtectedPage>} />
        <Route path="/sign-in" element={<h1>Sign in</h1>} />
    </Routes></MemoryRouter>;
}

describe('ProtectedPage', () => {
    it('redirects signed-out visitors to sign in', () => {
        authState = 'signed-out';
        render(<TestRoutes />);
        expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    });

    it('keeps signed-in visitors in the product shell', () => {
        authState = 'signed-in';
        render(<TestRoutes />);
        expect(screen.getByRole('heading', { name: 'Protected workspace' })).toBeInTheDocument();
        expect(screen.getByTestId('shell')).toBeInTheDocument();
    });
});
