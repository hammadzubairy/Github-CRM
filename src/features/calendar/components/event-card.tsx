"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import type { Appointment, Client, Service, StaffMember } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { isClickAfterDrag } from "../lib";
import { statusMeta } from "../status";

export interface EventCardProps {
  appointment: Appointment;
  client?: Client;
  service?: Service;
  staff?: StaffMember;
  variant: "block" | "chip";
  style?: React.CSSProperties;
  showStaff?: boolean;
  /** Narrow block in a crowded column: render color only. */
  dense?: boolean;
  onOpen: (appointment: Appointment) => void;
}

export const EventCard = memo(function EventCard({
  appointment,
  client,
  service,
  staff,
  variant,
  style,
  showStaff,
  dense,
  onOpen,
}: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment },
  });
  const start = new Date(appointment.start);
  const end = new Date(appointment.end);
  const color = service?.color ?? "var(--primary)";
  const muted = appointment.status === "cancelled" || appointment.status === "no_show";
  const compact = typeof style?.height === "number" && style.height < 44;
  const label = `${client?.name ?? "Client"}, ${service?.name ?? "Service"}, ${format(start, "EEEE d MMMM HH:mm")} to ${format(end, "HH:mm")}, ${statusMeta[appointment.status].label}`;

  const dragStyle: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 40 }
    : {};

  if (variant === "chip") {
    return (
      <button
        ref={setNodeRef}
        type="button"
        {...listeners}
        {...attributes}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          if (!isClickAfterDrag()) onOpen(appointment);
        }}
        style={{ ...style, ...dragStyle }}
        className={cn(
          "flex w-full touch-none items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-4 transition-colors hover:bg-muted",
          muted && "line-through opacity-50",
          isDragging && "relative bg-background opacity-90 shadow-lg ring-1 ring-border",
        )}
      >
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="shrink-0 text-muted-foreground tabular-nums">{format(start, "HH:mm")}</span>
        <span className="truncate font-medium">{client?.name}</span>
      </button>
    );
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      aria-label={label}
      title={dense ? label : undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (!isClickAfterDrag()) onOpen(appointment);
      }}
      style={{
        ...style,
        ...dragStyle,
        backgroundColor: `color-mix(in oklab, ${color} 14%, var(--background))`,
        borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
        borderLeftColor: color,
      }}
      className={cn(
        "group absolute touch-none overflow-hidden rounded-md border border-l-[3px] text-left",
        dense ? "px-0 py-0" : "px-1.5 py-1",
        "text-xs transition-shadow select-none hover:z-10 hover:shadow-md focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        muted && "opacity-55",
        appointment.status === "pending" && "border-dashed",
        isDragging ? "cursor-grabbing opacity-90 shadow-xl" : "cursor-grab",
      )}
    >
      {dense ? null : (
        <span className={cn("block truncate font-medium", muted && "line-through")}>
          {client?.name ?? "Client"}
          {compact ? (
            <span className="font-normal text-muted-foreground"> · {format(start, "HH:mm")}</span>
          ) : null}
        </span>
      )}
      {!compact && !dense ? (
        <>
          <span className="block truncate text-[11px] text-muted-foreground">
            {format(start, "HH:mm")} – {format(end, "HH:mm")} · {service?.name}
          </span>
          {showStaff && staff ? (
            <span className="block truncate text-[11px] text-muted-foreground">{staff.name}</span>
          ) : null}
        </>
      ) : null}
    </button>
  );
});
