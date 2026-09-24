import { canChangeProjectTaskAssignments } from './projectAssignmentPolicy';

const project = { role: 'editor', archivedAt: null, editorsCanAssignOthers: false, editorsCanJoinTasks: true, editorsCanLeaveTasks: true };

test('separates self participation from changing teammates', () => {
    expect(canChangeProjectTaskAssignments(project, 'me', ['teammate'], ['teammate', 'me'])).toBe(true);
    expect(canChangeProjectTaskAssignments(project, 'me', ['teammate'], ['me'])).toBe(false);
    expect(canChangeProjectTaskAssignments({ ...project, editorsCanLeaveTasks: false }, 'me', ['me'], [])).toBe(false);
});

test('owners bypass assignment toggles while viewers and archived projects cannot mutate', () => {
    expect(canChangeProjectTaskAssignments({ ...project, role: 'owner' }, 'owner', [], ['teammate'])).toBe(true);
    expect(canChangeProjectTaskAssignments({ ...project, role: 'viewer' }, 'viewer', [], ['viewer'])).toBe(false);
    expect(canChangeProjectTaskAssignments({ ...project, archivedAt: new Date().toISOString() }, 'me', [], ['me'])).toBe(false);
});
