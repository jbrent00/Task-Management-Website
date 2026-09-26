import { defaultTaskView, getVisibleTasksByStatus } from './taskViews';

const task = (id, projectId, orderIndex, title) => ({ id, projectId, orderIndex, title, status: 'todo', priority: 'low', tags: [], description: '' });

test('shows project tasks before personal tasks without mixing their independent manual positions', () => {
    const tasks = [task(1, null, 0, 'Personal first'), task(2, 20, 1, 'Second project task'), task(3, 20, 0, 'First project task'), task(4, null, 1, 'Personal second'), task(5, 10, 2, 'Other project')];
    const visible = getVisibleTasksByStatus(tasks, defaultTaskView, '');
    expect(visible.todo.map(({ id }) => id)).toEqual([5, 3, 2, 1, 4]);
});

test('retains project-first grouping inside an automatic sort', () => {
    const view = { ...defaultTaskView, sorts: { ...defaultTaskView.sorts, all: 'title' } };
    const visible = getVisibleTasksByStatus([task(1, null, 0, 'A personal task'), task(2, 20, 1, 'Z project task')], view, '');
    expect(visible.todo.map(({ id }) => id)).toEqual([2, 1]);
});
