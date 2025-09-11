import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getApiBaseUrl } from './config';

// API Configuration
const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const rawToken =
      localStorage.getItem('nexuspay_token') ||
      localStorage.getItem('user') ||
      localStorage.getItem('nexuspay_user');

    if (rawToken) {
      try {
        let tokenCandidate = rawToken;
        if (tokenCandidate.startsWith('{')) {
          const parsed = JSON.parse(tokenCandidate);
          tokenCandidate = parsed?.data?.token || parsed?.token || '';
        }

        // Strip surrounding quotes if present
        tokenCandidate = tokenCandidate.replace(/^"|"$/g, '');
        // Remove any existing Bearer prefix to avoid duplication
        tokenCandidate = tokenCandidate.replace(/^Bearer\s+/i, '');

        if (tokenCandidate) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${tokenCandidate}`;
          if (typeof config.url === 'string' && (config.url.includes('/mpesa/pay-with-crypto') || config.url.includes('/mpesa/crypto-to-mpesa'))) {
            console.log('[api] Authorization header set for mpesa request:', config.url);
            console.log('[api] Token being used:', tokenCandidate.substring(0, 20) + '...');
          }
        }
      } catch (error) {
        config.headers = config.headers || {};
        // As a last resort, attach raw token without duplicates/quotes
        const sanitized = rawToken.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');
        config.headers.Authorization = `Bearer ${sanitized}`;
        if (typeof config.url === 'string' && (config.url.includes('/mpesa/pay-with-crypto') || config.url.includes('/mpesa/crypto-to-mpesa'))) {
          console.log('[api] Fallback Authorization header set for mpesa request:', config.url);
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle 403 Forbidden errors (authentication issues)
    if (error.response?.status === 403) {
      console.error('403 Forbidden - Authentication issue:', error.config?.url);
      
      // Check if this is a transaction-related endpoint
      const isTransactionEndpoint = error.config?.url?.includes('/token/') || 
                                   error.config?.url?.includes('/mpesa/') ||
                                   error.config?.url?.includes('/business/');
      
      if (isTransactionEndpoint) {
        // For transaction endpoints, don't redirect automatically
        // Let the component handle the error and show appropriate message
        console.log('Authentication failed for transaction endpoint:', error.config?.url);
        return Promise.reject(error);
      }
      
      // For other endpoints, clean up and redirect to login
      localStorage.removeItem('nexuspay_token');
      localStorage.removeItem('nexuspay_user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 401) {
      // Check if this is a transaction-related endpoint that should show error instead of redirecting
      const isTransactionEndpoint = error.config?.url?.includes('/token/sendToken') || 
                                   error.config?.url?.includes('/token/pay') ||
                                   error.config?.url?.includes('/token/balance') ||
                                   error.config?.url?.includes('/token/receive') ||
                                   error.config?.url?.includes('/mpesa/') ||
                                   error.config?.url?.includes('/business/');
      
      if (isTransactionEndpoint) {
        // For transaction endpoints, don't redirect automatically
        // Let the component handle the error and show appropriate message
        console.log('Authentication failed for transaction endpoint:', error.config?.url);
        return Promise.reject(error);
      }
      
      // For other endpoints, clean up and redirect to login
      localStorage.removeItem('nexuspay_token');
      localStorage.removeItem('nexuspay_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { apiClient as api };