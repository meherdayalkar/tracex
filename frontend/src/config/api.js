/**
 * Centralized API Client Configuration
 * Supports local development (Vite proxy) and production (Vercel -> Render)
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/**
 * Returns a fully-qualified or root-relative URL for any API or asset endpoint.
 * - In local dev (when VITE_API_URL is empty): returns '/api/...' to use the local Vite proxy.
 * - In production: prefixes with VITE_API_URL (e.g. 'https://tracex-backend.onrender.com/api/...').
 */
export const apiUrl = (path = '') => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
