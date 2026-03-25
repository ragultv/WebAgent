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

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers,
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

// Image upload and analysis functions
export const analyzeImage = async (imageFile) => {
  try {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', imageFile);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/analyze-image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Image Analysis Error:', error);
    throw error;
  }
};

export const generateCodeFromImage = async (description) => {
  try {
    const token = localStorage.getItem('access_token');

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/generate-website`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body;
  } catch (error) {
    console.error('Image Code Generation Error:', error);
    throw error;
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

// ─── Project Management (React Local Dev) ─────────────────────────

const projectHeaders = () => {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/** Scaffold + npm install a Vite React project (runs in parallel with AI) */
export const setupProject = async (prompt) => {
  const response = await fetch(`${API_URL}/project/setup`, {
    method: 'POST',
    headers: projectHeaders(),
    body: JSON.stringify({ prompt }),
  });
  return response.json();
};

/** Write AI files + start dev server with streaming progress (SSE) */
export const deployProject = async (projectName, files, port = 5174, onEvent) => {
  const response = await fetch(`${API_URL}/project/deploy`, {
    method: 'POST',
    headers: projectHeaders(),
    body: JSON.stringify({ project_name: projectName, files, port }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          if (onEvent) onEvent(event);
          if (event.type === 'done' || event.type === 'error') result = event;
        } catch { /* partial chunk */ }
      }
    }
  }

  return result || { type: 'error', message: 'No response received' };
};

/** Stop the currently running dev server */
export const stopDevServer = async () => {
  const response = await fetch(`${API_URL}/project/stop`, {
    method: 'POST',
    headers: projectHeaders(),
  });
  return response.json();
};

/** Get the file tree of a project */
export const getProjectFiles = async (projectName) => {
  const response = await fetch(`${API_URL}/project/files/${encodeURIComponent(projectName)}`, {
    headers: projectHeaders(),
  });
  return response.json();
};

/** Read a single file from a project */
export const readProjectFile = async (projectName, filePath) => {
  const response = await fetch(
    `${API_URL}/project/file/${encodeURIComponent(projectName)}?path=${encodeURIComponent(filePath)}`,
    { headers: projectHeaders() }
  );
  return response.json();
};

/** Write/update a single file in a project */
export const writeProjectFile = async (projectName, filePath, content) => {
  const response = await fetch(`${API_URL}/project/file/${encodeURIComponent(projectName)}`, {
    method: 'POST',
    headers: projectHeaders(),
    body: JSON.stringify({ path: filePath, content }),
  });
  return response.json();
};

/**
 * streamGenerate — the single-stream workhorse.
 *
 * Calls POST /api/project/stream-generate which:
 *   1. Streams from AI
 *   2. Parses FILE_START/FILE_END blocks as they arrive
 *   3. Writes each file to disk immediately on the backend
 *   4. Yields events back: analysis_partial | analysis | file | status | summary | done | error
 *
 * Usage:
 *   for await (const event of streamGenerate(projectName, prompt, srcFiles)) {
 *     if (event.type === 'file')    updateIDE(event.path, event.content);
 *     if (event.type === 'done')    setPort(event.port);
 *     if (event.type === 'error')   showError(event.message);
 *   }
 */
export async function* streamGenerate(projectName, prompt, srcFiles = [], port = 5174) {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/project/stream-generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ project_name: projectName, prompt, src_files: srcFiles, port }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    yield { type: 'error', message: err.error || `HTTP ${response.status}` };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE lines are separated by double-newline
    const parts = buffer.split('\n\n');
    buffer = parts.pop();           // keep incomplete last chunk

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        yield event;
        if (event.type === 'done' || event.type === 'error') return;
      } catch { /* partial / malformed chunk — ignore */ }
    }
  }
}
