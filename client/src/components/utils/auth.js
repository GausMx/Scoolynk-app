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
    default:
      return '/';
  }
};

// ----------------------
// Fetch Wrapper w/ Auto Refresh
// ----------------------
export const fetchWithAuth = async (url, options = {}) => {
  let token = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = `Bearer ${token}`;
  options.headers['Content-Type'] = 'application/json';

  let res = await fetch(url, options);

  // If access token expired
  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      token = data.accessToken;
      setAccessToken(token);

      // Retry original request
      options.headers['Authorization'] = `Bearer ${token}`;
      res = await fetch(url, options);
    } else {
      // Refresh failed → logout
      clearAuth();
      window.location.href = '/login';
      return;
    }
  }

  return res;
};
