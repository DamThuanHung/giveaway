"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  AuthUser,
  getToken,
  getStoredUser,
  saveAuth,
  updateUserCache,
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
  const syncingRef = useRef(false);

  async function syncFromToken() {
    // Guard chống concurrent calls: saveAuth dispatch traotay:auth → onAuth gọi
    // syncFromToken lại → vòng lặp vô hạn + race condition logout oan.
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
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
          // Dùng updateUserCache thay saveAuth để KHÔNG dispatch traotay:auth
          // (saveAuth trigger syncFromToken lại → infinite loop)
          updateUserCache(fresh);
          syncFavoritesFromServer(fresh.id);
        } else {
          // Token invalid → clear
          clearAuthStorage();
          setUser(null);
        }
      } catch {
        // Network error → giữ cached user
      }
    } finally {
      syncingRef.current = false;
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
