import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const api = vi.hoisted(() => ({
    getTaskComments: vi.fn(), createTaskComment: vi.fn(), updateTaskComment: vi.fn(), deleteTaskComment: vi.fn(),
}));
vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'token', userId: 'author' }) }));
vi.mock('../../api/projectTasks', () => api);

import TaskComments from './task-comments';

const project = {
    id: 1, role: 'editor', archivedAt: null,
    memberships: [
        { userId: 'author', role: 'editor', user: { fname: 'Ari', lname: 'Author', primaryEmail: 'ari@example.test' } },
        { userId: 'editor', role: 'editor', user: { fname: 'Eli', lname: 'Editor', primaryEmail: 'eli@example.test' } },
    ],
};

beforeEach(() => {
    vi.clearAllMocks();
    api.getTaskComments.mockResolvedValue({ items: [], nextCursor: null });
    api.createTaskComment.mockResolvedValue({ id: 9, taskId: 3, authorId: 'author', author: project.memberships[0].user, body: 'Hi @Eli Editor', mentions: [{ userId: 'editor', start: 3, end: 14 }], createdAt: new Date().toISOString(), editedAt: null, deletedAt: null });
});

test('deletes a comment only after confirmation', async () => {
    const comment = { id: 5, taskId: 3, authorId: 'author', author: project.memberships[0].user, body: 'Remove me', mentions: [], createdAt: new Date().toISOString(), editedAt: null, deletedAt: null };
    api.getTaskComments.mockResolvedValueOnce({ items: [comment], nextCursor: null });
    api.deleteTaskComment.mockResolvedValueOnce(undefined);
    render(<TaskComments task={{ id: 3, assignees: [] }} project={project} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(api.deleteTaskComment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(api.deleteTaskComment).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Delete comment?' })).getByRole('button', { name: 'Delete comment' }));
    await waitFor(() => expect(api.deleteTaskComment).toHaveBeenCalledWith('token', 3, 5));
    expect(screen.getByText('This comment was deleted.')).toBeInTheDocument();
});

test('creates a structured mention through the @ typeahead', async () => {
    render(<TaskComments task={{ id: 3, assignees: [] }} project={project} />);
    const composer = screen.getByPlaceholderText(/type @ to mention/i);
    fireEvent.change(composer, { target: { value: 'Hi @El', selectionStart: 6 } });
    fireEvent.click(await screen.findByRole('option', { name: /Eli Editor/i }));
    expect(composer).toHaveValue('Hi @Eli Editor');
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
    await waitFor(() => expect(api.createTaskComment).toHaveBeenCalledWith('token', 3, { body: 'Hi @Eli Editor', mentions: [{ userId: 'editor', start: 3, end: 14 }] }));
});

test('selects a mention with the keyboard without submitting or inserting a newline', async () => {
    render(<TaskComments task={{ id: 3, assignees: [] }} project={project} />);
    const composer = screen.getByPlaceholderText(/type @ to mention/i);
    fireEvent.change(composer, { target: { value: 'Hi @El', selectionStart: 6 } });
    await screen.findByRole('option', { name: /Eli Editor/i });
    fireEvent.keyDown(composer, { key: 'Enter' });
    expect(composer).toHaveValue('Hi @Eli Editor');
    expect(api.createTaskComment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
    await waitFor(() => expect(api.createTaskComment).toHaveBeenCalledWith('token', 3, { body: 'Hi @Eli Editor', mentions: [{ userId: 'editor', start: 3, end: 14 }] }));
});
