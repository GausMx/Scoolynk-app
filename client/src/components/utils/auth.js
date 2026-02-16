// src/components/utils/auth.js - KEEP AS IS, JUST ADD THESE EXPORTS

// ----------------------
// Local Storage Helpers
// ----------------------
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAccessToken = () => localStorage.getItem('accessToken');
export const setAccessToken = (token) => localStorage.setItem('accessToken', token);

export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token) => localStorage.setItem('refreshToken', token);

export const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('rememberMe'); // ✅ NEW: Also clear rememberMe flag
};

// ----------------------
// Redirect Helper
// ----------------------
export const redirectByRole = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    case 'parent':
      return '/parent';
    default:
      return '/';
  }
};

// ----------------------
// ✅ UPDATED: Fetch Wrapper w/ Auto Refresh (Enhanced)
// ----------------------
export const fetchWithAuth = async (url, options = {}) => {
  let token = getAccessToken();
  const refreshToken = getRefreshToken();
  const rememberMe = localStorage.getItem('rememberMe') === 'true';

  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = `Bearer ${token}`;
  options.headers['Content-Type'] = 'application/json';

  let res = await fetch(url, options);

  // If access token expired
  if (res.status === 401 && refreshToken && rememberMe) {
    console.log('[FetchWithAuth] Token expired, attempting refresh...');
    
    const refreshRes = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      token = data.accessToken;
      setAccessToken(token);
      
      if (data.user) {
        setUser(data.user);
      }

      console.log('[FetchWithAuth] Token refreshed, retrying request...');

      // Retry original request
      options.headers['Authorization'] = `Bearer ${token}`;
      res = await fetch(url, options);
    } else {
      // Refresh failed → logout
      console.log('[FetchWithAuth] Refresh failed, clearing auth...');
      clearAuth();
      window.location.href = '/login';
      return;
    }
  } else if (res.status === 401) {
    // 401 but no refresh token or rememberMe disabled
    console.log('[FetchWithAuth] Unauthorized, clearing auth...');
    clearAuth();
    window.location.href = '/login';
    return;
  }

  return res;
};