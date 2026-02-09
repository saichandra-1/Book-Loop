import axios, { AxiosInstance } from 'axios';

// For Vite projects, use import.meta.env; for Create React App, process.env is available.
// If using Vite:
const api: AxiosInstance = axios.create({
  baseURL: 'book-loop-serve-production-1108.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

// If using Create React App, revert to process.env.REACT_APP_API_URL as originally written.

export default api;
