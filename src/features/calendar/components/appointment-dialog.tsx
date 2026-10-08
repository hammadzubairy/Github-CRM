"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addMinutes, format, isSameDay, parse, roundToNearestMinutes } from "date-fns";
import { AlertTriangleIcon, CalendarIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { newId } from "@/lib/demo/random";
import type { Appointment, Client } from "@/lib/data/types";
import { formatCurrency, formatDuration } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useLookups, useScoped } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { ClientPicker, NEW_CLIENT_PREFIX } from "@/features/clients/components/client-picker";
import { appointmentStatuses, statusMeta } from "../status";

const schema = z.object({
  clientId: z.string().min(1, "Choose or add a client"),
  serviceId: z.string().min(1, "Choose a service"),
  staffId: z.string().min(1, "Choose a team member"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a time"),
  status: z.enum(["confirmed", "pending", "completed", "cancelled", "no_show"]),
  notes: z.string().max(500, "Keep notes under 500 characters"),
});

type Values = z.infer<typeof schema>;

const timeSlots = Array.from({ length: (21 - 7) * 4 + 1 }, (_, i) => {
  const minutes = 7 * 60 + i * 15;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

function toDate(date: string, time: string) {
  return parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
}

export function AppointmentDialog() {
  const { open, appointment, draft } = useUiStore((s) => s.appointmentDialog);
  const close = useUiStore((s) => s.closeAppointmentDialog);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-xl">
        {open ? (
          <AppointmentForm
            key={appointment?.id ?? `new-${draft?.start ?? ""}`}
            appointment={appointment}
            draft={draft}
            onDone={close}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AppointmentForm({
  appointment,
  draft,
  onDone,
}: {
  appointment: Appointment | null;
  draft: { start?: string; staffId?: string; clientId?: string } | null;
  onDone: () => void;
}) {
  const business = useActiveBusiness();
  const services = useScoped("services");
  const staff = useScoped("staff");
  const clients = useScoped("clients");
  const appointments = useScoped("appointments");
  const { clientById } = useLookups();
  const saveAppointment = useAppStore((s) => s.saveAppointment);
  const deleteAppointment = useAppStore((s) => s.deleteAppointment);
  const saveClient = useAppStore((s) => s.saveClient);
  const logActivity = useAppStore((s) => s.logActivity);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeServices = useMemo(
    () => services.filter((s) => s.active || s.id === appointment?.serviceId),
    [services, appointment],
  );
  const activeStaff = useMemo(
    () => staff.filter((m) => m.active || m.id === appointment?.staffId),
    [staff, appointment],
  );

  const defaults = useMemo<Values>(() => {
    if (appointment) {
      const start = new Date(appointment.start);
      return {
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        staffId: appointment.staffId,
        date: format(start, "yyyy-MM-dd"),
        time: format(start, "HH:mm"),
        status: appointment.status,
        notes: appointment.notes,
      };
    }
    const start = draft?.start
      ? new Date(draft.start)
      : roundToNearestMinutes(addMinutes(new Date(), 30), { nearestTo: 15, roundingMethod: "ceil" });
    const firstService = activeServices[0];
    const staffId =
      draft?.staffId ??
      activeStaff.find((m) => firstService && m.serviceIds.includes(firstService.id))?.id ??
      activeStaff[0]?.id ??
      "";
    const time = format(start, "HH:mm");
    return {
      clientId: draft?.clientId ?? "",
      serviceId: firstService?.id ?? "",
      staffId,
      date: format(start, "yyyy-MM-dd"),
      time: timeSlots.includes(time) ? time : "09:00",
      status: "confirmed",
      notes: "",
    };
    // Defaults are computed once per dialog instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const { control, handleSubmit, setValue, formState } = form;
  const [serviceId, staffId, date, time] = useWatch({
    control,
    name: ["serviceId", "staffId", "date", "time"],
  });
  const service = activeServices.find((s) => s.id === serviceId);

  const staffForService = useMemo(
    () => (service ? activeStaff.filter((m) => m.serviceIds.includes(service.id)) : activeStaff),
    [activeStaff, service],
  );

  useEffect(() => {
    if (staffForService.length && !staffForService.some((m) => m.id === staffId)) {
      setValue("staffId", staffForService[0].id);
    }
  }, [staffForService, staffId, setValue]);

  const conflict = useMemo(() => {
    if (!service || !date || !time) return null;
    const start = toDate(date, time);
    const end = addMinutes(start, service.durationMin);
    return appointments.find(
      (a) =>
        a.id !== appointment?.id &&
        a.staffId === staffId &&
        a.status !== "cancelled" &&
        new Date(a.start) < end &&
        new Date(a.end) > start,
    );
  }, [appointments, appointment, service, staffId, date, time]);

  const onSubmit = handleSubmit(async (values) => {
    if (!business || !service) return;
    let clientId = values.clientId;
    let createdClient: Client | null = null;
    if (clientId.startsWith(NEW_CLIENT_PREFIX)) {
      const name = clientId.slice(NEW_CLIENT_PREFIX.length);
      createdClient = {
        id: newId(),
        businessId: business.id,
        name,
        email: "",
        phone: "",
        status: "new",
        tags: [],
        createdAt: new Date().toISOString(),
      };
      clientId = createdClient.id;
      const ok = await saveClient(createdClient);
      if (!ok) return;
      logActivity("client_created", `${name} was added as a new client`);
    }

    const start = toDate(values.date, values.time);
    const next: Appointment = {
      id: appointment?.id ?? newId(),
      businessId: business.id,
      clientId,
      staffId: values.staffId,
      serviceId: values.serviceId,
      start: start.toISOString(),
      end: addMinutes(start, service.durationMin).toISOString(),
      status: values.status,
      price: appointment && appointment.serviceId === values.serviceId ? appointment.price : service.price,
      notes: values.notes,
      source: appointment?.source ?? "manual",
      createdAt: appointment?.createdAt ?? new Date().toISOString(),
    };

    onDone();
    const ok = await saveAppointment(next);
    if (!ok) return;
    const clientName = createdClient?.name ?? clientById.get(clientId)?.name ?? "Client";
    if (!appointment) {
      logActivity("booking_created", `${clientName} booked ${service.name}`);
      toast.success("Booking created", {
        description: `${clientName} · ${format(start, "EEE d MMM, HH:mm")}`,
      });
    } else {
      if (appointment.status !== next.status && next.status === "cancelled") {
        logActivity("booking_cancelled", `${clientName} cancelled ${service.name}`);
      } else if (appointment.status !== next.status && next.status === "completed") {
        logActivity("booking_completed", `${clientName} completed ${service.name}`);
      }
      toast.success("Booking updated");
    }
  });

  const onDelete = async () => {
    if (!appointment) return;
    onDone();
    const ok = await deleteAppointment(appointment.id);
    if (ok) toast.success("Booking deleted");
  };

  const selectedDate = date ? parse(date, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{appointment ? "Edit booking" : "New booking"}</DialogTitle>
        <DialogDescription>
          {appointment
            ? "Update the details or reschedule this appointment."
            : "Schedule an appointment for a new or existing client."}
        </DialogDescription>
      </DialogHeader>

      <form id="appointment-form" onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-4">
          <Controller
            control={control}
            name="clientId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="appt-client">Client</FieldLabel>
                <ClientPicker
                  id="appt-client"
                  clients={clients}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="serviceId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="appt-service">Service</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="appt-service" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeServices.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                          <span className="text-muted-foreground">· {formatDuration(s.durationMin)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="staffId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="appt-staff">With</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="appt-staff" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Choose a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffForService.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="date"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="appt-date">Date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="appt-date"
                        type="button"
                        variant="outline"
                        className="w-full justify-start font-normal"
                      >
                        <CalendarIcon className="text-muted-foreground" />
                        {selectedDate ? format(selectedDate, "EEE d MMM") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        defaultMonth={selectedDate}
                        onSelect={(d) => d && field.onChange(format(d, "yyyy-MM-dd"))}
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="time"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="appt-time">Time</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="appt-time" className="w-full">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="appt-status">Status</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="appt-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {appointmentStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className={`size-2 rounded-full ${statusMeta[s].dot}`} />
                          {statusMeta[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <Controller
            control={control}
            name="notes"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="appt-notes">Notes</FieldLabel>
                <Textarea id="appt-notes" rows={2} placeholder="Anything the team should know" {...field} />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />

          {service ? (
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {date && time
                  ? `${format(toDate(date, time), "HH:mm")} – ${format(addMinutes(toDate(date, time), service.durationMin), "HH:mm")}`
                  : null}
                {" · "}
                {formatDuration(service.durationMin)}
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(service.price, business?.currency)}
              </span>
            </div>
          ) : null}

          {conflict ? (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
            >
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              Overlaps with {clientById.get(conflict.clientId)?.name ?? "another booking"} at{" "}
              {format(
                new Date(conflict.start),
                isSameDay(new Date(conflict.start), toDate(date, time)) ? "HH:mm" : "d MMM HH:mm",
              )}
              . You can still save it.
            </p>
          ) : null}
        </FieldGroup>
      </form>

      <DialogFooter className="gap-2 sm:justify-between">
        {appointment ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2Icon /> Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" form="appointment-form" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {appointment ? "Save changes" : "Create booking"}
          </Button>
        </div>
      </DialogFooter>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              The appointment will be removed from the calendar. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
