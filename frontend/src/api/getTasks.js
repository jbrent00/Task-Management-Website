const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export const getTasks = async () => {
  try {
    const urlToFetch = backendURL + "/tasks";
    const response = await fetch(urlToFetch);

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } 
  catch (error) {
    console.error('Error fetching tasks', error);
    throw error; // re-throw so caller can handle the error if needed
  }
};

