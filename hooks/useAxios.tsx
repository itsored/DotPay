import axios, { AxiosInstance } from "axios";
import { getApiBaseUrl } from "../lib/config";

const useAxios = () => {
  // Evaluate baseURL at runtime (client) to avoid SSR picking localhost in prod
  const $http: AxiosInstance = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add request interceptor to include auth token
  $http.interceptors.request.use(
    (config) => {
      // Always refresh baseURL per request to respect current origin
      config.baseURL = getApiBaseUrl();
      const token = localStorage.getItem('nexuspay_token') || localStorage.getItem('user');
      if (token) {
        try {
          // Handle both token formats for backward compatibility
          const parsedToken = token.startsWith('{') ? JSON.parse(token)?.data?.token || JSON.parse(token)?.token : token;
          if (parsedToken) {
            config.headers.Authorization = `Bearer ${parsedToken}`;
          }
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  $http.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('nexuspay_token');
        localStorage.removeItem('nexuspay_user');
        localStorage.removeItem('user');
        // Don't redirect here to avoid breaking the flow
      }
      // Network fallback to production when baseURL is localhost
      if (!error.response) {
        try {
          const originalRequest = error.config;
          const isLocalhost = (originalRequest?.baseURL || '').includes('localhost:8000');
          if (isLocalhost && !originalRequest._fallbackToProd) {
            originalRequest._fallbackToProd = true;
            const prodBase = 'https://api.nexuspaydefi.xyz/api';
            return axios({
              ...originalRequest,
              baseURL: prodBase,
            });
          }
        } catch {}
      }
      return Promise.reject(error);
    }
  );

  return $http;
};

export default useAxios;
