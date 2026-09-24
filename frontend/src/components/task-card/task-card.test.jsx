import { fireEvent, render, screen, within } from '@testing-library/react';
import { TaskMutationContext } from '../../functions/taskMutationContext';

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'token' }) }));
vi.mock('../checklist/checklist', () => ({ default: ({ openRequest }) => <div>Checklist {openRequest}</div> }));

import TaskCard from './task-card';

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
    capabilities: { canEdit: true, canDelete: true, canJoin: false, canLeave: false },
};

test('uses the detail modal action while retaining the inline checklist action', () => {
    const onOpenDetails = vi.fn();
    const mutation = { busy: false, begin: () => true, end: () => {} };
    render(<TaskMutationContext.Provider value={mutation}><TaskCard task={task} setAllTasks={() => {}} inlineChecklist onOpenDetails={onOpenDetails} onNotify={() => {}} /></TaskMutationContext.Provider>);

    fireEvent.click(screen.getByRole('button', { name: 'Task actions' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Open details' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Add checklist' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Open details' }));
    expect(onOpenDetails).toHaveBeenCalledWith(12);
    expect(screen.getByText('Checklist 0')).toBeInTheDocument();
});
