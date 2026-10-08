import {
  addDays,
  addMonths,
  addWeeks,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Appointment, WorkingDay } from "@/lib/data/types";

export type CalendarView = "day" | "week" | "month";

export const START_HOUR = 7;
export const END_HOUR = 21;
export const HOUR_PX = 64;
export const SLOT_MIN = 15;
export const SLOT_PX = (HOUR_PX * SLOT_MIN) / 60;
export const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX;

export const weekOptions = { weekStartsOn: 1 } as const;

let lastDragEndedAt = 0;

export function markDragEnded() {
  lastDragEndedAt = Date.now();
}

/** A pointer release that ends a drag also fires a click on the dragged card. */
export function isClickAfterDrag() {
  return Date.now() - lastDragEndedAt < 300;
}

export function shiftDate(date: Date, view: CalendarView, dir: 1 | -1): Date {
  if (view === "day") return addDays(date, dir);
  if (view === "week") return addWeeks(date, dir);
  return addMonths(date, dir);
}

export function visibleRange(date: Date, view: CalendarView): { from: Date; to: Date } {
  if (view === "day") return { from: startOfDay(date), to: addDays(startOfDay(date), 1) };
  if (view === "week") {
    const from = startOfWeek(date, weekOptions);
    return { from, to: addDays(from, 7) };
  }
  const from = startOfWeek(startOfMonth(date), weekOptions);
  const to = addDays(endOfWeek(endOfMonth(date), weekOptions), 1);
  return { from, to };
}

export function rangeTitle(date: Date, view: CalendarView): string {
  if (view === "day") return format(date, "EEEE, d MMMM yyyy");
  if (view === "month") return format(date, "MMMM yyyy");
  const from = startOfWeek(date, weekOptions);
  const to = addDays(from, 6);
  if (isSameMonth(from, to)) return `${format(from, "d")} – ${format(to, "d MMMM yyyy")}`;
  return `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`;
}

export function minutesIntoDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function topFor(date: Date): number {
  return ((minutesIntoDay(date) - START_HOUR * 60) / 60) * HOUR_PX;
}

export interface PositionedAppointment {
  appointment: Appointment;
  top: number;
  height: number;
  lane: number;
  lanes: number;
}

/** Lays out overlapping appointments of a single column side by side. */
export function layoutColumn(appointments: Appointment[]): PositionedAppointment[] {
  const sorted = [...appointments].sort(
    (a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end),
  );
  const result: PositionedAppointment[] = [];
  let cluster: PositionedAppointment[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const lanes = laneEnds.length || 1;
    for (const item of cluster) item.lanes = lanes;
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const appointment of sorted) {
    const start = new Date(appointment.start);
    const end = new Date(appointment.end);
    if (start.getTime() >= clusterEnd) flush();
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start.getTime());
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end.getTime());
    } else {
      laneEnds[lane] = end.getTime();
    }
    clusterEnd = Math.max(clusterEnd, end.getTime());
    const top = Math.max(0, topFor(start));
    const bottom = Math.min(GRID_HEIGHT, topFor(start) + (differenceInMinutes(end, start) / 60) * HOUR_PX);
    cluster.push({ appointment, top, height: Math.max(SLOT_PX, bottom - top), lane, lanes: 1 });
  }
  flush();
  return result;
}

/** Returns shaded closed ranges (in px) for a day based on working hours. */
export function closedRanges(date: Date, hours: WorkingDay[] | undefined): { top: number; height: number }[] {
  const day = hours?.find((d) => d.day === date.getDay());
  if (!day || !day.open) return [{ top: 0, height: GRID_HEIGHT }];
  const toPx = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return Math.min(GRID_HEIGHT, Math.max(0, ((h * 60 + m - START_HOUR * 60) / 60) * HOUR_PX));
  };
  const open = toPx(day.start);
  const close = toPx(day.end);
  const ranges = [];
  if (open > 0) ranges.push({ top: 0, height: open });
  if (close < GRID_HEIGHT) ranges.push({ top: close, height: GRID_HEIGHT - close });
  return ranges;
}
