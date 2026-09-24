const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;
async function request(token, projectId, path = '', options = {}) {
    const response = await fetch(`${backendURL}/projects/${projectId}/tasks${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `Task request failed: ${response.status}`);
    return data;
}
export const getProjectTasks = (token, projectId) => request(token, projectId);
export const createProjectTask = (token, projectId, task) => request(token, projectId, '', { method: 'POST', body: JSON.stringify({ ...task, dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null }) });

async function taskParticipation(token, taskId, action) {
    const response = await fetch(`${backendURL}/tasks/${taskId}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `Could not ${action} task`);
    return data;
}

export const joinProjectTask = (token, taskId) => taskParticipation(token, taskId, 'join');
export const leaveProjectTask = (token, taskId) => taskParticipation(token, taskId, 'leave');

async function commentRequest(token, taskId, path = '', options = {}) {
    const response = await fetch(`${backendURL}/tasks/${taskId}/comments${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `Comment request failed: ${response.status}`);
    return data;
}
export const getTaskComments = (token, taskId, cursor = null) => commentRequest(token, taskId, `?limit=20${cursor ? `&cursor=${cursor}` : ''}`);
export const createTaskComment = (token, taskId, input) => commentRequest(token, taskId, '', { method: 'POST', body: JSON.stringify(input) });
export const updateTaskComment = (token, taskId, commentId, input) => commentRequest(token, taskId, `/${commentId}`, { method: 'PATCH', body: JSON.stringify(input) });
export const deleteTaskComment = (token, taskId, commentId) => commentRequest(token, taskId, `/${commentId}`, { method: 'DELETE' });
