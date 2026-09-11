const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;
const request = async (token, path = '', options = {}) => {
    const response = await fetch(`${backendURL}/projects${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    if (!response.ok) throw new Error(`Project request failed: ${response.status}`);
    return response.status === 204 ? null : response.json();
};
export const getProjects = (token) => request(token);
export const createProject = (token, title, description) => request(token, '', { method: 'POST', body: JSON.stringify({ title, description }) });
export const updateProject = (token, id, title, description) => request(token, `/${id}`, { method: 'PUT', body: JSON.stringify({ title, description }) });
export const deleteProject = (token, id) => request(token, `/${id}`, { method: 'DELETE' });
