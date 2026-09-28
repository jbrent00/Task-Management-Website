import { createTask } from '../api/createTask';
import { updateTask } from '../api/updateTask';
import { deleteTask } from '../api/deleteTask';
import { updateTasks } from '../api/updateTasks';
import { getTasks } from '../api/getTasks';
import { getProjects, getProject } from '../api/projects';
import { getTags, createTag, updateTag, deleteTag } from '../api/tags';
import { createChecklistItem, updateChecklistItem, deleteChecklistItem, reorderChecklistItems } from '../api/checklistItems';

export const demoStorageKey = 'flowboard:demo-workspace:v1';
const now = () => new Date().toISOString();
const daysFromToday = (days) => { const date = new Date(); date.setDate(date.getDate() + days); date.setHours(17, 0, 0, 0); return date.toISOString(); };
const editable = { canEdit: true, canDelete: true, canReorder: true, canJoin: false, canLeave: false };

export function createDemoSeed() {
  const tags = [{ id: 1, name: 'Writing', color: 'orange' }, { id: 2, name: 'Design', color: 'blue' }, { id: 3, name: 'Planning', color: 'green' }];
  const members = [
    { id: 'demo-you', userId: 'demo-you', role: 'owner', user: { id: 'demo-you', fname: 'You', lname: '', primaryEmail: 'you@example.com' } },
    { id: 'demo-maya', userId: 'demo-maya', role: 'editor', user: { id: 'demo-maya', fname: 'Maya', lname: 'Chen', primaryEmail: 'maya@example.com' } },
    { id: 'demo-eli', userId: 'demo-eli', role: 'editor', user: { id: 'demo-eli', fname: 'Eli', lname: 'Rivera', primaryEmail: 'eli@example.com' } },
  ];
  const project = { id: 1, title: 'Northline launch', description: 'Coordinate the final details for a small team launch.', role: 'owner', memberships: members, members: members.map((member) => member.user), tags: [tags[1], tags[2]], capabilities: { canEditTasks: true, canCreateTasks: true }, createdAt: now(), lastActivityAt: now() };
  const sampleHistory = {
    4: { discussion: [{ id: 'sample-4-a', author: 'Maya Chen', body: 'I have the owners confirmed. I’ll check the remaining links before the handoff.', createdAt: daysFromToday(-2) }, { id: 'sample-4-b', author: 'Eli Rivera', body: 'The launch checklist is ready for one final pass.', createdAt: daysFromToday(-1) }], activity: [{ id: 'sample-4-event', actor: 'Maya Chen', text: 'moved this task to To do for the final review', createdAt: daysFromToday(-1) }] },
    5: { discussion: [{ id: 'sample-5-a', author: 'Eli Rivera', body: 'I’ve outlined the walkthrough. The product story is the main focus.', createdAt: daysFromToday(-2) }], activity: [{ id: 'sample-5-event', actor: 'Eli Rivera', text: 'started the product walkthrough', createdAt: daysFromToday(-2) }] },
    6: { discussion: [{ id: 'sample-6-a', author: 'Maya Chen', body: 'We’re aligned on the release scope. The remaining ideas can follow later.', createdAt: daysFromToday(-3) }], activity: [{ id: 'sample-6-event', actor: 'You', text: 'completed this task', createdAt: daysFromToday(-2) }] },
  };
  const makeTask = (id, title, status, priority, dueDays, projectId, tagIds, checklist) => ({ id, title, description: projectId ? 'Keep the team aligned on the next step.' : 'A small, clear step for the week.', status, priority, dueDate: dueDays === null ? null : daysFromToday(dueDays), orderIndex: id, projectId, project: projectId ? { id: 1, title: project.title } : null, tags: tags.filter((tag) => tagIds.includes(tag.id)), checklistItems: checklist.map((text, index) => ({ id: id * 100 + index, text, completed: index === 0 })), assignees: projectId ? [members[id % members.length].user] : [], commentCount: sampleHistory[id]?.discussion.length ?? 0, discussion: sampleHistory[id]?.discussion ?? [], activity: sampleHistory[id]?.activity ?? [], capabilities: editable, createdAt: now(), completedAt: status === 'completed' ? now() : null });
  return { version: 1, nextId: 20, tags, projects: [project], tasks: [
    makeTask(1, 'Outline the week ahead', 'todo', 'medium', 2, null, [3], ['List the priorities', 'Block focus time']),
    makeTask(2, 'Draft launch update', 'in_progress', 'high', 1, null, [1], ['Write the first pass', 'Review the details']),
    makeTask(3, 'Review design notes', 'completed', 'low', null, null, [2], ['Collect feedback']),
    makeTask(4, 'Finalize launch checklist', 'todo', 'high', 3, 1, [2, 3], ['Confirm owners', 'Check links']),
    makeTask(5, 'Prepare product walkthrough', 'in_progress', 'medium', 5, 1, [2], ['Outline the story', 'Review with the team']),
    makeTask(6, 'Agree on release scope', 'completed', 'medium', null, 1, [3], ['Review outstanding work']),
  ] };
}

export function createDemoOperations(storage = window.localStorage) {
  const save = (value) => { storage.setItem(demoStorageKey, JSON.stringify(value)); return value; };
  const read = () => {
    try {
      const value = JSON.parse(storage.getItem(demoStorageKey));
      if (value?.version === 1 && Array.isArray(value.tasks) && Array.isArray(value.projects) && Array.isArray(value.tags)) {
        if (value.tasks.some((task) => task.projectId && (!Array.isArray(task.discussion) || !Array.isArray(task.activity) || task.commentCount !== task.discussion.length))) {
          const seed = createDemoSeed();
          value.tasks = value.tasks.map((task) => {
            const discussion = task.discussion ?? seed.tasks.find((item) => item.id === task.id)?.discussion ?? [];
            return { ...task, discussion, activity: task.activity ?? seed.tasks.find((item) => item.id === task.id)?.activity ?? [], commentCount: discussion.length };
          });
          return save(value);
        }
        return value;
      }
    } catch { /* Replace corrupt demo data with a fresh seed. */ }
    return save(createDemoSeed());
  };
  const mutate = (change) => { const state = structuredClone(read()); const result = change(state); save(state); return result; };
  const findTask = (state, id) => { const task = state.tasks.find((item) => item.id === Number(id)); if (!task) throw new Error('Task not found.'); return task; };
  const decorate = (state, task) => ({ ...task, tags: state.tags.filter((tag) => (task.tags ?? []).some((selected) => selected.id === tag.id)), project: state.projects.find((project) => project.id === task.projectId) ?? null });
  return {
    mode: 'demo', userId: 'demo-you',
    getTasks: async () => read().tasks,
    getProjects: async () => read().projects,
    getProject: async (id) => read().projects.find((project) => project.id === Number(id)) ?? null,
    getTags: async () => read().tags,
    createTask: async (input) => mutate((state) => { const task = { id: state.nextId++, title: input.title.trim(), description: input.description ?? '', status: input.status ?? 'todo', priority: input.priority ?? 'low', dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null, orderIndex: input.orderIndex ?? state.tasks.length, projectId: input.projectId ?? null, tags: state.tags.filter((tag) => input.tagIds?.includes(tag.id)), checklistItems: (input.checklistItems ?? []).map((item) => ({ id: state.nextId++, text: item.text, completed: Boolean(item.completed) })), assignees: [], discussion: [], activity: [], commentCount: 0, capabilities: editable, createdAt: now(), completedAt: input.status === 'completed' ? now() : null }; const saved = decorate(state, task); state.tasks.push(saved); return saved; }),
    updateTask: async (id, input) => mutate((state) => { const task = findTask(state, id); Object.assign(task, { ...input, dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null, tags: state.tags.filter((tag) => input.tagIds?.includes(tag.id)), assignees: input.assigneeIds ? state.projects.flatMap((project) => project.memberships).filter((member) => input.assigneeIds.includes(member.userId)).map((member) => member.user) : task.assignees, completedAt: input.status === 'completed' ? task.completedAt ?? now() : null }); return decorate(state, task); }),
    deleteTask: async (id) => mutate((state) => { state.tasks = state.tasks.filter((task) => task.id !== Number(id)); }),
    reorderTasks: async (updates) => mutate((state) => { for (const update of updates) Object.assign(findTask(state, update.id), { status: update.status, orderIndex: update.orderIndex, completedAt: update.status === 'completed' ? now() : null }); return state.tasks; }),
    createTag: async ({ name, color }) => mutate((state) => { if (state.tags.some((tag) => tag.name.toLowerCase() === name.trim().toLowerCase())) throw new Error('Tag already exists.'); const tag = { id: state.nextId++, name: name.trim(), color }; state.tags.push(tag); return tag; }),
    updateTag: async (id, input) => mutate((state) => { const tag = state.tags.find((item) => item.id === id); Object.assign(tag, input); for (const task of state.tasks) task.tags = task.tags.map((item) => item.id === id ? tag : item); return tag; }),
    deleteTag: async (id) => mutate((state) => { state.tags = state.tags.filter((tag) => tag.id !== id); for (const task of state.tasks) task.tags = task.tags.filter((tag) => tag.id !== id); }),
    createChecklistItem: async (taskId, { text }) => mutate((state) => { const task = findTask(state, taskId); const item = { id: state.nextId++, text: text.trim(), completed: false }; task.checklistItems.push(item); return item; }),
    updateChecklistItem: async (taskId, itemId, input) => mutate((state) => { const item = findTask(state, taskId).checklistItems.find((entry) => entry.id === itemId); Object.assign(item, input); return item; }),
    deleteChecklistItem: async (taskId, itemId) => mutate((state) => { const task = findTask(state, taskId); task.checklistItems = task.checklistItems.filter((item) => item.id !== itemId); }),
    reorderChecklistItems: async (taskId, ids) => mutate((state) => { const task = findTask(state, taskId); task.checklistItems = ids.map((id) => task.checklistItems.find((item) => item.id === id)); return task.checklistItems; }),
    reset: () => save(createDemoSeed()),
  };
}

export function createAuthenticatedOperations(getToken, userId) {
  const call = async (fn, ...args) => fn(await getToken(), ...args);
  return { mode: 'authenticated', userId, getToken,
    getTasks: () => call(getTasks), getProjects: () => call(getProjects), getProject: (id) => call(getProject, id), getTags: () => call(getTags),
    createTask: (input) => call(createTask, input.title, input.description, input.priority, input.dueDate, input.orderIndex, input.projectId, input.tagIds, input.checklistItems, input.status),
    updateTask: (id, input) => call(updateTask, id, input.title, input.description, input.status, input.priority, input.dueDate, input.projectId, input.tagIds, input.assigneeIds),
    deleteTask: (id) => call(deleteTask, id), reorderTasks: (updates) => call(updateTasks, updates),
    createTag: (input) => call(createTag, input.name, input.color), updateTag: (id, input) => call(updateTag, id, input.name, input.color), deleteTag: (id) => call(deleteTag, id),
    createChecklistItem: (id, input) => call(createChecklistItem, id, input.text), updateChecklistItem: (id, itemId, input) => call(updateChecklistItem, id, itemId, input), deleteChecklistItem: (id, itemId) => call(deleteChecklistItem, id, itemId), reorderChecklistItems: (id, ids) => call(reorderChecklistItems, id, ids),
  };
}
