// src/utils/api.js

import axios from 'axios';

// Create a new Axios instance with a base URL and CORS configuration
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://scoolynk-app.onrender.com',
  withCredentials: false, // CRITICAL: Allows cookies and credentials to be sent
  headers: {
    'Content-Type': 'application/json',
  },
});
// Temporary debug log
console.log('API baseURL configured as:', API.defaults.baseURL);
console.log('Environment variable:', process.env.REACT_APP_API_URL);
// Use an interceptor to attach the JWT token to every request
API.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response interceptor for better error handling
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