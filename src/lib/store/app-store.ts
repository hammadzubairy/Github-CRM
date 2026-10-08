"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { toast } from "sonner";
import { addDays, startOfDay } from "date-fns";
import { DEMO_SEED_VERSION, demoProfile, generateDemoData } from "@/lib/demo/seed";
import { newId } from "@/lib/demo/random";
import { remote } from "@/lib/data/remote";
import type {
  Activity,
  ActivityType,
  Appointment,
  Business,
  Client,
  ClientNote,
  DataSnapshot,
  EntityKey,
  Invoice,
  Profile,
  Service,
  StaffMember,
} from "@/lib/data/types";
import { getPlan, type BillingInterval, type PlanId } from "@/lib/plans";

export type DataMode = "demo" | "supabase";
export type LoadStatus = "idle" | "loading" | "ready" | "error";

const STORAGE_KEY = "flowdesk-demo";
const RESEED_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

let persistenceEnabled = true;
let pendingInit: Promise<void> | null = null;

const guardedStorage: StateStorage = {
  getItem: (name) => (typeof window === "undefined" ? null : window.localStorage.getItem(name)),
  setItem: (name, value) => {
    if (typeof window === "undefined" || !persistenceEnabled) return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage quota exceeded or disabled: keep working in memory.
    }
  },
  removeItem: (name) => {
    if (typeof window !== "undefined") window.localStorage.removeItem(name);
  },
};

const emptySnapshot: DataSnapshot = {
  profile: demoProfile,
  businesses: [],
  staff: [],
  services: [],
  clients: [],
  notes: [],
  appointments: [],
  invoices: [],
  activity: [],
};

interface StoreState extends DataSnapshot {
  mode: DataMode;
  status: LoadStatus;
  error: string | null;
  activeBusinessId: string;
  seedVersion: number;
  seededAt: string | null;
  notificationsReadAt: string | null;
}

interface StoreActions {
  init: (mode: DataMode) => Promise<void>;
  setActiveBusiness: (id: string) => void;
  saveAppointment: (appointment: Appointment) => Promise<boolean>;
  updateAppointment: (id: string, patch: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  saveClient: (client: Client) => Promise<boolean>;
  deleteClients: (ids: string[]) => Promise<boolean>;
  tagClients: (ids: string[], tag: string) => Promise<boolean>;
  addNote: (clientId: string, body: string) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  saveService: (service: Service) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
  saveStaff: (member: StaffMember) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;
  updateBusiness: (patch: Partial<Business>) => Promise<boolean>;
  updateProfile: (patch: Partial<Profile>) => Promise<boolean>;
  logActivity: (type: ActivityType, message: string, businessId?: string) => void;
  applyPlan: (plan: PlanId, interval: BillingInterval) => Promise<boolean>;
  markNotificationsRead: () => void;
  resetDemo: () => void;
}

export type AppStore = StoreState & StoreActions;

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [...list, item];
  const next = list.slice();
  next[index] = item;
  return next;
}

function nextInvoiceNumber(invoices: Invoice[]): string {
  const highest = invoices.reduce(
    (max, inv) => Math.max(max, Number(inv.number.replace(/\D/g, "")) || 0),
    2000,
  );
  return `FD-${String(highest + 1).padStart(5, "0")}`;
}

function freshDemoState(): Partial<StoreState> {
  const data = generateDemoData(new Date());
  return {
    ...data,
    activeBusinessId: data.businesses[0]?.id ?? "",
    seedVersion: DEMO_SEED_VERSION,
    seededAt: new Date().toISOString(),
    notificationsReadAt: null,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      /**
       * Applies a change optimistically, then persists it remotely when running against Supabase.
       * On failure the previous slices are restored and the user is notified.
       */
      async function commit(
        changes: Partial<DataSnapshot>,
        remoteOp?: () => Promise<void>,
      ): Promise<boolean> {
        const previous: Partial<DataSnapshot> = {};
        const state = get();
        for (const key of Object.keys(changes) as (keyof DataSnapshot)[]) {
          (previous as Record<string, unknown>)[key] = state[key];
        }
        set(changes);
        if (get().mode !== "supabase" || !remoteOp) return true;
        try {
          await remoteOp();
          return true;
        } catch (error) {
          set(previous);
          toast.error("Could not save changes", {
            description: error instanceof Error ? error.message : "Please try again.",
          });
          return false;
        }
      }

      const upsertRemote = (entity: EntityKey, rows: object[]) => () => remote.upsert(entity, rows);
      const removeRemote = (entity: EntityKey, ids: string[]) => () => remote.remove(entity, ids);

      async function load(mode: DataMode): Promise<void> {
        // Writing before rehydration would overwrite the saved demo data with the empty initial state.
        persistenceEnabled = false;
        set({ mode, status: "loading", error: null });

        if (mode === "demo") {
          await useAppStore.persist.rehydrate();
          persistenceEnabled = true;
          const s = get();
          const stale =
            !s.seededAt ||
            s.seedVersion !== DEMO_SEED_VERSION ||
            Date.now() - new Date(s.seededAt).getTime() > RESEED_AFTER_MS ||
            !s.businesses.length;
          if (stale) set(freshDemoState());
          const after = get();
          if (!after.businesses.some((b) => b.id === after.activeBusinessId)) {
            set({ activeBusinessId: after.businesses[0]?.id ?? "" });
          }
          set({ status: "ready", mode: "demo" });
          return;
        }

        try {
          const snapshot = await remote.load();
          set({
            ...snapshot,
            activeBusinessId: snapshot.businesses[0]?.id ?? "",
            status: "ready",
            mode: "supabase",
          });
        } catch (error) {
          set({
            status: "error",
            error: error instanceof Error ? error.message : "Failed to load workspace",
          });
        }
      }

      return {
        ...emptySnapshot,
        mode: "demo",
        status: "idle",
        error: null,
        activeBusinessId: "",
        seedVersion: 0,
        seededAt: null,
        notificationsReadAt: null,

        init(mode) {
          const current = get();
          if (current.status === "loading" && pendingInit) return pendingInit;
          if (current.status === "ready" && current.mode === mode) return Promise.resolve();
          pendingInit = load(mode).finally(() => {
            pendingInit = null;
          });
          return pendingInit;
        },

        setActiveBusiness(id) {
          set({ activeBusinessId: id });
        },
        saveAppointment(appointment) {
          return commit(
            { appointments: upsertById(get().appointments, appointment) },
            upsertRemote("appointments", [appointment]),
          );
        },

        updateAppointment(id, patch) {
          const existing = get().appointments.find((a) => a.id === id);
          if (!existing) return Promise.resolve(false);
          const next = { ...existing, ...patch };
          return commit(
            { appointments: upsertById(get().appointments, next) },
            upsertRemote("appointments", [next]),
          );
        },

        deleteAppointment(id) {
          return commit(
            { appointments: get().appointments.filter((a) => a.id !== id) },
            removeRemote("appointments", [id]),
          );
        },

        saveClient(client) {
          return commit({ clients: upsertById(get().clients, client) }, upsertRemote("clients", [client]));
        },

        deleteClients(ids) {
          const set_ = new Set(ids);
          return commit(
            {
              clients: get().clients.filter((c) => !set_.has(c.id)),
              notes: get().notes.filter((n) => !set_.has(n.clientId)),
              appointments: get().appointments.filter((a) => !set_.has(a.clientId)),
            },
            removeRemote("clients", ids),
          );
        },

        tagClients(ids, tag) {
          const set_ = new Set(ids);
          const changed: Client[] = [];
          const clients = get().clients.map((c) => {
            if (!set_.has(c.id) || c.tags.includes(tag)) return c;
            const next = { ...c, tags: [...c.tags, tag] };
            changed.push(next);
            return next;
          });
          return commit({ clients }, upsertRemote("clients", changed));
        },

        addNote(clientId, body) {
          const note: ClientNote = {
            id: newId(),
            businessId: get().activeBusinessId,
            clientId,
            body,
            author: get().profile.name,
            createdAt: new Date().toISOString(),
          };
          return commit({ notes: [note, ...get().notes] }, upsertRemote("notes", [note]));
        },

        deleteNote(id) {
          return commit({ notes: get().notes.filter((n) => n.id !== id) }, removeRemote("notes", [id]));
        },

        saveService(service) {
          return commit(
            { services: upsertById(get().services, service) },
            upsertRemote("services", [service]),
          );
        },

        deleteService(id) {
          return commit(
            {
              services: get().services.filter((s) => s.id !== id),
              staff: get().staff.map((m) =>
                m.serviceIds.includes(id) ? { ...m, serviceIds: m.serviceIds.filter((x) => x !== id) } : m,
              ),
            },
            removeRemote("services", [id]),
          );
        },

        saveStaff(member) {
          return commit({ staff: upsertById(get().staff, member) }, upsertRemote("staff", [member]));
        },

        deleteStaff(id) {
          return commit({ staff: get().staff.filter((m) => m.id !== id) }, removeRemote("staff", [id]));
        },

        updateBusiness(patch) {
          const business = get().businesses.find((b) => b.id === get().activeBusinessId);
          if (!business) return Promise.resolve(false);
          const next = { ...business, ...patch };
          return commit({ businesses: upsertById(get().businesses, next) }, () =>
            remote.updateBusiness(next),
          );
        },

        updateProfile(patch) {
          const next = { ...get().profile, ...patch };
          return commit({ profile: next }, () => remote.updateProfile(next));
        },

        logActivity(type, message, businessId) {
          const entry: Activity = {
            id: newId(),
            businessId: businessId ?? get().activeBusinessId,
            type,
            message,
            createdAt: new Date().toISOString(),
          };
          void commit(
            { activity: [entry, ...get().activity].slice(0, 200) },
            upsertRemote("activity", [entry]),
          );
        },

        async applyPlan(planId, interval) {
          const business = get().businesses.find((b) => b.id === get().activeBusinessId);
          if (!business) return false;
          const plan = getPlan(planId);
          const now = new Date();
          const periodEnd = addDays(startOfDay(now), interval === "yearly" ? 365 : 30);
          const amount = interval === "yearly" ? plan.yearly * 12 : plan.monthly;
          const invoices: Invoice[] =
            amount > 0
              ? [
                  {
                    id: newId(),
                    businessId: business.id,
                    number: nextInvoiceNumber(get().invoices),
                    amount,
                    status: "paid",
                    plan: planId,
                    periodStart: now.toISOString(),
                    periodEnd: periodEnd.toISOString(),
                    createdAt: now.toISOString(),
                  },
                  ...get().invoices,
                ]
              : get().invoices;
          const ok = await commit({
            businesses: upsertById(get().businesses, {
              ...business,
              plan: planId,
              planInterval: interval,
              currentPeriodEnd: periodEnd.toISOString(),
            }),
            invoices,
          });
          if (ok) get().logActivity("plan_changed", `Workspace switched to the ${plan.name} plan`);
          return ok;
        },

        markNotificationsRead() {
          set({ notificationsReadAt: new Date().toISOString() });
        },

        resetDemo() {
          set({ ...freshDemoState(), status: "ready", mode: "demo" });
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: DEMO_SEED_VERSION,
      storage: createJSONStorage(() => guardedStorage),
      skipHydration: true,
      partialize: (state) => ({
        profile: state.profile,
        businesses: state.businesses,
        staff: state.staff,
        services: state.services,
        clients: state.clients,
        notes: state.notes,
        appointments: state.appointments,
        invoices: state.invoices,
        activity: state.activity,
        activeBusinessId: state.activeBusinessId,
        seedVersion: state.seedVersion,
        seededAt: state.seededAt,
        notificationsReadAt: state.notificationsReadAt,
      }),
      migrate: () => ({}) as AppStore,
    },
  ),
);
