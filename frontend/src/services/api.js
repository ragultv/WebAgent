const API_URL = 'http://localhost:8000/api';

export const generateCode = async (options) => {
  try {
    const body = typeof options === 'string' ? { prompt: options } : options;
    
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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