import { render, screen } from '@testing-library/react';
import CreateTaskForm from './create-task-form';
import { WorkspaceOperationsContext } from '../../functions/workspace-context';
import { createDemoOperations } from '../../functions/workspace-operations';
import { TaskMutationContext } from '../../functions/taskMutationContext';

test('keeps AI controls visible but unavailable in the guest form', () => {
    const storage = { getItem: () => null, setItem: () => {} };
    render(<WorkspaceOperationsContext.Provider value={createDemoOperations(storage)}><TaskMutationContext.Provider value={{ busy: false, begin: () => true, end: () => {} }}>
        <CreateTaskForm expanded tasks={[]} setTasks={() => {}} tags={[]} onCreateTag={() => {}} onNotify={() => {}} onCreated={() => {}} />
    </TaskMutationContext.Provider></WorkspaceOperationsContext.Provider>);

    expect(screen.getByRole('button', { name: 'Generate description' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generate checklist' })).toBeDisabled();
    expect(document.getElementById('guest-ai-help')).toHaveTextContent('AI generation requires an account.');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/sign-up');
    expect(screen.getByRole('button', { name: 'Generate checklist' })).toHaveAttribute('aria-describedby', 'guest-ai-help');
});
