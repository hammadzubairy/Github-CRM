"use client";

import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { ClockIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, ScissorsIcon, Trash2Icon } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { Service } from "@/lib/data/types";
import { formatCurrency, formatDuration } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useScoped } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { EmptyState, PageContainer, PageHeader } from "@/features/dashboard/components/page-header";
import { ServiceDialog } from "./service-dialog";

export function ServicesView() {
  const business = useActiveBusiness();
  const services = useScoped("services");
  const staff = useScoped("staff");
  const appointments = useScoped("appointments");
  const saveService = useAppStore((s) => s.saveService);
  const deleteService = useAppStore((s) => s.deleteService);
  const [dialog, setDialog] = useState<{ open: boolean; service: Service | null }>({
    open: false,
    service: null,
  });
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const [now] = useState(() => new Date());
  const currency = business?.currency ?? "USD";

  const bookings30d = useMemo(() => {
    const since = subDays(now, 30).toISOString();
    const counts = new Map<string, number>();
    for (const a of appointments) {
      if (a.start >= since && a.start <= now.toISOString() && a.status !== "cancelled") {
        counts.set(a.serviceId, (counts.get(a.serviceId) ?? 0) + 1);
      }
    }
    return counts;
  }, [appointments, now]);

  const groups = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of [...services].sort((a, b) => a.name.localeCompare(b.name))) {
      const key = s.category || "Other";
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [services]);

  const categories = groups.map(([name]) => name);

  const toggleActive = async (service: Service, active: boolean) => {
    const ok = await saveService({ ...service, active });
    if (ok)
      toast.success(
        active ? `${service.name} is bookable online` : `${service.name} hidden from booking page`,
      );
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const service = pendingDelete;
    setPendingDelete(null);
    const ok = await deleteService(service.id);
    if (ok) toast.success("Service deleted", { description: service.name });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Services"
        description="What clients can book, how long it takes and what it costs."
        actions={
          <Button size="sm" onClick={() => setDialog({ open: true, service: null })}>
            <PlusIcon /> New service
          </Button>
        }
      />

      {services.length === 0 ? (
        <EmptyState
          icon={ScissorsIcon}
          title="No services yet"
          description="Add your first service so clients can start booking online."
          action={
            <Button size="sm" onClick={() => setDialog({ open: true, service: null })}>
              <PlusIcon /> Add a service
            </Button>
          }
        />
      ) : (
        groups.map(([category, items]) => (
          <section key={category} aria-labelledby={`cat-${category}`} className="space-y-3">
            <h2 id={`cat-${category}`} className="text-sm font-medium text-muted-foreground">
              {category} <span className="text-muted-foreground/60">· {items.length}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((service) => {
                const providers = staff.filter((m) => m.serviceIds.includes(service.id));
                return (
                  <li
                    key={service.id}
                    className={cn(
                      "group relative flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm",
                      !service.active && "opacity-70",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: service.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium">{service.name}</h3>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                          {service.description || "No description"}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${service.name}`}
                            className="-mt-1 -mr-1"
                          >
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setDialog({ open: true, service })}>
                            <PencilIcon /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(service)}>
                            <Trash2Icon /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ClockIcon className="size-3.5" /> {formatDuration(service.durationMin)}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(service.price, currency)}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {bookings30d.get(service.id) ?? 0} bookings / 30d
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <div
                        className="flex -space-x-1.5"
                        aria-label={`${providers.length} team members offer this`}
                      >
                        {providers.slice(0, 4).map((m) => (
                          <span
                            key={m.id}
                            title={m.name}
                            className="grid size-6 place-items-center rounded-full text-[9px] font-semibold text-white ring-2 ring-card"
                            style={{ backgroundColor: m.color }}
                          >
                            {m.name.charAt(0)}
                          </span>
                        ))}
                        {providers.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No one assigned</span>
                        ) : null}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Online
                        <Switch
                          checked={service.active}
                          onCheckedChange={(v) => toggleActive(service, v)}
                          aria-label={`Bookable online: ${service.name}`}
                        />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      <ServiceDialog
        open={dialog.open}
        service={dialog.service}
        categories={categories}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Past appointments keep their history, but clients won&apos;t be able to book this service
              anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
