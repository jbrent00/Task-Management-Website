import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProjectTagManager from './project-tag-manager';

const tags = [{ id: 3, name: 'Home', color: 'blue' }];
const open = () => fireEvent.click(screen.getByRole('button', { name: /Personal tags/ }));

test('keeps tag management outside filters and creates from the inline plus action', async () => {
    const onCreateTag = vi.fn().mockResolvedValue({ id: 4, name: 'Work', color: 'blue' });
    const onNotify = vi.fn();
    render(<ProjectTagManager tags={tags} onCreateTag={onCreateTag} onUpdateTag={() => {}} onDeleteTag={() => {}} onNotify={onNotify} />);

    open();
    fireEvent.click(screen.getByRole('button', { name: 'Create personal tag' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New tag' }), { target: { value: 'Work' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));

    await waitFor(() => expect(onCreateTag).toHaveBeenCalledWith('Work', 'blue'));
    expect(onNotify).toHaveBeenCalledWith({ tone: 'success', message: 'Created tag “Work”.' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create personal tag' })).toHaveFocus());
});

test('deletes a personal tag only after confirmation', async () => {
    const onDeleteTag = vi.fn().mockResolvedValue(undefined);
    const onNotify = vi.fn();
    render(<ProjectTagManager tags={tags} onCreateTag={() => {}} onUpdateTag={() => {}} onDeleteTag={onDeleteTag} onNotify={onNotify} />);

    open();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Home' }));
    expect(onDeleteTag).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDeleteTag).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Home' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete tag' }));
    await waitFor(() => expect(onDeleteTag).toHaveBeenCalledWith(3));
    expect(onNotify).toHaveBeenCalledWith({ tone: 'success', message: 'Deleted tag “Home”.' });
});

test('Escape closes inline editing and restores focus to the tag action', async () => {
    render(<ProjectTagManager tags={tags} onCreateTag={() => {}} onUpdateTag={() => {}} onDeleteTag={() => {}} onNotify={() => {}} />);

    open();
    const editButton = screen.getByRole('button', { name: 'Edit Home' });
    fireEvent.click(editButton);
    const nameInput = screen.getByRole('textbox', { name: 'Tag name' });
    expect(nameInput).toHaveFocus();
    fireEvent.keyDown(nameInput, { key: 'Escape' });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Home' })).toHaveFocus());
    expect(screen.queryByRole('textbox', { name: 'Tag name' })).not.toBeInTheDocument();
});

test('saves an inline tag edit with the selected color', async () => {
    const onUpdateTag = vi.fn().mockResolvedValue(undefined);
    render(<ProjectTagManager tags={tags} onCreateTag={() => {}} onUpdateTag={onUpdateTag} onDeleteTag={() => {}} onNotify={() => {}} />);

    open();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Home' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Tag name' }), { target: { value: 'Family' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onUpdateTag).toHaveBeenCalledWith(3, 'Family', 'blue'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Edit Home' })).toHaveFocus());
});
