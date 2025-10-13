// src/utils/auth.js

// Function to get the user object from localStorage
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Function to get the JWT token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Function to set token
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Function to set user
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Function to remove user and token from localStorage
export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Function to redirect to the correct dashboard based on role
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
