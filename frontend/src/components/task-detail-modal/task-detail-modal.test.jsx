import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'token', userId: 'viewer' }) }));
vi.mock('../../api/updateTask', () => ({ updateTask: vi.fn() }));
vi.mock('../../api/deleteTask', () => ({ deleteTask: vi.fn() }));
vi.mock('../checklist/checklist', () => ({ default: () => <div>Checklist placeholder</div> }));
vi.mock('../task-comments/task-comments', () => ({ default: () => <div>Discussion placeholder</div> }));
vi.mock('../activity-timeline/activity-timeline', () => ({ default: () => <div>Activity placeholder</div> }));

import TaskDetailModal from './task-detail-modal';
import { updateTask } from '../../api/updateTask';

const task = { id: 4, title: 'Review launch', description: '', status: 'todo', priority: 'medium', dueDate: null, projectId: 1, tags: [], assignees: [], checklistItems: [], capabilities: { canEdit: false } };
const project = { id: 1, role: 'viewer', archivedAt: null, tags: [], memberships: [{ userId: 'viewer', role: 'viewer', user: { fname: 'Vera', lname: 'Viewer' } }] };

test('provides an accessible read-only modal with keyboard close and detail tabs', () => {
    const onClose = vi.fn();
    render(<TaskDetailModal task={task} project={project} onClose={onClose} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Review launch' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'discussion' }));
    expect(screen.getByText('Discussion placeholder')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
});

test('shows a details-only personal task modal and keeps it open after saving', async () => {
    const personalTask = { ...task, id: 5, title: 'Plan errands', projectId: null, capabilities: { canEdit: true, canDelete: true } };
    const updated = { ...personalTask, title: 'Plan weekend errands' };
    updateTask.mockResolvedValueOnce(updated);
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    render(<TaskDetailModal task={personalTask} personalTags={[]} onCreatePersonalTag={vi.fn()} onClose={onClose} onUpdated={onUpdated} onDeleted={() => {}} onNotify={() => {}} />);

    expect(screen.getByText('Personal task')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'discussion' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Plan weekend errands' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
});

test('confirms before closing dirty task fields and protects page unload', () => {
    const personalTask = { ...task, id: 6, projectId: null, capabilities: { canEdit: true, canDelete: true } };
    const onClose = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<TaskDetailModal task={personalTask} personalTags={[]} onCreatePersonalTag={vi.fn()} onClose={onClose} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Unsaved notes' } });
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close task details' }));
    expect(confirm).toHaveBeenCalledWith('Discard your unsaved task changes?');
    expect(onClose).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    confirm.mockRestore();
});

test('shows a retryable project loading error without exposing incomplete fields', () => {
    const onRetryProject = vi.fn();
    render(<TaskDetailModal task={task} projectError="Request failed" onRetryProject={onRetryProject} onClose={() => {}} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load project details.');
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetryProject).toHaveBeenCalledOnce();
});
