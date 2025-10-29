/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

export const getApiBaseUrl = (): string => {
  // Prefer hostname-based auto-detection so local dev always points to localhost automatically
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const isLocal = (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    );
    if (isLocal) return `${protocol}//${host}:8000/api`;
    return 'https://api.nexuspaydefi.xyz/api';
  }

  // Server-side (build/runtime) fallback
  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  return isProd ? 'https://api.nexuspaydefi.xyz/api' : 'http://localhost:8000/api';
};

export const getApiBaseUrlWithoutPath = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const isLocal = (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    );
    if (isLocal) return `${protocol}//${host}:8000`;
    return 'https://api.nexuspaydefi.xyz';
  }

  const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  return isProd ? 'https://api.nexuspaydefi.xyz' : 'http://localhost:8000';
};

// Simple function for fetch calls
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrlWithoutPath();
  return `${baseUrl}${endpoint}`;
};

// Export constants for easy access
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  BASE_URL_WITHOUT_PATH: getApiBaseUrlWithoutPath(),
  PRODUCTION_URL: 'https://api.nexuspaydefi.xyz/api',
  DEVELOPMENT_URL: 'http://localhost:8000/api',
} as const;
