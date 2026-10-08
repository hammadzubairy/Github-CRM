"use client";

import { useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format, isToday } from "date-fns";
import type { Appointment, WorkingDay } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import type { AppointmentDraft } from "@/lib/store/ui-store";
import {
  END_HOUR,
  GRID_HEIGHT,
  HOUR_PX,
  SLOT_MIN,
  SLOT_PX,
  START_HOUR,
  closedRanges,
  layoutColumn,
  minutesIntoDay,
  topFor,
} from "../lib";
import { EventCard } from "./event-card";
import type { Lookups } from "./calendar-view";

export interface GridColumn {
  id: string;
  date: Date;
  staffId?: string;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  appointments: Appointment[];
}

const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Column({
  column,
  workingHours,
  lookups,
  showStaff,
  onCreate,
  onOpen,
  now,
}: {
  column: GridColumn;
  workingHours?: WorkingDay[];
  lookups: Lookups;
  showStaff: boolean;
  onCreate: (draft: AppointmentDraft) => void;
  onOpen: (appointment: Appointment) => void;
  now: Date;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { kind: "grid", date: format(column.date, "yyyy-MM-dd"), staffId: column.staffId },
  });
  const positioned = layoutColumn(column.appointments);
  const showNow =
    isToday(column.date) && minutesIntoDay(now) >= START_HOUR * 60 && minutesIntoDay(now) < END_HOUR * 60;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const slot = Math.floor((event.clientY - rect.top) / SLOT_PX);
    const minutes = START_HOUR * 60 + slot * SLOT_MIN;
    const start = new Date(column.date);
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    onCreate({ start: start.toISOString(), staffId: column.staffId });
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={cn(
        "relative min-w-0 cursor-pointer border-l transition-colors",
        isOver && "bg-primary/[0.04]",
      )}
      style={{ height: GRID_HEIGHT }}
      aria-label={`${format(column.date, "EEEE d MMMM")}${column.staffId ? `, ${lookups.staffById.get(column.staffId)?.name}` : ""}`}
      role="group"
    >
      {closedRanges(column.date, workingHours).map((range) => (
        <div
          key={range.top}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(-45deg,transparent_0_6px,var(--color-muted)_6px_7px)] opacity-70"
          style={{ top: range.top, height: range.height }}
        />
      ))}
      {positioned.map(({ appointment, top, height, lane, lanes }) => (
        <EventCard
          key={appointment.id}
          appointment={appointment}
          client={lookups.clientById.get(appointment.clientId)}
          service={lookups.serviceById.get(appointment.serviceId)}
          staff={lookups.staffById.get(appointment.staffId)}
          variant="block"
          showStaff={showStaff}
          dense={showStaff && lanes >= 3}
          onOpen={onOpen}
          style={{
            top: top + 1,
            height: height - 2,
            left: `calc(${(lane / lanes) * 100}% + 2px)`,
            width: `calc(${100 / lanes}% - 4px)`,
          }}
        />
      ))}
      {showNow ? (
        <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: topFor(now) }} aria-hidden>
          <div className="relative h-px bg-rose-500">
            <span className="absolute -top-[4px] -left-[4px] size-2 rounded-full bg-rose-500" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TimeGrid({
  columns,
  workingHours,
  lookups,
  showStaff,
  minColumnWidth,
  onCreate,
  onOpen,
}: {
  columns: GridColumn[];
  workingHours?: WorkingDay[];
  lookups: Lookups;
  showStaff: boolean;
  minColumnWidth: number;
  onCreate: (draft: AppointmentDraft) => void;
  onOpen: (appointment: Appointment) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = useNow();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nowTop = topFor(new Date());
    el.scrollTop = nowTop > 0 && nowTop < GRID_HEIGHT ? Math.max(0, nowTop - HOUR_PX * 1.5) : HOUR_PX;
  }, []);

  const template = `3.5rem repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))`;

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[calc(100svh-13rem)] min-h-[28rem] overflow-auto rounded-xl border bg-card"
    >
      <div className="min-w-fit">
        <div
          className="sticky top-0 z-30 grid border-b bg-card/95 backdrop-blur"
          style={{ gridTemplateColumns: template }}
        >
          <div className="sticky left-0 z-10 bg-card/95" />
          {columns.map((column) => (
            <div key={column.id} className="border-l px-2 py-2 text-center">
              {column.label}
              {column.sublabel ? (
                <div className="text-xs text-muted-foreground">{column.sublabel}</div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: template }}>
          <div className="sticky left-0 z-20 bg-card" style={{ height: GRID_HEIGHT }} aria-hidden>
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative pr-2 text-right text-[11px] text-muted-foreground tabular-nums"
                style={{ height: HOUR_PX }}
              >
                <span className="relative -top-2">
                  {hour === START_HOUR ? "" : `${String(hour).padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>
          {columns.map((column) => (
            <div key={column.id} className="relative">
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                {hours.map((hour) => (
                  <div key={hour} className="border-b border-border/60" style={{ height: HOUR_PX }}>
                    <div
                      className="border-b border-dashed border-border/30"
                      style={{ height: HOUR_PX / 2 }}
                    />
                  </div>
                ))}
              </div>
              <Column
                column={column}
                workingHours={workingHours}
                lookups={lookups}
                showStaff={showStaff}
                onCreate={onCreate}
                onOpen={onOpen}
                now={now}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
