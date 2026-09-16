const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

async function request(token, path, method, body) {
    const response = await fetch(`${backendURL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new Error(`Checklist request failed: ${response.status}`);
    return response.status === 204 ? null : response.json();
}

export const createChecklistItem = (token, taskId, text) => request(token, `/tasks/${taskId}/checklist-items`, 'POST', { text });
export const updateChecklistItem = (token, taskId, itemId, changes) => request(token, `/tasks/${taskId}/checklist-items/${itemId}`, 'PATCH', changes);
export const deleteChecklistItem = (token, taskId, itemId) => request(token, `/tasks/${taskId}/checklist-items/${itemId}`, 'DELETE');
export const reorderChecklistItems = (token, taskId, itemIds) => request(token, `/tasks/${taskId}/checklist-items/order`, 'PUT', { itemIds });
