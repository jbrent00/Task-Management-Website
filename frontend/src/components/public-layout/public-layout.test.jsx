import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../theme-provider/theme-provider';
import { PublicHeader } from './public-layout';

const auth = vi.hoisted(() => ({ isSignedIn: false }));
vi.mock('@clerk/react', () => ({ useAuth: () => auth }));

test('shows a direct demo link only to signed-out visitors', () => {
  const renderHeader = () => render(<MemoryRouter><ThemeProvider><PublicHeader /></ThemeProvider></MemoryRouter>);
  const guest = renderHeader();
  expect(screen.getByRole('link', { name: 'Try demo' })).toHaveAttribute('href', '/demo');
  guest.unmount();
  auth.isSignedIn = true;
  renderHeader();
  expect(screen.queryByRole('link', { name: 'Try demo' })).not.toBeInTheDocument();
  auth.isSignedIn = false;
});
