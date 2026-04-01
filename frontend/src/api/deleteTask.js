const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export const deleteTask = async (taskId) => {
    try {
        const urlToFetch = `${backendURL}/tasks/${taskId}`;
        const response = await fetch(urlToFetch, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.status}`);
        }

    } catch (error) {
        console.error('Error deleting task', error);
        throw error; // re-throw so caller can handle the error if needed
    }
};