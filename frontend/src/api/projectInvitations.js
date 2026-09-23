const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;
async function request(token, path = '', options = {}) {
    const response = await fetch(`${backendURL}/project-invitations${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `Invitation request failed: ${response.status}`);
    return data;
}
export const getMyInvitations = (token) => request(token);
export const acceptInvitation = (token, id) => request(token, `/${id}/accept`, { method: 'POST' });
export const declineInvitation = (token, id) => request(token, `/${id}/decline`, { method: 'POST' });
