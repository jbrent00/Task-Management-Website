import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'token', userId: 'viewer' }) }));
vi.mock('../../api/updateTask', () => ({ updateTask: vi.fn() }));
vi.mock('../../api/deleteTask', () => ({ deleteTask: vi.fn() }));
vi.mock('../checklist/checklist', () => ({ default: () => <div>Checklist placeholder</div> }));
vi.mock('../task-comments/task-comments', () => ({ default: () => <div>Discussion placeholder</div> }));
vi.mock('../activity-timeline/activity-timeline', () => ({ default: () => <div>Activity placeholder</div> }));

import TaskDetailModal from './task-detail-modal';
import { updateTask } from '../../api/updateTask';
import { deleteTask } from '../../api/deleteTask';

const task = { id: 4, title: 'Review launch', description: '', status: 'todo', priority: 'medium', dueDate: null, projectId: 1, tags: [], assignees: [], checklistItems: [], capabilities: { canEdit: false } };
const project = { id: 1, role: 'viewer', archivedAt: null, tags: [], memberships: [{ userId: 'viewer', role: 'viewer', user: { fname: 'Vera', lname: 'Viewer' } }] };

test('provides an accessible read-only modal with keyboard close and detail tabs', () => {
    const onClose = vi.fn();
    render(<TaskDetailModal task={task} project={project} onClose={onClose} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Review launch' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'More task actions' })).not.toBeInTheDocument();
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

test('allows an editable project task to create and select a shared tag', async () => {
    const editableTask = { ...task, capabilities: { canEdit: true } };
    const onCreateProjectTag = vi.fn().mockResolvedValue({ id: 12, name: 'Planning', color: 'blue' });
    render(<TaskDetailModal task={editableTask} project={{ ...project, role: 'editor' }} onCreateProjectTag={onCreateProjectTag} onClose={() => {}} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create tag' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New tag name' }), { target: { value: 'Planning' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(onCreateProjectTag).toHaveBeenCalledWith('Planning', 'blue'));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
});

test('Escape closes project tag creation while keeping task details open', async () => {
    const onClose = vi.fn();
    render(<TaskDetailModal task={{ ...task, capabilities: { canEdit: true } }} project={{ ...project, role: 'editor' }} onCreateProjectTag={vi.fn()} onClose={onClose} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Create tag' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'New tag name' }), { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('textbox', { name: 'New tag name' })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
});

test('confirms before closing dirty task fields and protects page unload', () => {
    const personalTask = { ...task, id: 6, projectId: null, capabilities: { canEdit: true, canDelete: true } };
    const onClose = vi.fn();
    render(<TaskDetailModal task={personalTask} personalTags={[]} onCreatePersonalTag={vi.fn()} onClose={onClose} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);

    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Unsaved notes' } });
    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close task details' }));
    expect(screen.getByRole('alertdialog', { name: 'Discard changes?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('dialog', { name: personalTask.title }), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(onClose).toHaveBeenCalledOnce();
});

test('deletes only after the in-app confirmation is accepted', async () => {
    const personalTask = { ...task, id: 7, projectId: null, capabilities: { canEdit: true, canDelete: true } };
    const onDeleted = vi.fn();
    deleteTask.mockResolvedValueOnce(undefined);
    render(<TaskDetailModal task={personalTask} personalTags={[]} onCreatePersonalTag={vi.fn()} onClose={() => {}} onUpdated={() => {}} onDeleted={onDeleted} onNotify={() => {}} />);

    const actions = screen.getByRole('button', { name: 'More task actions' });
    fireEvent.click(actions);
    expect(screen.getByRole('menu', { name: 'Task actions' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Delete task' }));
    expect(deleteTask).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));
    expect(deleteTask).not.toHaveBeenCalled();
    await waitFor(() => expect(actions).toHaveFocus());

    fireEvent.click(actions);
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Delete task' }));
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Delete this task?' })).getByRole('button', { name: 'Delete task' }));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledWith('token', personalTask.id));
    expect(onDeleted).toHaveBeenCalledWith(personalTask.id);
});

test('closes the task actions menu with Escape without closing task details', () => {
    const personalTask = { ...task, id: 8, projectId: null, capabilities: { canEdit: true, canDelete: true } };
    const onClose = vi.fn();
    render(<TaskDetailModal task={personalTask} personalTags={[]} onCreatePersonalTag={vi.fn()} onClose={onClose} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);
    const actions = screen.getByRole('button', { name: 'More task actions' });
    fireEvent.keyDown(actions, { key: 'ArrowDown' });
    const menu = screen.getByRole('menu', { name: 'Task actions' });
    expect(within(menu).getByRole('menuitem', { name: 'Delete task' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(actions).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();
});

test('shows a retryable project loading error without exposing incomplete fields', () => {
    const onRetryProject = vi.fn();
    render(<TaskDetailModal task={task} projectError="Request failed" onRetryProject={onRetryProject} onClose={() => {}} onUpdated={() => {}} onDeleted={() => {}} onNotify={() => {}} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load project details.');
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetryProject).toHaveBeenCalledOnce();
});
