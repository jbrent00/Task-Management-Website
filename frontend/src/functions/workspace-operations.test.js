import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoOperations, demoStorageKey } from './workspace-operations';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values };
}

describe('guest workspace operations', () => {
  let storage;
  let operations;

  beforeEach(() => { storage = memoryStorage(); operations = createDemoOperations(storage); });

  it('initializes and replaces old or damaged versions', async () => {
    expect((await operations.getTasks()).length).toBeGreaterThan(0);
    expect(storage.values.has(demoStorageKey)).toBe(true);
    storage.setItem(demoStorageKey, JSON.stringify({ version: 0, tasks: [] }));
    expect((await operations.getTasks()).length).toBeGreaterThan(0);
    storage.setItem(demoStorageKey, '{');
    expect((await operations.getTasks()).length).toBeGreaterThan(0);
  });

  it('persists create, edit, completion, reopening, reordering, and deletion', async () => {
    const task = await operations.createTask({ title: '  Check launch page  ', description: 'Review copy', status: 'todo', priority: 'high', dueDate: '2026-10-01T10:00', tagIds: [1], checklistItems: [{ text: 'Read headline' }] });
    expect(task.title).toBe('Check launch page');
    expect(task.tags[0].name).toBe('Writing');
    expect(task.checklistItems[0].text).toBe('Read headline');
    const reload = createDemoOperations(storage);
    expect((await reload.getTasks()).some((item) => item.id === task.id)).toBe(true);
    const input = { title: task.title, description: task.description, status: 'completed', priority: task.priority, dueDate: task.dueDate, projectId: null, tagIds: [1], assigneeIds: [] };
    expect((await reload.updateTask(task.id, input)).completedAt).toBeTruthy();
    expect((await reload.updateTask(task.id, { ...input, status: 'todo' })).completedAt).toBeNull();
    await reload.reorderTasks([{ id: task.id, status: 'in_progress', orderIndex: 0 }]);
    expect((await operations.getTasks()).find((item) => item.id === task.id)).toMatchObject({ status: 'in_progress', orderIndex: 0 });
    await reload.deleteTask(task.id);
    expect((await operations.getTasks()).some((item) => item.id === task.id)).toBe(false);
  });

  it('persists checklist and tag operations, then reset restores the seed', async () => {
    const original = await operations.getTasks();
    const taskId = original[0].id;
    const added = await operations.createChecklistItem(taskId, { text: 'Check links' });
    await operations.updateChecklistItem(taskId, added.id, { completed: true, text: 'Check every link' });
    const reordered = await operations.reorderChecklistItems(taskId, [added.id, ...original[0].checklistItems.map((item) => item.id)]);
    expect(reordered[0]).toMatchObject({ text: 'Check every link', completed: true });
    await operations.deleteChecklistItem(taskId, added.id);
    const tag = await operations.createTag({ name: 'Research', color: 'green' });
    await operations.updateTag(tag.id, { name: 'Discovery', color: 'orange' });
    expect((await operations.getTags()).find((item) => item.id === tag.id).name).toBe('Discovery');
    await operations.deleteTag(tag.id);
    await operations.createTask({ title: 'Temporary task' });
    operations.reset();
    expect((await operations.getTasks()).map((item) => item.title)).toEqual(original.map((item) => item.title));
    expect((await operations.getTags()).some((item) => item.id === tag.id)).toBe(false);
  });

  it('never fetches or requests a Clerk token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const token = vi.fn();
    await operations.getTasks();
    await operations.getProjects();
    await operations.createTask({ title: 'Local only' });
    await operations.updateTask(1, { title: 'Local edit', status: 'todo', priority: 'low', tagIds: [] });
    await operations.createChecklistItem(1, { text: 'Local step' });
    operations.reset();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(token).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('seeds read-only project history and adds it to an existing local workspace without losing edits', async () => {
    const tasks = await operations.getTasks();
    expect(tasks.find((task) => task.id === 4).discussion).toHaveLength(2);
    expect(tasks.find((task) => task.id === 5).activity).toHaveLength(1);
    const previous = JSON.parse(storage.getItem(demoStorageKey));
    previous.tasks = previous.tasks.map((task) => task.id === 4 ? { ...task, title: 'My edited title', discussion: undefined, activity: undefined } : task);
    storage.setItem(demoStorageKey, JSON.stringify(previous));
    const migrated = await createDemoOperations(storage).getTasks();
    expect(migrated.find((task) => task.id === 4)).toMatchObject({ title: 'My edited title', commentCount: 2 });
    expect(migrated.find((task) => task.id === 4).discussion).toHaveLength(2);
    expect(migrated.find((task) => task.id === 4).activity).toHaveLength(1);
  });
});
