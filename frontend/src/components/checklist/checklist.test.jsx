import { fireEvent, render, screen } from '@testing-library/react';
import Checklist from './checklist';

const items = [
    { id: 'draft-1', text: 'Review agenda', completed: true },
    { id: 'draft-2', text: 'Gather references', completed: false },
];

test('renders the comp-style checklist expanded without a large progress track', () => {
    render(<Checklist draft defaultExpanded items={items} onItemsChange={() => {}} onNotify={() => {}} />);

    expect(screen.getByRole('button', { name: 'Checklist' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('1 of 2 complete')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Mark Review agenda complete' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Mark Gather references complete' })).not.toBeChecked();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});

test('preserves keyboard-operable checklist reordering', () => {
    const onItemsChange = vi.fn();
    render(<Checklist draft defaultExpanded items={items} onItemsChange={onItemsChange} onNotify={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move Gather references up' }));
    expect(onItemsChange).toHaveBeenCalledWith([items[1], items[0]]);
});

test('adds a draft subtask from the compact add row', () => {
    const onItemsChange = vi.fn();
    render(<Checklist draft defaultExpanded items={[]} onItemsChange={onItemsChange} onNotify={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Add subtask…'), { target: { value: 'Confirm launch date' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onItemsChange).toHaveBeenCalledWith([expect.objectContaining({ text: 'Confirm launch date', completed: false })]);
});

test('removes a draft subtask without affecting the other items', () => {
    const onItemsChange = vi.fn();
    render(<Checklist draft defaultExpanded items={items} onItemsChange={onItemsChange} onNotify={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Gather references' }));
    expect(onItemsChange).toHaveBeenCalledWith([items[0]]);
});
