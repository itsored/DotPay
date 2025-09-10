import axios, { AxiosInstance } from "axios";
import { getApiBaseUrl } from "../lib/config";

const baseURL = getApiBaseUrl();

const useAxios = () => {
  const $http: AxiosInstance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Add request interceptor to include auth token
  $http.interceptors.request.use(
    (config) => {
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
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('nexuspay_token');
        localStorage.removeItem('nexuspay_user');
        localStorage.removeItem('user');
        // Don't redirect here to avoid breaking the flow
      }
      return Promise.reject(error);
    }
  );

  return $http;
};

export default useAxios;
