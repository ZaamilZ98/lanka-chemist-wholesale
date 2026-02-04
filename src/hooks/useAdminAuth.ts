"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminInfo } from "@/types/admin";

interface AdminAuthState {
  admin: AdminInfo | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export function useAdminAuth(): AdminAuthState {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function fetchAdmin() {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAdmin(data.admin);
        } else {
          if (!cancelled) setAdmin(null);
        }
      } catch {
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchAdmin();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      setAdmin(null);
      router.push("/admin/login");
    }
  }, [router]);

  return { admin, isLoading, logout };
}
