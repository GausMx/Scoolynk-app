// src/utils/authRefresh.js - NEW FILE (Create this in src/utils/)

import axios from 'axios';
import { getRefreshToken, setAccessToken, setUser, clearAuth } from '../components/utils/auth';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Automatically refresh access token using refresh token
 * @returns {Promise<boolean>} - Returns true if refresh successful, false otherwise
 */
export const autoRefreshToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.log('[AutoRefresh] No refresh token found');
    return false;
  }

  try {
    console.log('[AutoRefresh] Attempting to refresh token...');
    
    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
      token: refreshToken
    });

    const { accessToken, user } = response.data;

    // Update stored tokens and user
    setAccessToken(accessToken);
    setUser(user);

    console.log('[AutoRefresh] Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('[AutoRefresh] Token refresh failed:', error.response?.data?.message || error.message);
    
    // If refresh fails, clear auth and redirect to login
    clearAuth();
    return false;
  }
};

/**
 * Check if access token is expired or about to expire
 * @returns {boolean}
 */
export const isTokenExpiringSoon = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return true;

  try {
    // Decode JWT (manually parse the payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Return true if token expires in less than 5 minutes
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
    console.error('[TokenCheck] Error checking token expiration:', error);
    return true;
  }
};

/**
 * Setup automatic token refresh on interval
 */
export const setupAutoRefresh = () => {
  // Check token every 5 minutes
  const intervalId = setInterval(async () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (rememberMe && isTokenExpiringSoon()) {
      console.log('[AutoRefresh] Token expiring soon, refreshing...');
      await autoRefreshToken();
    }
  }, 5 * 60 * 1000); // Check every 5 minutes

  return () => clearInterval(intervalId);
};