// src/utils/api.js

import axios from 'axios';

// Create a new Axios instance with a base URL and CORS configuration
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://scoolynk-app.onrender.com',
  withCredentials: true, // CRITICAL: Allows cookies and credentials to be sent
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
  (error) => {
    // Log detailed error info for debugging
    if (error.response) {
      // Server responded with error status
      console.error('[API Error]', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else if (error.request) {
      // Request was made but no response received (CORS, network, etc.)
      console.error('[Network Error]', {
        message: error.message,
        url: error.config?.url,
      });
    } else {
      // Something else happened
      console.error('[Request Setup Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;