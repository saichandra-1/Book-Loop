import axios, { AxiosInstance } from 'axios';

// For Vite projects, use import.meta.env; for Create React App, process.env is available.
// If using Vite:
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// If using Create React App, revert to process.env.REACT_APP_API_URL as originally written.

export default api;