import axios from "axios";
import { clearAuthSession, getAuthToken } from "../utils/authStorage";

const apiBaseURL = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (import.meta.env.PROD && !apiBaseURL) {
    return Promise.reject(
      new Error("Backend URL is not configured. Set VITE_API_URL for production.")
    );
  }

  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthRequest = url.startsWith("/login") || url.startsWith("/register");

    if (error.response?.status === 401 && !isAuthRequest) {
      clearAuthSession();
      window.dispatchEvent(new Event("taskflow:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
