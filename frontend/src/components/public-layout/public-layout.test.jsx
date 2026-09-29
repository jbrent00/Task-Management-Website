import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../theme-provider/theme-provider';
import { PublicHeader } from './public-layout';

const auth = vi.hoisted(() => ({ isSignedIn: false }));
vi.mock('@clerk/react', () => ({ useAuth: () => auth }));

test('puts the demo last for guests and avoids duplicate workspace links for members', () => {
  const renderHeader = () => render(<MemoryRouter><ThemeProvider><PublicHeader /></ThemeProvider></MemoryRouter>);
  const guest = renderHeader();
  const guestLinks = within(screen.getByRole('navigation', { name: 'Public navigation' })).getAllByRole('link');
  expect(guestLinks.map((link) => link.textContent.trim())).toEqual(['Product', 'Case study', 'GitHub', 'Sign in', 'Explore the demo']);
  expect(screen.getByRole('link', { name: 'Explore the demo' })).toHaveAttribute('href', '/demo');
  guest.unmount();
  auth.isSignedIn = true;
  renderHeader();
  const memberLinks = within(screen.getByRole('navigation', { name: 'Public navigation' })).getAllByRole('link');
  expect(memberLinks.map((link) => link.textContent.trim())).toEqual(['Product', 'Case study', 'GitHub', 'Open workspace']);
  auth.isSignedIn = false;
});
