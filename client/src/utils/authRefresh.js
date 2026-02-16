// src/utils/authRefresh.js - IMPROVED ERROR HANDLING

import axios from 'axios';
import { getRefreshToken, setAccessToken, setUser, clearAuth } from '../components/utils/auth';

const API_URL = process.env.REACT_APP_API_URL;

export const autoRefreshToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.log('[AutoRefresh] No refresh token found');
    return false;
  }

  try {
    console.log('[AutoRefresh] Attempting to refresh token...');
    console.log('[AutoRefresh] Refresh token:', refreshToken.substring(0, 20) + '...');
    
    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
      token: refreshToken
    });

    console.log('[AutoRefresh] Refresh response received');

    const { accessToken, user } = response.data;

    if (!accessToken) {
      console.error('[AutoRefresh] No access token in response');
      return false;
    }

    // Update stored tokens and user
    setAccessToken(accessToken);
    if (user) {
      setUser(user);
      console.log('[AutoRefresh] User data updated:', user.email);
    }

    console.log('[AutoRefresh] Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('[AutoRefresh] Token refresh failed:', {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      hasRefreshToken: !!refreshToken
    });
    
    // ✅ DON'T clear auth here - let ProtectedRoute handle it
    // This prevents premature logout
    return false;
  }
};

export const isTokenExpiringSoon = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.log('[TokenCheck] No token found');
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    const expiringSoon = timeUntilExpiry < 5 * 60 * 1000;
    
    console.log('[TokenCheck]', {
      expiresIn: Math.round(timeUntilExpiry / 1000 / 60) + ' minutes',
      expiringSoon
    });

    return expiringSoon;
  } catch (error) {
    console.error('[TokenCheck] Error checking token expiration:', error);
    return true;
  }
};

export const setupAutoRefresh = () => {
  console.log('[SetupAutoRefresh] Starting automatic token refresh check (every 5 minutes)');
  
  const intervalId = setInterval(async () => {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    console.log('[AutoRefresh Interval] Checking token...', { rememberMe });
    
    if (rememberMe && isTokenExpiringSoon()) {
      console.log('[AutoRefresh Interval] Token expiring soon, refreshing...');
      await autoRefreshToken();
    }
  }, 5 * 60 * 1000);

  return () => {
    console.log('[SetupAutoRefresh] Cleaning up auto-refresh interval');
    clearInterval(intervalId);
  };
};