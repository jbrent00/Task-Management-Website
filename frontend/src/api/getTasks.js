const backendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export const getTasks = async (token) => {
  try {
  
    const urlToFetch = backendURL + "/tasks";
    
    const response = await fetch(urlToFetch, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }

    return response.json();
  } 
  catch (error) {
    console.error('Error fetching tasks', error);
    throw error;
  }
};

