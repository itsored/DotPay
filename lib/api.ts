import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getApiBaseUrl } from './config';

// API Configuration
// Note: Do not cache base URL at module scope; it can differ between SSR and client

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced token retrieval function
const getAuthToken = (): string | null => {
  // Try multiple storage keys and storage types
  const storageKeys = ['nexuspay_token', 'user', 'nexuspay_user'];
  const storageTypes = [localStorage, sessionStorage];

  for (const storage of storageTypes) {
    for (const key of storageKeys) {
      try {
        const value = storage.getItem(key);
        if (value && value.trim()) {
          return value.trim();
        }
      } catch (error) {
        // Storage might be disabled, continue to next option
        console.warn('[auth] Storage access error:', error);
      }
    }
  }

  return null;
};

// Enhanced token processing function
const processToken = (rawToken: string): string | null => {
  if (!rawToken || typeof rawToken !== 'string') {
    return null;
  }

  try {
    let token = rawToken.trim();

    // Handle JSON format
    if (token.startsWith('{')) {
      const parsed = JSON.parse(token);
      token = parsed?.data?.token || parsed?.token || '';
    }

    // Clean up the token
    token = token.replace(/^"|"$/g, ''); // Remove surrounding quotes
    token = token.replace(/^Bearer\s+/i, ''); // Remove Bearer prefix
    token = token.trim();

    // Validate token format (basic JWT check)
    if (token && token.split('.').length === 3) {
      return token;
    }

    return null;
  } catch (error) {
    console.warn('[auth] Token processing error:', error);
    return null;
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Always set baseURL at request time to reflect current environment (SSR vs client)
    config.baseURL = getApiBaseUrl();
    // Get token from storage
    const rawToken = getAuthToken();

    if (rawToken) {
      const processedToken = processToken(rawToken);

      if (processedToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${processedToken}`;

        // Enhanced logging for critical endpoints
        if (typeof config.url === 'string' &&
            (config.url.includes('/mpesa/') ||
             config.url.includes('/token/') ||
             config.url.includes('/business/'))) {
          console.log('[auth] ✅ Auth header set for:', config.url);
          console.log('[auth] Token preview:', processedToken.substring(0, 20) + '...');
        }
      } else {
        console.warn('[auth] ⚠️ Token found but invalid format');
      }
    } else {
      // Only log for critical endpoints when no token found
      if (typeof config.url === 'string' &&
          (config.url.includes('/mpesa/') ||
           config.url.includes('/token/') ||
           config.url.includes('/business/'))) {
        console.warn('[auth] ❌ No auth token found for:', config.url);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh mechanism
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    // Try to refresh token or re-authenticate
    console.log('[auth] Attempting token refresh...');

    // Check if there's a refresh token
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

    if (refreshToken) {
      // Attempt to refresh token
      const response = await apiClient.post('/auth/refresh', { refreshToken });

      if (response.data?.success && response.data?.data?.token) {
        const newToken = response.data.data.token;
        localStorage.setItem('nexuspay_token', newToken);
        console.log('[auth] ✅ Token refreshed successfully');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[auth] ❌ Token refresh failed:', error);
    return false;
  }
};

// Enhanced response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error(`[auth] ${error.response.status} error:`, error.config?.url);

      // Check if this is a transaction-related endpoint
      const isTransactionEndpoint = error.config?.url?.includes('/mpesa/') ||
                                   error.config?.url?.includes('/token/') ||
                                   error.config?.url?.includes('/business/');

      if (isTransactionEndpoint && !originalRequest._retry) {
        // Try to refresh token once for transaction endpoints
        originalRequest._retry = true;

        const refreshSuccess = await refreshAuthToken();
        if (refreshSuccess) {
          // Retry the original request with new token
          return apiClient(originalRequest);
        }

        // If refresh failed, let the component handle the error
        console.warn('[auth] Token refresh failed, letting component handle error');
        return Promise.reject(error);
      }

      // For non-transaction endpoints or failed refresh, redirect to login
      console.warn('[auth] Authentication failed, redirecting to login');

      // Clear all auth data
      const storageKeys = ['nexuspay_token', 'user', 'nexuspay_user', 'refresh_token'];
      const storageTypes = [localStorage, sessionStorage];

      storageKeys.forEach(key => {
        storageTypes.forEach(storage => {
          try {
            storage.removeItem(key);
          } catch (e) {
            // Ignore storage errors
          }
        });
      });

      // Redirect to login if in browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    // Handle network errors with automatic fallback to production API when on localhost
    if (!error.response) {
      console.error('[api] Network error:', error.message);
      try {
        const currentBase = originalRequest?.baseURL || apiClient.defaults.baseURL;
        const isLocalhost = typeof currentBase === 'string' && currentBase.includes('localhost:8000');
        const notRetried = !originalRequest?._fallbackToProd;
        if (isLocalhost && notRetried) {
          originalRequest._fallbackToProd = true;
          const prodBase = 'https://api.nexuspaydefi.xyz/api';
          console.warn('[api] Falling back to production API for this request:', originalRequest.url);
          return axios({
            ...originalRequest,
            baseURL: prodBase,
          });
        }
      } catch (e) {
        // proceed to reject
      }
    }

    // Handle 500 errors with better logging
    if (error.response?.status === 500) {
      console.error('[api] 500 Server Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }

    return Promise.reject(error);
  }
);

// Authentication utility functions
export const authUtils = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },

  // Get current token
  getToken: (): string | null => {
    const rawToken = getAuthToken();
    return rawToken ? processToken(rawToken) : null;
  },

  // Clear all authentication data
  clearAuth: (): void => {
    const storageKeys = ['nexuspay_token', 'user', 'nexuspay_user', 'refresh_token'];
    const storageTypes = [localStorage, sessionStorage];

    storageKeys.forEach(key => {
      storageTypes.forEach(storage => {
        try {
          storage.removeItem(key);
        } catch (e) {
          // Ignore storage errors
        }
      });
    });
  },

  // Store authentication data
  setAuth: (token: string, userData?: any): void => {
    try {
      localStorage.setItem('nexuspay_token', token);
      if (userData) {
        localStorage.setItem('nexuspay_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.warn('[auth] Failed to store auth data:', error);
    }
  },

  // Validate token format
  isValidToken: (token: string): boolean => {
    if (!token || typeof token !== 'string') return false;

    try {
      // Basic JWT validation (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Try to decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.warn('[auth] Token expired');
        return false;
      }

      return true;
    } catch (error) {
      console.warn('[auth] Token validation error:', error);
      return false;
    }
  },

  // Ensure user is authenticated before making critical requests
  ensureAuthenticated: (): Promise<boolean> => {
    return new Promise((resolve) => {
      const token = authUtils.getToken();
      if (token && authUtils.isValidToken(token)) {
        resolve(true);
      } else {
        console.warn('[auth] User not properly authenticated');
        // Clear invalid tokens
        authUtils.clearAuth();

        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        resolve(false);
      }
    });
  }
};

export default apiClient;
export { apiClient as api };