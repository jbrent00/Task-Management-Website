const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

async function request(token, path = '', options = {}) {
    const response = await fetch(`${backendURL}/notifications${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error ?? `Notification request failed: ${response.status}`);
    return data;
}

export const getNotifications = (token) => request(token, '?limit=20');
export const markNotificationsRead = (token, input) => request(token, '/read', { method: 'POST', body: JSON.stringify(input) });
