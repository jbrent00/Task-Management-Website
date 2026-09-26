import { fireEvent, render, screen, within } from '@testing-library/react';
import { TaskMutationContext } from '../../functions/taskMutationContext';

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'token' }) }));
import TaskCard from './task-card';

const mutation = { busy: false, begin: () => true, end: () => {} };
const task = {
    id: 12,
    title: 'Write release notes',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: null,
    projectId: null,
    tags: [],
    assignees: [],
    checklistItems: [],
    capabilities: { canEdit: true, canDelete: true, canJoin: false, canLeave: false, canReorder: true },
};
const renderCard = (props = {}) => render(<TaskMutationContext.Provider value={mutation}><TaskCard task={task} setAllTasks={() => {}} onNotify={() => {}} {...props} /></TaskMutationContext.Provider>);

test('uses a direct stable edit action instead of a card overflow menu', () => {
    const onOpenDetails = vi.fn();
    renderCard({ onOpenDetails });

    fireEvent.click(screen.getByRole('button', { name: 'Edit Write release notes' }));
    expect(onOpenDetails).toHaveBeenCalledWith(12);
    expect(screen.queryByRole('button', { name: 'Task actions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Checklist progress' })).not.toBeInTheDocument();
});

test('makes the non-interactive personal card body the keyboard drag surface', () => {
    const onKeyDown = vi.fn();
    renderCard({ onOpenDetails: () => {}, isDragEnabled: true, dragHandleProps: { role: 'button', tabIndex: 0, onKeyDown } });

    const dragSurface = screen.getByRole('button', { name: 'Drag Write release notes to reorder' });
    dragSurface.focus();
    fireEvent.keyDown(dragSurface, { key: ' ' });
    expect(onKeyDown).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit Write release notes' })).not.toBe(dragSurface);
});

test('shows project identity and task details without an assignee row inside My tasks', () => {
    const detailedTask = {
        ...task,
        dueDate: '2026-01-15T12:00:00.000Z',
        projectId: 8,
        project: { id: 8, title: 'Website refresh' },
        tags: [{ id: 1, name: 'Research', color: 'blue' }, { id: 2, name: 'Content', color: 'orange' }, { id: 3, name: 'Launch', color: 'green' }],
        assignees: [
            { id: 4, fname: 'Jamie', lname: 'Chen', imageUrl: null },
            { id: 5, fname: 'Ari', lname: 'Patel', imageUrl: null },
            { id: 6, fname: 'Morgan', lname: 'Lee', imageUrl: null },
        ],
        checklistItems: [{ id: 9, text: 'Draft notes', completed: true }, { id: 10, text: 'Publish notes', completed: false }],
        commentCount: 3,
    };
    render(<TaskMutationContext.Provider value={mutation}><TaskCard task={detailedTask} setAllTasks={() => {}} onOpenDetails={() => {}} onNotify={() => {}} /></TaskMutationContext.Provider>);

    const projectName = screen.getByText('Website refresh');
    expect(projectName.closest('div')).toHaveTextContent('Website refresh');
    expect(screen.queryByText('Jamie Chen')).not.toBeInTheDocument();
    const dueDate = screen.getByText(/Jan 15/);
    expect(screen.queryByText('Research')).not.toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Launch')).not.toBeInTheDocument();
    expect(within(dueDate.closest('div')).getByLabelText('1 of 2 subtasks complete')).toHaveTextContent('1/2 subtasks');
    const discussion = screen.getByLabelText('3 comments');
    expect(within(discussion.closest('div')).queryByText('Research')).not.toBeInTheDocument();
    expect(discussion.parentElement.parentElement).toBe(dueDate.parentElement.parentElement);
    expect(discussion.parentElement).toBe(discussion.parentElement.parentElement.firstElementChild);
    expect(screen.getByRole('button', { name: 'Edit Write release notes' })).toBeInTheDocument();
});

test('uses project-board assignee, optional tag, and utility rows', () => {
    const boardTask = {
        ...task,
        projectId: 8,
        dueDate: '2026-01-15T12:00:00.000Z',
        tags: [{ id: 1, name: 'Research', color: 'blue' }],
        assignees: [
            { id: 4, fname: 'Jamie', lname: 'Chen', imageUrl: null },
            { id: 5, fname: 'Ari', lname: 'Patel', imageUrl: null },
        ],
        checklistItems: [{ id: 9, text: 'Draft notes', completed: true }],
        commentCount: 1,
    };
    render(<TaskMutationContext.Provider value={mutation}><TaskCard task={boardTask} projectMode setAllTasks={() => {}} onOpenDetails={() => {}} onNotify={() => {}} /></TaskMutationContext.Provider>);

    expect(screen.getByText('Jamie Chen')).toBeInTheDocument();
    const assigneeRow = screen.getByText('Jamie Chen').closest('div');
    expect(assigneeRow.children[0]).toHaveTextContent('Jamie ChenJ');
    expect(assigneeRow.children[1]).toHaveTextContent(',Ari PatelA');
    expect(assigneeRow.children[2]).toHaveTextContent('+1');
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Research').closest('div').parentElement.nextElementSibling).toContainElement(screen.getByText('Jamie Chen'));
    const discussion = screen.getByLabelText('1 comment');
    const utilityRow = discussion.closest('div');
    expect(within(utilityRow).getByText(/Jan 15/)).toBeInTheDocument();
    expect(within(utilityRow).getByLabelText('1 of 1 subtasks complete')).toBeInTheDocument();
});

test('shows an explicit unassigned state and omits the tag row on the project board', () => {
    render(<TaskMutationContext.Provider value={mutation}><TaskCard task={{ ...task, projectId: 8 }} projectMode setAllTasks={() => {}} onOpenDetails={() => {}} onNotify={() => {}} /></TaskMutationContext.Provider>);

    expect(screen.getByText('No assignees')).toBeInTheDocument();
    expect(screen.queryByLabelText(/more tags/)).not.toBeInTheDocument();
});
