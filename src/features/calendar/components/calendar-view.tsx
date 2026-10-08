"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, ListFilterIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Kbd } from "@/components/kbd";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Appointment } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useLookups, useScoped } from "@/lib/store/hooks";
import { useUiStore, type AppointmentDraft } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";
import { isTypingTarget } from "@/features/dashboard/hooks/use-global-shortcuts";
import { PageContainer } from "@/features/dashboard/components/page-header";
import {
  END_HOUR,
  SLOT_MIN,
  SLOT_PX,
  START_HOUR,
  markDragEnded,
  minutesIntoDay,
  rangeTitle,
  shiftDate,
  visibleRange,
  type CalendarView as View,
} from "../lib";
import { appointmentStatuses, statusMeta } from "../status";
import { MonthGrid } from "./month-grid";
import { TimeGrid, type GridColumn } from "./time-grid";

export type Lookups = ReturnType<typeof useLookups>;

const VIEW_KEY = "flowdesk-calendar-view";

const snapToSlots: Modifier = ({ transform }) => ({
  ...transform,
  y: Math.round(transform.y / SLOT_PX) * SLOT_PX,
});

export function CalendarView() {
  const business = useActiveBusiness();
  const appointments = useScoped("appointments");
  const staff = useScoped("staff");
  const lookups = useLookups();
  const updateAppointment = useAppStore((s) => s.updateAppointment);
  const openNewAppointment = useUiStore((s) => s.openNewAppointment);
  const openEditAppointment = useUiStore((s) => s.openEditAppointment);

  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(() => new Date());
  const [hiddenStaff, setHiddenStaff] = useState<string[]>([]);
  const [showCancelled, setShowCancelled] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_KEY) as View | null;
    const preferred = window.matchMedia("(max-width: 767px)").matches ? "day" : stored;
    if (preferred === "day" || preferred === "week" || preferred === "month") {
      // Restoring a client-only preference after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(preferred);
    }
  }, []);

  const changeView = useCallback((next: View) => {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  }, []);

  const activeStaff = useMemo(() => staff.filter((m) => m.active), [staff]);
  const visibleStaff = useMemo(
    () => activeStaff.filter((m) => !hiddenStaff.includes(m.id)),
    [activeStaff, hiddenStaff],
  );
  const { from, to } = useMemo(() => {
    const range = visibleRange(date, view);
    return view === "month" ? { from: range.from, to: addDays(range.from, 42) } : range;
  }, [date, view]);

  const inRange = useMemo(() => {
    const visibleIds = new Set(visibleStaff.map((m) => m.id));
    return appointments.filter((a) => {
      const start = new Date(a.start);
      return (
        start >= from &&
        start < to &&
        visibleIds.has(a.staffId) &&
        (showCancelled || a.status !== "cancelled")
      );
    });
  }, [appointments, from, to, visibleStaff, showCancelled]);

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of [...inRange].sort((x, y) => x.start.localeCompare(y.start))) {
      const key = format(new Date(a.start), "yyyy-MM-dd");
      const list = map.get(key);
      if (list) list.push(a);
      else map.set(key, [a]);
    }
    return map;
  }, [inRange]);

  const columns = useMemo<GridColumn[]>(() => {
    if (view === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const day = addDays(from, i);
        const today = isToday(day);
        return {
          id: `col:${format(day, "yyyy-MM-dd")}`,
          date: day,
          label: (
            <button
              type="button"
              onClick={() => {
                setDate(day);
                changeView("day");
              }}
              className="mx-auto flex flex-col items-center rounded-md px-2 py-0.5 hover:bg-muted"
              aria-label={`Open ${format(day, "EEEE d MMMM")} in day view`}
            >
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-sm font-semibold tabular-nums",
                  today && "bg-primary text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </span>
            </button>
          ),
          appointments: byDay.get(format(day, "yyyy-MM-dd")) ?? [],
        };
      });
    }
    const dayKey = format(from, "yyyy-MM-dd");
    const dayAppointments = byDay.get(dayKey) ?? [];
    return visibleStaff.map((member) => {
      const list = dayAppointments.filter((a) => a.staffId === member.id);
      return {
        id: `col:${dayKey}:${member.id}`,
        date: from,
        staffId: member.id,
        label: (
          <span className="flex items-center justify-center gap-2 text-sm font-medium">
            <span className="size-2 rounded-full" style={{ backgroundColor: member.color }} />
            <span className="truncate">{member.name}</span>
          </span>
        ),
        sublabel: `${list.filter((a) => a.status !== "cancelled").length} bookings`,
        appointments: list,
      };
    });
  }, [view, from, byDay, visibleStaff, changeView]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = useCallback(
    async ({ active, over, delta }: DragEndEvent) => {
      markDragEnded();
      const appointment = (active.data.current as { appointment?: Appointment } | undefined)?.appointment;
      const target = over?.data.current as
        { kind: "grid" | "month"; date: string; staffId?: string } | undefined;
      if (!appointment || !target) return;

      const oldStart = new Date(appointment.start);
      const duration = differenceInMinutes(new Date(appointment.end), oldStart);
      const day = parse(target.date, "yyyy-MM-dd", new Date());
      let minutes = minutesIntoDay(oldStart);
      if (target.kind === "grid") {
        minutes += Math.round(delta.y / SLOT_PX) * SLOT_MIN;
        minutes = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - duration, minutes));
      }
      const newStart = new Date(day);
      newStart.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      const staffId = target.staffId ?? appointment.staffId;
      if (newStart.getTime() === oldStart.getTime() && staffId === appointment.staffId) return;

      const previous = { start: appointment.start, end: appointment.end, staffId: appointment.staffId };
      const ok = await updateAppointment(appointment.id, {
        start: newStart.toISOString(),
        end: addMinutes(newStart, duration).toISOString(),
        staffId,
      });
      if (!ok) return;
      const client = lookups.clientById.get(appointment.clientId)?.name ?? "Booking";
      const member = staffId !== appointment.staffId ? ` with ${lookups.staffById.get(staffId)?.name}` : "";
      toast.success(
        `${client} moved to ${format(newStart, isSameDay(newStart, oldStart) ? "HH:mm" : "EEE d MMM, HH:mm")}${member}`,
        {
          action: { label: "Undo", onClick: () => void updateAppointment(appointment.id, previous) },
        },
      );
    },
    [updateAppointment, lookups],
  );

  const onCreate = useCallback((draft: AppointmentDraft) => openNewAppointment(draft), [openNewAppointment]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector("[role='dialog']")) return;
      const key = event.key.toLowerCase();
      if (event.key === "ArrowLeft") setDate((d) => shiftDate(d, view, -1));
      else if (event.key === "ArrowRight") setDate((d) => shiftDate(d, view, 1));
      else if (key === "t") setDate(new Date());
      else if (key === "d") changeView("day");
      else if (key === "w") changeView("week");
      else if (key === "m") changeView("month");
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, changeView]);

  const counts = useMemo(() => {
    const result = { total: 0, pending: 0 };
    for (const a of inRange) {
      if (a.status === "cancelled") continue;
      if (view === "month" && !isSameMonth(new Date(a.start), date)) continue;
      result.total += 1;
      if (a.status === "pending") result.pending += 1;
    }
    return result;
  }, [inRange, view, date]);

  return (
    <PageContainer className="max-w-none space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Previous"
                  onClick={() => setDate((d) => shiftDate(d, view, -1))}
                >
                  <ChevronLeftIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Previous <Kbd className="ml-1">←</Kbd>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-x"
              onClick={() => setDate(new Date())}
            >
              Today
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Next"
                  onClick={() => setDate((d) => shiftDate(d, view, 1))}
                >
                  <ChevronRightIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Next <Kbd className="ml-1">→</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl" aria-live="polite">
              {rangeTitle(date, view)}
            </h1>
            <p className="text-xs text-muted-foreground">
              {counts.total} bookings{counts.pending ? ` · ${counts.pending} pending` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilterIcon />
                Filter
                {hiddenStaff.length || !showCancelled ? (
                  <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {hiddenStaff.length + (showCancelled ? 0 : 1)}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Team</DropdownMenuLabel>
              {activeStaff.map((member) => (
                <DropdownMenuCheckboxItem
                  key={member.id}
                  checked={!hiddenStaff.includes(member.id)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) =>
                    setHiddenStaff((prev) =>
                      checked ? prev.filter((id) => id !== member.id) : [...prev, member.id],
                    )
                  }
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: member.color }} />
                  {member.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showCancelled}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(checked) => setShowCancelled(Boolean(checked))}
              >
                Show cancelled
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={(v) => v && changeView(v as View)}
            aria-label="Calendar view"
          >
            {(["day", "week", "month"] as const).map((v) => (
              <ToggleGroupItem key={v} value={v} className="px-3 capitalize" aria-label={`${v} view`}>
                {v}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button size="sm" onClick={() => openNewAppointment({ start: defaultDraftStart(date) })}>
            <PlusIcon /> Book
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} modifiers={view === "month" ? [] : [snapToSlots]} onDragEnd={onDragEnd}>
        {view === "month" ? (
          <MonthGrid
            month={date}
            from={from}
            appointmentsByDay={byDay}
            lookups={lookups}
            onOpen={openEditAppointment}
            onSelectDay={(d) => {
              setDate(d);
              changeView("day");
            }}
          />
        ) : visibleStaff.length === 0 && view === "day" ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            All team members are hidden. Adjust the filter to see bookings.
          </div>
        ) : (
          <TimeGrid
            key={`${view}-${format(from, "yyyy-MM-dd")}`}
            columns={columns}
            workingHours={business?.workingHours}
            lookups={lookups}
            showStaff={view === "week"}
            minColumnWidth={view === "week" ? 112 : 168}
            onCreate={onCreate}
            onOpen={openEditAppointment}
          />
        )}
      </DndContext>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {appointmentStatuses.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", statusMeta[s].dot)} />
            {statusMeta[s].label}
          </span>
        ))}
        <span className="ml-auto hidden md:inline">Drag to reschedule · click an empty slot to book</span>
      </div>
    </PageContainer>
  );
}

function defaultDraftStart(date: Date) {
  const start = new Date(date);
  if (isToday(start)) {
    const now = new Date();
    const minutes = Math.ceil((now.getHours() * 60 + now.getMinutes() + 30) / 15) * 15;
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  } else {
    start.setHours(9, 0, 0, 0);
  }
  return start.toISOString();
}
