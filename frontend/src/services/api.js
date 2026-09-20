import { getLocalFallback } from './localDataFallback';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

/**
 * Universal Fetch API wrapper with automatic JWT Authorization and error handling
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('passpulse_token');

  const headers = {
    ...options.headers,
  };

  // If sending JSON body and headers don't already specify Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach JWT Bearer Token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);

    // Handle PDF or blob downloads
    if (options.responseType === 'blob') {
      if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
      return await res.blob();
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // Backend not mounted on this route (e.g. Firebase Hosting static serving index.html)
      return getLocalFallback(endpoint, options);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    console.warn(`[PassPulse API] ${endpoint}: ${error.message}. Serving local data fallback.`);
    return getLocalFallback(endpoint, options);
  }
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  downloadBlob: (endpoint) => request(endpoint, { responseType: 'blob' }),
  BASE_URL,
};

export default api;
