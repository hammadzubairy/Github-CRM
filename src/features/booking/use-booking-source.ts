"use client";

import { useCallback, useEffect, useState } from "react";
import { addMinutes } from "date-fns";
import type { Business, Service, StaffMember } from "@/lib/data/types";
import { newId } from "@/lib/demo/random";
import { demoBookingPages } from "@/lib/demo/seed";
import { isSupabaseConfigured } from "@/lib/env";
import { useAppStore } from "@/lib/store/app-store";
import type { BusyInterval } from "./availability";

const getSupabase = async () =>
  isSupabaseConfigured ? (await import("@/lib/supabase/client")).getSupabaseBrowserClient() : null;

export type PublicBusiness = Pick<
  Business,
  | "id"
  | "name"
  | "slug"
  | "industry"
  | "email"
  | "phone"
  | "address"
  | "description"
  | "currency"
  | "accentHue"
  | "workingHours"
>;
export type PublicService = Pick<
  Service,
  "id" | "name" | "description" | "category" | "durationMin" | "price" | "color"
>;
export type PublicStaff = Pick<StaffMember, "id" | "name" | "title" | "color" | "serviceIds">;

export interface BookingPage {
  business: PublicBusiness;
  services: PublicService[];
  staff: PublicStaff[];
}

export interface BookingRequest {
  serviceId: string;
  staffId: string;
  start: Date;
  name: string;
  email: string;
  phone: string;
  notes: string;
}

type SourceState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; source: "demo" | "supabase"; page: BookingPage };

const isDemoSlug = (slug: string) => demoBookingPages.some((p) => p.slug === slug);
/** Demo workspaces can rename their booking link, which then only exists in this browser. */
const hasLocalDemoData = () =>
  typeof window !== "undefined" && window.localStorage.getItem("flowdesk-demo") !== null;

async function loadDemoPage(slug: string): Promise<BookingPage | null> {
  await useAppStore.getState().init("demo");
  const state = useAppStore.getState();
  const business = state.businesses.find((b) => b.slug === slug);
  if (!business) return null;
  const services = state.services
    .filter((s) => s.businessId === business.id && s.active)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const staff = state.staff.filter((m) => m.businessId === business.id && m.active);
  return { business, services, staff };
}

async function loadRemotePage(slug: string): Promise<BookingPage | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_booking_page", { p_slug: slug });
  if (error) throw new Error(error.message);
  return (data as BookingPage | null) ?? null;
}

export function useBookingSource(slug: string) {
  const [state, setState] = useState<SourceState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let page = await loadRemotePage(slug);
        let source: "demo" | "supabase" = "supabase";
        if (!page && (isDemoSlug(slug) || hasLocalDemoData())) {
          page = await loadDemoPage(slug);
          source = "demo";
        }
        if (cancelled) return;
        setState(page ? { status: "ready", source, page } : { status: "not-found" });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Something went wrong",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const source = state.status === "ready" ? state.source : null;
  const businessId = state.status === "ready" ? state.page.business.id : null;

  const getBusy = useCallback(
    async (from: Date, to: Date): Promise<BusyInterval[]> => {
      if (source === "demo") {
        return useAppStore
          .getState()
          .appointments.filter(
            (a) =>
              a.businessId === businessId &&
              a.status !== "cancelled" &&
              a.status !== "no_show" &&
              new Date(a.start) < to &&
              new Date(a.end) > from,
          )
          .map((a) => ({ staffId: a.staffId, start: new Date(a.start), end: new Date(a.end) }));
      }
      const supabase = await getSupabase();
      if (!supabase) return [];
      const { data, error } = await supabase.rpc("get_busy_slots", {
        p_slug: slug,
        p_from: from.toISOString(),
        p_to: to.toISOString(),
      });
      if (error) throw new Error(error.message);
      return ((data ?? []) as { staff_id: string; starts_at: string; ends_at: string }[]).map((r) => ({
        staffId: r.staff_id,
        start: new Date(r.starts_at),
        end: new Date(r.ends_at),
      }));
    },
    [source, businessId, slug],
  );

  const createBooking = useCallback(
    async (request: BookingRequest, service: PublicService): Promise<string> => {
      if (source === "demo" && businessId) {
        const store = useAppStore.getState();
        const end = addMinutes(request.start, service.durationMin);
        const clash = store.appointments.some(
          (a) =>
            a.staffId === request.staffId &&
            a.status !== "cancelled" &&
            a.status !== "no_show" &&
            new Date(a.start) < end &&
            new Date(a.end) > request.start,
        );
        if (clash) throw new Error("That slot was just taken, please pick another time");

        const email = request.email.trim().toLowerCase();
        let client = store.clients.find(
          (c) => c.businessId === businessId && c.email.toLowerCase() === email,
        );
        const now = new Date().toISOString();
        if (!client) {
          client = {
            id: newId(),
            businessId,
            name: request.name.trim(),
            email,
            phone: request.phone.trim(),
            status: "new",
            tags: ["Online"],
            createdAt: now,
          };
          await store.saveClient(client);
          store.logActivity(
            "client_created",
            `New client ${client.name} joined via booking page`,
            businessId,
          );
        }
        const id = newId();
        await store.saveAppointment({
          id,
          businessId,
          clientId: client.id,
          staffId: request.staffId,
          serviceId: service.id,
          start: request.start.toISOString(),
          end: end.toISOString(),
          status: "confirmed",
          price: service.price,
          notes: request.notes.trim(),
          source: "online",
          createdAt: now,
        });
        store.logActivity(
          "booking_created",
          `${request.name.trim()} booked ${service.name} online`,
          businessId,
        );
        return id;
      }

      const supabase = await getSupabase();
      if (!supabase) throw new Error("Booking is unavailable right now");
      const { data, error } = await supabase.rpc("create_public_booking", {
        p_slug: slug,
        p_service_id: request.serviceId,
        p_staff_id: request.staffId,
        p_starts_at: request.start.toISOString(),
        p_name: request.name.trim(),
        p_email: request.email.trim(),
        p_phone: request.phone.trim(),
        p_notes: request.notes.trim(),
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    [source, businessId, slug],
  );

  return { state, retry, getBusy, createBooking };
}
