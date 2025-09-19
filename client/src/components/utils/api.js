// src/utils/api.js

import axios from 'axios';

// Create a new Axios instance with a base URL
const API = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL
  });

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

export default API;
