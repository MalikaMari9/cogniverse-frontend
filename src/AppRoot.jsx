// AppRoot.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUserFromToken, logoutAndRedirect } from "./utils/auth";
import useSessionWatcher from "./hooks/useSessionWatcher";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AppRoot({ children }) {
  const [user, setUser] = useState(getCurrentUserFromToken());
  const [loading, setLoading] = useState(true);

  const { forceRefresh } = useSessionWatcher({
    thresholdSeconds: 30,
    autoRefresh: true,
    onRefreshed: () => setUser(getCurrentUserFromToken()),
    onLogout: () => {
      setUser(null);
      logoutAndRedirect();
    },
  });

  // Initial decode
  useEffect(() => {
    setUser(getCurrentUserFromToken());
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    logoutAndRedirect();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, forceRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}
