const API_URL = 'http://localhost:8000/api';

// Authentication API calls
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await fetch(`${API_URL}/users/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Token Refresh Error:', error);
    throw error;
  }
};

export const getCurrentUser = async (token) => {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Get User Error:', error);
    throw error;
  }
};

export const generateCode = async (options) => {
  try {
    const body = typeof options === 'string' ? { prompt: options } : options;
    const token = localStorage.getItem('access_token'); // Retrieve the access token

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


export const getDesignStyles = async () => {
  try {
    const response = await fetch(`${API_URL}/design-styles`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { styles: {}, default: 'v0-modern' };
  }
};

export const getSiteTypes = async () => {
  try {
    const response = await fetch(`${API_URL}/site-types`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { types: [], default: 'landing' };
  }
};

export const generateComponent = async (componentData) => {
  try {
    const response = await fetch(`${API_URL}/generate-component`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(componentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getTemplates = async () => {
  try {
    const response = await fetch(`${API_URL}/templates`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { templates: [] };
  }
};

export const updateApiKey = async ({ new_api_key, current_password }) => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return { success: false, error: 'No access token found. Please log in.' };
    }

    const response = await fetch(`${API_URL}/users/update-api-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ new_api_key, current_password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('API Key Update Error:', error);
    return { success: false, error: error.message };
  }
};