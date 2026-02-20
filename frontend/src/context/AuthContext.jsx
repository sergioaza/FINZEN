import { createContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth";
import i18n from "../i18n/index.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("finzen_token"));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const u = await authApi.me();
      setUser(u);
      if (u.locale) i18n.changeLanguage(u.locale);
    } catch {
      setToken(null);
      localStorage.removeItem("finzen_token");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = (tokenValue, userData) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem("finzen_token", tokenValue);
    if (userData?.locale) i18n.changeLanguage(userData.locale);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors — token may already be invalid
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("finzen_token");
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
