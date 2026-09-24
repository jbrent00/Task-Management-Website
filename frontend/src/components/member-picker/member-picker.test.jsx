import { fireEvent, render, screen, within } from '@testing-library/react';
import MemberPicker from './member-picker';

const members = [
    { userId: 'owner', role: 'owner', user: { fname: 'Olivia', lname: 'Owner', primaryEmail: 'owner@example.test' } },
    { userId: 'editor', role: 'editor', user: { fname: 'Eli', lname: 'Editor', primaryEmail: 'editor@example.test' } },
    { userId: 'viewer', role: 'viewer', user: { fname: 'Vera', lname: 'Viewer', primaryEmail: 'viewer@example.test' } },
];

test('filters eligible members and returns multiple checked ids', () => {
    const changes = [];
    render(<MemberPicker members={members} selectedIds={['owner']} onChange={(ids) => changes.push(ids)} />);
    fireEvent.click(screen.getByRole('button', { name: /1 selected/i }));
    expect(screen.getByRole('dialog', { name: /choose assignees/i })).toBeInTheDocument();
    expect(screen.queryByText('Vera Viewer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Eli Editor/i }));
    expect(changes).toEqual([['owner', 'editor']]);
});

test('searches members by email and supports removing a selected chip', () => {
    const onChange = vi.fn();
    render(<MemberPicker members={members} selectedIds={['editor']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /1 selected/i }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'owner@' } });
    const dialog = screen.getByRole('dialog', { name: /choose assignees/i });
    expect(within(dialog).getByText('Olivia Owner')).toBeInTheDocument();
    expect(within(dialog).queryByText('Eli Editor')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /remove Eli Editor/i }));
    expect(onChange).toHaveBeenCalledWith([]);
});
