import type { Appointment, Client, ClientStatus } from "@/lib/data/types";

export interface ClientRow extends Client {
  visits: number;
  spent: number;
  lastVisit: string | null;
  nextVisit: string | null;
  noShows: number;
}

export function buildClientRows(
  clients: Client[],
  appointments: Appointment[],
  now = new Date(),
): ClientRow[] {
  const stats = new Map<
    string,
    { visits: number; spent: number; lastVisit: string | null; nextVisit: string | null; noShows: number }
  >();
  const nowIso = now.toISOString();
  for (const a of appointments) {
    let s = stats.get(a.clientId);
    if (!s) {
      s = { visits: 0, spent: 0, lastVisit: null, nextVisit: null, noShows: 0 };
      stats.set(a.clientId, s);
    }
    if (a.start <= nowIso) {
      if (a.status === "completed" || a.status === "confirmed") {
        s.visits += 1;
        s.spent += a.price;
        if (!s.lastVisit || a.start > s.lastVisit) s.lastVisit = a.start;
      } else if (a.status === "no_show") {
        s.noShows += 1;
      }
    } else if (a.status === "confirmed" || a.status === "pending") {
      if (!s.nextVisit || a.start < s.nextVisit) s.nextVisit = a.start;
    }
  }
  return clients.map((c) => ({
    ...c,
    ...(stats.get(c.id) ?? { visits: 0, spent: 0, lastVisit: null, nextVisit: null, noShows: 0 }),
  }));
}

export const clientStatusMeta: Record<ClientStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300" },
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  },
  vip: {
    label: "VIP",
    className: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  },
  inactive: {
    label: "Inactive",
    className: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400",
  },
};

export const clientStatuses = Object.keys(clientStatusMeta) as ClientStatus[];

export function collectTags(clients: Client[]): string[] {
  const tags = new Set<string>(["VIP", "Referral"]);
  for (const c of clients) for (const t of c.tags) tags.add(t);
  return [...tags].sort((a, b) => a.localeCompare(b));
}
