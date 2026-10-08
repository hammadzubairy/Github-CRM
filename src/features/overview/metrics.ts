import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import type { Appointment, Client, Service } from "@/lib/data/types";

export type RangeKey = "7d" | "30d" | "90d";

export const ranges: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

interface Window {
  from: Date;
  to: Date;
}

function windows(days: number, now: Date): { current: Window; previous: Window } {
  const to = addDays(startOfDay(now), 1);
  const from = subDays(to, days);
  return { current: { from, to }, previous: { from: subDays(from, days), to: from } };
}

function inWindow(iso: string, w: Window) {
  const t = new Date(iso).getTime();
  return t >= w.from.getTime() && t < w.to.getTime();
}

const earning = (a: Appointment) => a.status === "completed" || a.status === "confirmed";

function summarize(appointments: Appointment[], clients: Client[], w: Window, now: Date) {
  const past = appointments.filter((a) => inWindow(a.start, w) && new Date(a.start) <= now);
  const revenue = past.filter(earning).reduce((sum, a) => sum + a.price, 0);
  const bookings = past.filter((a) => a.status !== "cancelled").length;
  const attended = past.filter((a) => a.status === "completed" || a.status === "confirmed").length;
  const noShows = past.filter((a) => a.status === "no_show").length;
  const newClients = clients.filter((c) => inWindow(c.createdAt, w)).length;
  return {
    revenue,
    bookings,
    newClients,
    noShowRate: attended + noShows ? noShows / (attended + noShows) : 0,
  };
}

function change(current: number, previous: number) {
  if (!previous) return current ? 1 : 0;
  return (current - previous) / previous;
}

export function computeKpis(appointments: Appointment[], clients: Client[], days: number, now: Date) {
  const { current, previous } = windows(days, now);
  const a = summarize(appointments, clients, current, now);
  const b = summarize(appointments, clients, previous, now);
  return {
    revenue: { value: a.revenue, change: change(a.revenue, b.revenue) },
    bookings: { value: a.bookings, change: change(a.bookings, b.bookings) },
    newClients: { value: a.newClients, change: change(a.newClients, b.newClients) },
    noShowRate: { value: a.noShowRate, change: a.noShowRate - b.noShowRate },
  };
}

export function revenueSeries(appointments: Appointment[], days: number, now: Date) {
  const { current } = windows(days, now);
  const weekly = days > 31;
  const buckets = weekly
    ? eachWeekOfInterval({ start: current.from, end: subDays(current.to, 1) }, { weekStartsOn: 1 })
    : eachDayOfInterval({ start: current.from, end: subDays(current.to, 1) });
  const keyOf = (d: Date) =>
    weekly ? format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd") : format(d, "yyyy-MM-dd");
  const totals = new Map<string, { revenue: number; bookings: number }>();
  for (const appt of appointments) {
    if (!inWindow(appt.start, current) || new Date(appt.start) > now) continue;
    const key = keyOf(new Date(appt.start));
    const entry = totals.get(key) ?? { revenue: 0, bookings: 0 };
    if (earning(appt)) entry.revenue += appt.price;
    if (appt.status !== "cancelled") entry.bookings += 1;
    totals.set(key, entry);
  }
  return buckets.map((d) => {
    const key = keyOf(d);
    return {
      date: key,
      label: weekly ? `Wk of ${format(d, "d MMM")}` : format(d, days > 7 ? "d MMM" : "EEE"),
      ...(totals.get(key) ?? { revenue: 0, bookings: 0 }),
    };
  });
}

export function bookingsByService(appointments: Appointment[], services: Service[], days: number, now: Date) {
  const { current } = windows(days, now);
  const counts = new Map<string, number>();
  for (const appt of appointments) {
    if (appt.status === "cancelled" || !inWindow(appt.start, current)) continue;
    counts.set(appt.serviceId, (counts.get(appt.serviceId) ?? 0) + 1);
  }
  return services
    .map((s) => ({ id: s.id, name: s.name, color: s.color, bookings: counts.get(s.id) ?? 0 }))
    .filter((s) => s.bookings > 0)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 6);
}

export function daysUntil(iso: string, now: Date) {
  return differenceInCalendarDays(new Date(iso), now);
}
