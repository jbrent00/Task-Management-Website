const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export const updateTasks = async (token, tasks) => {
    const response = await fetch(`${backendURL}/tasks/bulk-update`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tasks })
    });

    if (!response.ok) {
        throw new Error('Failed to update tasks');
    }

    return response.json();
};