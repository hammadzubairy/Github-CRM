"use client";

import { useMemo } from "react";
import { DEMO_COOKIE, isSupabaseConfigured } from "@/lib/env";
import type { Business, DataSnapshot } from "@/lib/data/types";
import { useAppStore, type DataMode } from "./app-store";

type BusinessScoped = Exclude<keyof DataSnapshot, "profile" | "businesses">;

export function detectDataMode(): DataMode {
  if (typeof document === "undefined") return "demo";
  const hasDemoCookie = document.cookie.split("; ").some((c) => c.startsWith(`${DEMO_COOKIE}=`));
  if (hasDemoCookie || !isSupabaseConfigured) return "demo";
  return "supabase";
}

export function useActiveBusiness(): Business | undefined {
  const id = useAppStore((s) => s.activeBusinessId);
  const businesses = useAppStore((s) => s.businesses);
  return useMemo(() => businesses.find((b) => b.id === id), [businesses, id]);
}

export function useScoped<K extends BusinessScoped>(key: K): DataSnapshot[K] {
  const id = useAppStore((s) => s.activeBusinessId);
  const list = useAppStore((s) => s[key]);
  return useMemo(
    () => (list as { businessId: string }[]).filter((x) => x.businessId === id) as DataSnapshot[K],
    [list, id],
  );
}

export function useLookups() {
  const clients = useScoped("clients");
  const services = useScoped("services");
  const staff = useScoped("staff");
  return useMemo(
    () => ({
      clientById: new Map(clients.map((c) => [c.id, c])),
      serviceById: new Map(services.map((s) => [s.id, s])),
      staffById: new Map(staff.map((m) => [m.id, m])),
    }),
    [clients, services, staff],
  );
}

export function useIsReady(): boolean {
  return useAppStore((s) => s.status === "ready");
}
