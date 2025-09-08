/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

export const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Fallback to environment-based URLs
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.nexuspaydefi.xyz/api';
  }
  
  return 'http://localhost:8000/api';
};

export const getApiBaseUrlWithoutPath = (): string => {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '');
  }
  
  // Fallback to environment-based URLs
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.nexuspaydefi.xyz';
  }
  
  return 'http://localhost:8000';
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
