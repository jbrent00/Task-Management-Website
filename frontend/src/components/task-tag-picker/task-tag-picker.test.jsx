import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TaskTagPicker from './task-tag-picker';

const tags = [
    { id: 1, name: 'Research', color: 'blue' },
    { id: 2, name: 'Launch', color: 'green' },
];

test('toggles comp-style tag chips without exposing native checkboxes visually', () => {
    const onChange = vi.fn();
    render(<TaskTagPicker tags={tags} selectedIds={[1]} onChange={onChange} />);

    expect(screen.getByRole('checkbox', { name: 'Research' })).toBeChecked();
    fireEvent.click(screen.getByText('Launch'));
    expect(onChange).toHaveBeenCalledWith([1, 2]);
});

test('creates and selects a new personal tag from the circular add control', async () => {
    const onChange = vi.fn();
    const onCreateTag = vi.fn().mockResolvedValue({ id: 3, name: 'Planning', color: 'purple' });
    render(<TaskTagPicker tags={tags} selectedIds={[1]} onChange={onChange} onCreateTag={onCreateTag} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create tag' }));
    fireEvent.change(screen.getByLabelText('New tag name'), { target: { value: 'Planning' } });
    fireEvent.click(screen.getByRole('radio', { name: 'purple' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onCreateTag).toHaveBeenCalledWith('Planning', 'purple'));
    expect(onChange).toHaveBeenCalledWith([1, 3]);
});
