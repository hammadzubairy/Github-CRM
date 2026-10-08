"use client";

import { useDroppable } from "@dnd-kit/core";
import { addDays, format, isSameMonth, isToday } from "date-fns";
import type { Appointment } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { EventCard } from "./event-card";
import type { Lookups } from "./calendar-view";

const MAX_VISIBLE = 3;
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function DayCell({
  date,
  month,
  appointments,
  lookups,
  onOpen,
  onSelectDay,
}: {
  date: Date;
  month: Date;
  appointments: Appointment[];
  lookups: Lookups;
  onOpen: (appointment: Appointment) => void;
  onSelectDay: (date: Date) => void;
}) {
  const key = format(date, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: `day:${key}`, data: { kind: "month", date: key } });
  const visible = appointments.slice(0, MAX_VISIBLE);
  const hidden = appointments.length - visible.length;
  const today = isToday(date);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-28 min-w-0 flex-col gap-0.5 border-t border-l p-1 transition-colors",
        !isSameMonth(date, month) && "bg-muted/30 text-muted-foreground",
        isOver && "bg-primary/[0.06]",
      )}
    >
      <button
        type="button"
        onClick={() => onSelectDay(date)}
        aria-label={`${format(date, "EEEE d MMMM")}, ${appointments.length} appointments. Open day view`}
        className={cn(
          "mb-0.5 ml-auto grid size-6 place-items-center rounded-full text-xs font-medium tabular-nums hover:bg-muted",
          today && "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        {format(date, "d")}
      </button>
      {visible.map((appointment) => (
        <EventCard
          key={appointment.id}
          appointment={appointment}
          client={lookups.clientById.get(appointment.clientId)}
          service={lookups.serviceById.get(appointment.serviceId)}
          variant="chip"
          onOpen={onOpen}
        />
      ))}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => onSelectDay(date)}
          className="rounded px-1.5 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          +{hidden} more
        </button>
      ) : null}
    </div>
  );
}

export function MonthGrid({
  month,
  from,
  appointmentsByDay,
  lookups,
  onOpen,
  onSelectDay,
}: {
  month: Date;
  from: Date;
  appointmentsByDay: Map<string, Appointment[]>;
  lookups: Lookups;
  onOpen: (appointment: Appointment) => void;
  onSelectDay: (date: Date) => void;
}) {
  const weeks = 6;
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(from, i));

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground">
          {weekdays.map((d) => (
            <div key={d} className="px-2 py-2 text-center first:border-l-0 [&:not(:first-child)]:border-l">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 [&>*:nth-child(7n+1)]:border-l-0">
          {days.map((date) => {
            const key = format(date, "yyyy-MM-dd");
            return (
              <DayCell
                key={key}
                date={date}
                month={month}
                appointments={appointmentsByDay.get(key) ?? []}
                lookups={lookups}
                onOpen={onOpen}
                onSelectDay={onSelectDay}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
