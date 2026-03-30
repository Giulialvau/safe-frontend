"use client";

import { clearToken, getToken, setToken, subscribeAuth } from "@/lib/auth-storage";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

export function useAuth() {
  const router = useRouter();
  const token = useSyncExternalStore(
    subscribeAuth,
    () => getToken(),
    () => null
  );

  const login = useCallback((jwt: string) => {
    setToken(jwt);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    router.replace("/login");
  }, [router]);

  return {
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };
}
