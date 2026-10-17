import { useCallback, useMemo, useState } from "react";
import AuthContext from "./AuthContext";
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
} from "../utils/authStorage";

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (getAuthToken()) {
      const storedUser = getStoredUser();
      if (storedUser) return storedUser;
    }
    clearAuthSession();
    return null;
  });

  const signIn = useCallback((authenticatedUser) => setUser(authenticatedUser), []);
  const signOut = useCallback(() => setUser(null), []);
  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
