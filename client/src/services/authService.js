
import api from "./api";
import {
  clearAuthSession,
  saveAuthSession,
} from "../utils/authStorage";

export const registerUser = async (userData) => {
  const response = await api.post("/register", userData);

  if (response.data.token && response.data.user) {
    saveAuthSession(response.data);
  }

  return response.data;
};

export const loginUser = async (credentials, rememberMe = false) => {
  const response = await api.post("/login", credentials);

  if (response.data.token && response.data.user) {
    saveAuthSession(response.data, rememberMe);
  }

  return response.data;
};

export const logoutUser = () => {
  clearAuthSession();
};
