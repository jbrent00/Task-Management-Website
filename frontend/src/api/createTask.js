const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export const createTask = async (token, title, description, userId, priority, dueDate) => {
    try {
        const urlToFetch = backendURL + "/tasks";
        const utcISOString = dueDate ? new Date(dueDate).toISOString() : null; // Convert to UTC ISO string if dueDate is provided

        const response = await fetch(urlToFetch, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                title,
                description,
                userId,
                priority,
                dueDate: utcISOString // can be null if not provided, backend should handle this case
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to create task: ${response.status}`);
        }

        const data = await response.json();
        return data;

    }
    catch (error) {
        console.error('Error creating task', error);
        throw error; // re-throw so caller can handle the error if needed
    }
} 