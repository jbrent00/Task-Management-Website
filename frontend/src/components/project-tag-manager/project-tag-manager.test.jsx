import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProjectTagManager from './project-tag-manager';

test('deletes a personal tag only after confirmation', async () => {
    const onDeleteTag = vi.fn().mockResolvedValue(undefined);
    const onNotify = vi.fn();
    render(<ProjectTagManager tags={[{ id: 3, name: 'Home', color: 'blue' }]} onUpdateTag={() => {}} onDeleteTag={onDeleteTag} onNotify={onNotify} />);

    fireEvent.click(screen.getByRole('button', { name: 'Manage tags' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteTag).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDeleteTag).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete tag' }));
    await waitFor(() => expect(onDeleteTag).toHaveBeenCalledWith(3));
    expect(onNotify).toHaveBeenCalledWith({ tone: 'success', message: 'Deleted tag “Home”.' });
});

test('traps focus in the edit dialog and restores it when dismissed', () => {
    render(<ProjectTagManager tags={[{ id: 3, name: 'Home', color: 'blue' }]} onUpdateTag={() => {}} onDeleteTag={() => {}} onNotify={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Manage tags' }));
    const editButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    const nameInput = screen.getByRole('textbox', { name: 'Tag name' });
    const saveButton = screen.getByRole('button', { name: 'Save tag' });
    expect(nameInput).toHaveFocus();

    fireEvent.keyDown(nameInput, { key: 'Tab', shiftKey: true });
    expect(saveButton).toHaveFocus();

    fireEvent.keyDown(saveButton, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Edit tag' })).not.toBeInTheDocument();
    expect(editButton).toHaveFocus();
});
