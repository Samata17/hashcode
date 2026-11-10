import axios from 'axios';

// The login token is kept in the browser so you stay logged in after a refresh.
// Only the token is stored here - all real data (users, posts) lives in MongoDB.
const TOKEN_KEY = 'devblog_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// One shared Axios instance for every API call.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Before each request, attach the token (if we have one).
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// The backend sends validation problems as [{ field, message }].
// This turns them into { email: "Please enter a valid email", ... } for showing under inputs.
export function getFieldErrors(err) {
  const list = err?.response?.data?.errors || [];
  return Object.fromEntries(list.map((e) => [e.field.replace(/\[\d+\]$/, ''), e.message]));
}

// Turns any Axios error into a friendly sentence for the UI.
export function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err?.response) {
    return 'Cannot reach the server. Is the backend running?';
  }
  return err?.message || 'Something went wrong.';
}
