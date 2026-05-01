"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  AuthUser,
  getToken,
  getStoredUser,
  saveAuth,
  clearAuth as clearAuthStorage,
  fetchMyProfile,
} from "@/lib/auth";
import { syncFavoritesFromServer } from "./FavoriteButton";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  setAuth: () => {},
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function syncFromToken() {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Optimistic: dùng cached user trong khi verify
    const cached = getStoredUser();
    if (cached) setUser(cached);

    // Verify với backend
    try {
      const fresh = await fetchMyProfile();
      if (fresh) {
        setUser(fresh);
        // Update cache
        const tk = getToken();
        if (tk) saveAuth(tk, fresh);
        // Sync favorites IDs cache (1 lần / load app)
        syncFavoritesFromServer(fresh.id);
      } else {
        // Token invalid → clear
        clearAuthStorage();
        setUser(null);
      }
    } catch {
      // Network error → giữ cached user, retry sau
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    syncFromToken();
    const onAuth = () => syncFromToken();
    window.addEventListener("traotay:auth", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("traotay:auth", onAuth);
      window.removeEventListener("storage", onAuth);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    setAuth: (token, user) => {
      saveAuth(token, user);
      setUser(user);
    },
    logout: () => {
      clearAuthStorage();
      setUser(null);
    },
    refresh: syncFromToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
