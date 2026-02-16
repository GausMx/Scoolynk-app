import axios from 'axios';
import { getAccessToken, setAccessToken, clearAuth } from './auth'; // ✅ Import from same folder
import { autoRefreshToken } from '../../utils/authRefresh'; // ✅ Import from utils folder

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Request interceptor - Add token to headers
API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - Auto-refresh on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.error('[API Error]', {
      data: error.response?.data,
      status: error.response?.status,
      url: originalRequest?.url
    });

    // ✅ If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      if (rememberMe) {
        console.log('[API] Token expired, attempting auto-refresh...');
        const refreshed = await autoRefreshToken();
        
        if (refreshed) {
          // Retry the original request with new token
          const newToken = getAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      }
      
      // If refresh failed or rememberMe is false, redirect to login
      console.log('[API] Auto-refresh failed, redirecting to login...');
      clearAuth();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default API;