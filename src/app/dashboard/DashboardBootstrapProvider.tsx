"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSessionBootstrap } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SessionBootstrap } from "@/types";

type DashboardBootstrapContextValue = {
  bootstrap: SessionBootstrap | null;
  loading: boolean;
  error: string;
  refreshBootstrap: (opts?: { force?: boolean }) => Promise<SessionBootstrap | null>;
  mutateBootstrap: (updater: (prev: SessionBootstrap | null) => SessionBootstrap | null) => void;
};

const DashboardBootstrapContext = createContext<DashboardBootstrapContextValue | null>(null);

const BOOTSTRAP_TTL_MS = 60_000;

type CacheEntry = {
  userId: string | null;
  data: SessionBootstrap | null;
  fetchedAt: number;
  inFlight: Promise<SessionBootstrap | null> | null;
};

const cache: CacheEntry = {
  userId: null,
  data: null,
  fetchedAt: 0,
  inFlight: null,
};

export function DashboardBootstrapProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bootstrap, setBootstrap] = useState<SessionBootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshBootstrap = useCallback(
    async (opts?: { force?: boolean }) => {
      const force = Boolean(opts?.force);
      const userId = user?.id ?? null;

      if (!userId) {
        cache.userId = null;
        cache.data = null;
        cache.fetchedAt = 0;
        cache.inFlight = null;
        setBootstrap(null);
        setLoading(false);
        setError("");
        return null;
      }

      if (cache.userId !== userId) {
        cache.userId = userId;
        cache.data = null;
        cache.fetchedAt = 0;
        cache.inFlight = null;
      }

      const isFresh = Date.now() - cache.fetchedAt < BOOTSTRAP_TTL_MS;
      if (!force && cache.data && isFresh) {
        setBootstrap(cache.data);
        setLoading(false);
        setError("");
        return cache.data;
      }

      if (!force && cache.inFlight) {
        setLoading(true);
        const result = await cache.inFlight;
        setBootstrap(result);
        setLoading(false);
        return result;
      }

      const p = getSessionBootstrap()
        .then((result) => {
          cache.data = result;
          cache.fetchedAt = Date.now();
          return result;
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : "Could not load workspace bootstrap";
          setError(message);
          return null;
        })
        .finally(() => {
          cache.inFlight = null;
        });

      cache.inFlight = p;
      setLoading(true);
      const result = await p;
      setBootstrap(result);
      setLoading(false);
      if (result) setError("");
      return result;
    },
    [user?.id],
  );

  const mutateBootstrap = useCallback((updater: (prev: SessionBootstrap | null) => SessionBootstrap | null) => {
    setBootstrap((prev) => {
      const next = updater(prev);
      cache.data = next;
      cache.fetchedAt = next ? Date.now() : 0;
      return next;
    });
  }, []);

  useEffect(() => {
    void refreshBootstrap();
  }, [refreshBootstrap]);

  const value = useMemo<DashboardBootstrapContextValue>(
    () => ({ bootstrap, loading, error, refreshBootstrap, mutateBootstrap }),
    [bootstrap, loading, error, refreshBootstrap, mutateBootstrap],
  );

  return <DashboardBootstrapContext.Provider value={value}>{children}</DashboardBootstrapContext.Provider>;
}

export function useDashboardBootstrap() {
  const ctx = useContext(DashboardBootstrapContext);
  if (!ctx) throw new Error("useDashboardBootstrap must be used within DashboardBootstrapProvider");
  return ctx;
}
