import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'token', userId: 'viewer' }) }));
vi.mock('../checklist/checklist', () => ({ default: () => <div>Checklist placeholder</div> }));
vi.mock('../task-comments/task-comments', () => ({ default: () => <div>Discussion placeholder</div> }));
vi.mock('../activity-timeline/activity-timeline', () => ({ default: () => <div>Activity placeholder</div> }));

import TaskDetailModal from './task-detail-modal';

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
