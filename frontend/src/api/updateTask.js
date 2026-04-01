const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export const updateTask = async (taskId, title, description, status, priority, dueDate) => {
    try {
        const urlToFetch = `${backendURL}/tasks/${taskId}`;

        // Convert dueDate to ISO string if it's not null, otherwise keep it as null
        const dueDateISO = dueDate ? new Date(dueDate).toISOString() : null;

        const response = await fetch(urlToFetch, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                status,
                priority,
                dueDate: dueDateISO
            })
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to update task: ${response.status}`);
        }

        const data = await response.json();
        console.log('Task updated successfully', data); // REMOVE LATER
        return data;
    } catch (error) {
        console.error('Error updating task', error);
        throw error; // re-throw so caller can handle the error if needed
    }
};