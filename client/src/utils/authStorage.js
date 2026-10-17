const storageNames = ["localStorage", "sessionStorage"];

export const getAuthToken = () =>
  window.localStorage.getItem("token") || window.sessionStorage.getItem("token");

export const getStoredUser = () => {
  for (const storageName of storageNames) {
    const storage = window[storageName];
    const serializedUser = storage.getItem("user");

    if (!serializedUser) continue;

    try {
      return JSON.parse(serializedUser);
    } catch {
      storage.removeItem("user");
      storage.removeItem("token");
    }
  }

  return null;
};

export const saveAuthSession = ({ token, user }, rememberMe = false) => {
  clearAuthSession();

  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem("token", token);
  storage.setItem("user", JSON.stringify(user));
};

export const clearAuthSession = () => {
  for (const storageName of storageNames) {
    const storage = window[storageName];
    storage.removeItem("token");
    storage.removeItem("user");
  }
};
