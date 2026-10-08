import { addDays, addMinutes, isBefore, startOfDay } from "date-fns";
import type { WorkingDay } from "@/lib/data/types";

export interface BusyInterval {
  staffId: string;
  start: Date;
  end: Date;
}

export interface Slot {
  start: Date;
  staffIds: string[];
}

export const SLOT_STEP_MIN = 15;
export const BOOKING_WINDOW_DAYS = 60;
/** Minimum notice before an online booking can start. */
export const LEAD_TIME_MIN = 60;

function parseTime(day: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

export function workingDayFor(hours: WorkingDay[], date: Date): WorkingDay | undefined {
  return hours.find((h) => h.day === date.getDay());
}

export function isClosedDay(hours: WorkingDay[], date: Date): boolean {
  return !workingDayFor(hours, date)?.open;
}

export function bookingWindow(now: Date) {
  const from = startOfDay(now);
  return { from, to: addDays(from, BOOKING_WINDOW_DAYS) };
}

/**
 * Lists every start time on `date` where at least one of `staffIds` is free for `durationMin`,
 * within working hours and respecting the minimum notice.
 */
export function computeSlots({
  date,
  durationMin,
  hours,
  busy,
  staffIds,
  now,
}: {
  date: Date;
  durationMin: number;
  hours: WorkingDay[];
  busy: BusyInterval[];
  staffIds: string[];
  now: Date;
}): Slot[] {
  const day = workingDayFor(hours, date);
  if (!day?.open || staffIds.length === 0) return [];
  const open = parseTime(date, day.start);
  const close = parseTime(date, day.end);
  const earliest = addMinutes(now, LEAD_TIME_MIN);

  const byStaff = new Map<string, BusyInterval[]>();
  for (const b of busy) {
    if (!staffIds.includes(b.staffId)) continue;
    if (b.end <= open || b.start >= close) continue;
    const list = byStaff.get(b.staffId) ?? [];
    list.push(b);
    byStaff.set(b.staffId, list);
  }

  const slots: Slot[] = [];
  for (
    let start = open;
    !isBefore(close, addMinutes(start, durationMin));
    start = addMinutes(start, SLOT_STEP_MIN)
  ) {
    if (isBefore(start, earliest)) continue;
    const end = addMinutes(start, durationMin);
    const free = staffIds.filter(
      (id) => !(byStaff.get(id) ?? []).some((b) => b.start < end && b.end > start),
    );
    if (free.length) slots.push({ start, staffIds: free });
  }
  return slots;
}

/** Splits slots into morning / afternoon / evening groups for display. */
export function groupSlots(slots: Slot[]) {
  const groups: { label: string; slots: Slot[] }[] = [
    { label: "Morning", slots: [] },
    { label: "Afternoon", slots: [] },
    { label: "Evening", slots: [] },
  ];
  for (const slot of slots) {
    const h = slot.start.getHours();
    groups[h < 12 ? 0 : h < 17 ? 1 : 2].slots.push(slot);
  }
  return groups.filter((g) => g.slots.length);
}

/** Builds a minimal iCalendar file so the client can add the booking to their calendar. */
export function buildIcs({
  id,
  title,
  description,
  location,
  start,
  end,
}: {
  id: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
}): string {
  const stamp = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlowDesk//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${id}@flowdesk`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(description)}`,
    `LOCATION:${escape(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
