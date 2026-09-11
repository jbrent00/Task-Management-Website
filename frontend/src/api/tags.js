const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;
const request = async (token, path = '', options = {}) => {
    const response = await fetch(`${backendURL}/tags${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    if (!response.ok) throw new Error(`Tag request failed: ${response.status}`);
    return response.status === 204 ? null : response.json();
};
export const getTags = (token) => request(token);
export const createTag = (token, name, color) => request(token, '', { method: 'POST', body: JSON.stringify({ name, color }) });
export const updateTag = (token, id, name, color) => request(token, `/${id}`, { method: 'PUT', body: JSON.stringify({ name, color }) });
export const deleteTag = (token, id) => request(token, `/${id}`, { method: 'DELETE' });
