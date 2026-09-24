import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmDialog from './confirm-dialog';

test('renders an accessible dialog and confirms the action', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog title="Delete task?" confirmLabel="Delete task" onConfirm={onConfirm} onCancel={() => {}}>This cannot be undone.</ConfirmDialog>);

    expect(screen.getByRole('alertdialog', { name: 'Delete task?' })).toHaveAccessibleDescription('This cannot be undone.');
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }));
    expect(onConfirm).toHaveBeenCalledOnce();
});

test('focuses Cancel, traps keyboard focus, restores focus, and cancels with Escape', () => {
    const onCancel = vi.fn();
    const { rerender } = render(<button>Open dialog</button>);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    trigger.focus();
    rerender(<><button>Open dialog</button><ConfirmDialog title="Discard changes?" confirmLabel="Discard" tone="warning" onConfirm={() => {}} onCancel={onCancel}>Your edits will be lost.</ConfirmDialog></>);

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const confirm = screen.getByRole('button', { name: 'Discard' });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true });
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(confirm, { key: 'Tab' });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();

    rerender(<button>Open dialog</button>);
    expect(screen.getByRole('button', { name: 'Open dialog' })).toHaveFocus();
});

test('disables dismissal and actions while busy', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDialog title="Delete task?" confirmLabel="Delete task" busy busyLabel="Deleting…" onConfirm={onConfirm} onCancel={onCancel}>This cannot be undone.</ConfirmDialog>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
});
