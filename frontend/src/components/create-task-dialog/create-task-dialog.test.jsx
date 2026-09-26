import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import ConfirmDialog from '../confirm-dialog/confirm-dialog';
import CreateTaskDialog from './create-task-dialog';

function DialogHarness() {
    const [open, setOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);
    return <>
        <button onClick={() => setOpen(true)}>Create task</button>
        <CreateTaskDialog open={open} title="Create task" onClose={() => setOpen(false)}>
            <input aria-label="Title" />
            <button onClick={() => setConfirming(true)}>Generate with AI</button>
            {confirming && <ConfirmDialog title="Replace draft?" onCancel={() => setConfirming(false)} onConfirm={() => setConfirming(false)}>Replace it?</ConfirmDialog>}
        </CreateTaskDialog>
    </>;
}

test('traps focus, keeps a nested confirmation inside the create flow, and restores the opener', () => {
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Create task' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Create task' });
    expect(within(dialog).getByRole('textbox', { name: 'Title' })).toHaveFocus();

    const generate = within(dialog).getByRole('button', { name: 'Generate with AI' });
    generate.focus();
    fireEvent.click(generate);
    const confirmation = screen.getByRole('alertdialog', { name: 'Replace draft?' });
    expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    fireEvent.keyDown(confirmation, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(dialog).toBeVisible();
    expect(generate).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
});
