const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;
async function request(token, path = '', options = {}) {
    const response = await fetch(`${backendURL}/projects${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `Project request failed: ${response.status}`);
    return data;
}
export const getProjects = (token) => request(token);
export const getProject = (token, id) => request(token, `/${id}`);
export const createProject = (token, title, description) => request(token, '', { method: 'POST', body: JSON.stringify({ title, description }) });
export const updateProject = (token, id, title, description) => request(token, `/${id}`, { method: 'PATCH', body: JSON.stringify({ title, description }) });
export const archiveProject = (token, id) => request(token, `/${id}/archive`, { method: 'POST' });
export const restoreProject = (token, id) => request(token, `/${id}/restore`, { method: 'POST' });
export const deleteProject = (token, id, confirmTitle) => request(token, `/${id}`, { method: 'DELETE', body: JSON.stringify({ confirmTitle }) });
export const inviteProjectMember = (token, id, email, role) => request(token, `/${id}/invitations`, { method: 'POST', body: JSON.stringify({ email, role }) });
export const revokeProjectInvitation = (token, id, invitationId) => request(token, `/${id}/invitations/${invitationId}`, { method: 'DELETE' });
export const updateProjectMember = (token, id, userId, role) => request(token, `/${id}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) });
export const removeProjectMember = (token, id, userId) => request(token, `/${id}/members/${userId}`, { method: 'DELETE' });
export const transferProjectOwnership = (token, id, userId) => request(token, `/${id}/transfer-ownership`, { method: 'POST', body: JSON.stringify({ userId }) });
export const createProjectTag = (token, id, name, color) => request(token, `/${id}/tags`, { method: 'POST', body: JSON.stringify({ name, color }) });
export const updateProjectTag = (token, id, tagId, name, color) => request(token, `/${id}/tags/${tagId}`, { method: 'PATCH', body: JSON.stringify({ name, color }) });
export const deleteProjectTag = (token, id, tagId) => request(token, `/${id}/tags/${tagId}`, { method: 'DELETE' });
