const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;
async function request(token, projectId, path = '', options = {}) {
    const response = await fetch(`${backendURL}/projects/${projectId}/tasks${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `Task request failed: ${response.status}`);
    return data;
}
export const getProjectTasks = (token, projectId) => request(token, projectId);
export const createProjectTask = (token, projectId, task) => request(token, projectId, '', { method: 'POST', body: JSON.stringify({ ...task, dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null }) });
