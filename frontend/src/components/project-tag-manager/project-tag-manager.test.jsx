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
