const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export const createTask = async (title, description, userId, priority, dueDate) => {
    try {
        const urlToFetch = backendURL + "/tasks";
        const response = await fetch(urlToFetch, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                userId,
                priority,
                dueDate // can be null if not provided, backend should handle this case
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