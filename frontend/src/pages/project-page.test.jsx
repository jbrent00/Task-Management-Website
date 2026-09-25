import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const projectApi = vi.hoisted(() => ({
    createProjectTag: vi.fn(),
    deleteProject: vi.fn(),
    deleteProjectTag: vi.fn(),
    inviteProjectMember: vi.fn(),
    removeProjectMember: vi.fn(),
    revokeProjectInvitation: vi.fn(),
    transferProjectOwnership: vi.fn(),
    updateProjectMember: vi.fn(),
}));
const aiApi = vi.hoisted(() => ({ generateTaskDraft: vi.fn() }));

vi.mock('../api/projects', () => ({
    archiveProject: vi.fn(), createProjectTag: projectApi.createProjectTag, deleteProject: projectApi.deleteProject, deleteProjectTag: projectApi.deleteProjectTag,
    getProject: vi.fn(), inviteProjectMember: projectApi.inviteProjectMember, removeProjectMember: projectApi.removeProjectMember,
    restoreProject: vi.fn(), revokeProjectInvitation: projectApi.revokeProjectInvitation, transferProjectOwnership: projectApi.transferProjectOwnership,
    updateProject: vi.fn(), updateProjectMember: projectApi.updateProjectMember,
}));
vi.mock('../api/aiGeneration', () => ({ AiGenerationError: class AiGenerationError extends Error {}, generateTaskDraft: aiApi.generateTaskDraft }));
vi.mock('../components/member-picker/member-picker', () => ({ default: () => <div>Member picker</div> }));
vi.mock('../components/checklist/checklist', () => ({ default: () => <div>Checklist</div> }));

import { CreateProjectTask, MembersPanel, ProjectTags, SettingsPanel } from './project-page';

const owner = { userId: 'owner', role: 'owner', user: { fname: 'Olivia', lname: 'Owner', primaryEmail: 'owner@example.test' } };
const editor = { userId: 'editor', role: 'editor', user: { fname: 'Eli', lname: 'Editor', primaryEmail: 'editor@example.test' } };
const project = { id: 2, title: 'Launch', role: 'owner', archivedAt: null, memberships: [owner, editor], invitations: [], tags: [{ id: 4, name: 'Urgent', color: 'red' }] };

beforeEach(() => {
    vi.clearAllMocks();
});

test('asks before replacing generated project-task content', async () => {
    aiApi.generateTaskDraft.mockResolvedValue({ kind: 'description', description: 'Generated copy' });
    render(<CreateProjectTask project={project} currentUserId="owner" tasks={[]} onCreate={() => {}} getToken={async () => 'token'} onError={() => {}} />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Write release notes' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Keep this draft' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }));
    expect(aiApi.generateTaskDraft).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText(/Description/)).toHaveValue('Keep this draft');

    fireEvent.click(screen.getByRole('button', { name: 'Generate with AI' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Replace and generate' }));
    await waitFor(() => expect(aiApi.generateTaskDraft).toHaveBeenCalledOnce());
    expect(screen.getByLabelText(/Description/)).toHaveValue('Generated copy');
});

test('confirms shared-tag deletion before mutating', async () => {
    projectApi.deleteProjectTag.mockResolvedValue(undefined);
    const onChanged = vi.fn();
    render(<ProjectTags project={project} getToken={async () => 'token'} onChanged={onChanged} onError={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Shared tags/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Urgent' }));
    expect(projectApi.deleteProjectTag).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete tag' }));
    await waitFor(() => expect(projectApi.deleteProjectTag).toHaveBeenCalledWith('token', 2, 4));
    expect(onChanged).toHaveBeenCalledOnce();
});

test('confirms ownership transfer and member removal before mutating', async () => {
    projectApi.transferProjectOwnership.mockResolvedValue(undefined);
    projectApi.removeProjectMember.mockResolvedValue(undefined);
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<MembersPanel project={project} currentUserId="owner" getToken={async () => 'token'} onChanged={onChanged} onError={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Make owner' }));
    expect(projectApi.transferProjectOwnership).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Transfer ownership' }));
    await waitFor(() => expect(projectApi.transferProjectOwnership).toHaveBeenCalledWith('token', 2, 'editor'));

    rerender(<MembersPanel project={project} currentUserId="owner" getToken={async () => 'token'} onChanged={onChanged} onError={() => {}} />);
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    fireEvent.click(removeButtons[0]);
    expect(projectApi.removeProjectMember).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove member' }));
    await waitFor(() => expect(projectApi.removeProjectMember).toHaveBeenCalledWith('token', 2, 'editor'));
});

test('requires the project name and a final confirmation before permanent deletion', async () => {
    projectApi.deleteProject.mockResolvedValue(undefined);
    const onDeleted = vi.fn();
    render(<SettingsPanel project={{ ...project, editorsCanCreateTasks: true, editorsCanAssignOthers: true, editorsCanEditAllTasks: true, editorsCanJoinTasks: true, editorsCanLeaveTasks: true }} getToken={async () => 'token'} onChanged={async () => {}} onError={() => {}} onNotify={() => {}} onDeleted={onDeleted} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete project' });
    expect(deleteButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Type project name to confirm deletion'), { target: { value: 'Launch' } });
    expect(deleteButton).toBeEnabled();
    fireEvent.click(deleteButton);
    expect(projectApi.deleteProject).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Permanently delete project?' })).getByRole('button', { name: 'Delete project' }));
    await waitFor(() => expect(projectApi.deleteProject).toHaveBeenCalledWith('token', 2, 'Launch'));
    expect(onDeleted).toHaveBeenCalledOnce();
});

test('keeps member administration owner-only', () => {
    render(<MembersPanel project={{ ...project, role: 'editor' }} currentUserId="editor" getToken={async () => 'token'} onChanged={async () => {}} onError={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Add in-app invitation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make owner' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();
});

test('shows read-only settings to editors and viewers', () => {
    render(<SettingsPanel project={{ ...project, role: 'viewer' }} getToken={async () => 'token'} onChanged={async () => {}} onError={() => {}} onNotify={() => {}} onDeleted={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Project settings' })).toBeInTheDocument();
    expect(screen.getByText('Only the project owner can change settings.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save settings' })).not.toBeInTheDocument();
});
