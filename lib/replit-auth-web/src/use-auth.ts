import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPendingGuestData: boolean;
  login: () => void;
  logout: () => void;
  migrateGuestData: () => Promise<{ migrated: boolean; message: string }>;
  refetch: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingGuestData, setHasPendingGuestData] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{
          user: AuthUser | null;
          hasPendingGuestData: boolean;
        }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setHasPendingGuestData(data.hasPendingGuestData ?? false);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
    const loginUrl = `${window.location.origin}/api/login?returnTo=${encodeURIComponent(base)}`;
    // Navigate the topmost frame so we break out of any iframe wrapping.
    // If the browser blocks _top navigation (sandboxed iframe without
    // allow-top-navigation, e.g. the Replit canvas preview pane),
    // window.open returns null — fall back to a new tab in that case.
    const result = window.open(loginUrl, "_top");
    if (result === null) {
      window.open(loginUrl, "_blank");
    }
  }, []);

  const logout = useCallback(() => {
    const result = window.open(`${window.location.origin}/api/logout`, "_top");
    if (result === null) {
      window.open(`${window.location.origin}/api/logout`, "_blank");
    }
  }, []);

  const migrateGuestData = useCallback(async () => {
    const res = await fetch("/api/migrate-guest", {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json()) as { migrated: boolean; message: string };
    if (data.migrated) {
      setHasPendingGuestData(false);
    }
    return data;
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setTick((t) => t + 1);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasPendingGuestData,
    login,
    logout,
    migrateGuestData,
    refetch,
  };
}
