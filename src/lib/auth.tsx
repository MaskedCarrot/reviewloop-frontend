"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "@/types";
import { LOCAL_DEMO_FLAG, TEST_USER_ID } from "@/lib/testMode/ids";
import { getMe, isBrowserLocalMockApp } from "./api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const id = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
    if (!id) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      if (data.id && isBrowserLocalMockApp() && data.id !== id) {
        localStorage.setItem("user_id", data.id);
      }
      setUser(data);
    } catch {
      localStorage.removeItem("user_id");
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = (u: User) => {
    if (u.id !== TEST_USER_ID) {
      localStorage.removeItem(LOCAL_DEMO_FLAG);
    }
    localStorage.setItem("user_id", u.id);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem(LOCAL_DEMO_FLAG);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
