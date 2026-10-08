"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, differenceInMinutes, startOfWeek } from "date-fns";
import {
  MailIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SparklesIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersRoundIcon,
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import type { StaffMember, WorkingDay } from "@/lib/data/types";
import { formatCurrency, initials } from "@/lib/format";
import { getPlan } from "@/lib/plans";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useScoped } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { EmptyState, PageContainer, PageHeader } from "@/features/dashboard/components/page-header";
import { roleMeta } from "../roles";
import { StaffDialog } from "./staff-dialog";

function weeklyOpenMinutes(hours: WorkingDay[] | undefined) {
  if (!hours) return 40 * 60;
  return hours.reduce((sum, d) => {
    if (!d.open) return sum;
    const [sh, sm] = d.start.split(":").map(Number);
    const [eh, em] = d.end.split(":").map(Number);
    return sum + (eh * 60 + em - (sh * 60 + sm));
  }, 0);
}

export function StaffView() {
  const router = useRouter();
  const business = useActiveBusiness();
  const staff = useScoped("staff");
  const services = useScoped("services");
  const appointments = useScoped("appointments");
  const deleteStaff = useAppStore((s) => s.deleteStaff);
  const [dialog, setDialog] = useState<{ open: boolean; member: StaffMember | null }>({
    open: false,
    member: null,
  });
  const [pendingDelete, setPendingDelete] = useState<StaffMember | null>(null);
  const [now] = useState(() => new Date());
  const plan = getPlan(business?.plan ?? "free");
  const seatLimit = plan.limits.staff;
  const atLimit = seatLimit !== null && staff.length >= seatLimit;
  const currency = business?.currency ?? "USD";

  const stats = useMemo(() => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);
    const openMinutes = weeklyOpenMinutes(business?.workingHours);
    const map = new Map<string, { bookings: number; minutes: number; revenue: number }>();
    for (const a of appointments) {
      const start = new Date(a.start);
      if (start < weekStart || start >= weekEnd || a.status === "cancelled") continue;
      const s = map.get(a.staffId) ?? { bookings: 0, minutes: 0, revenue: 0 };
      s.bookings += 1;
      s.minutes += differenceInMinutes(new Date(a.end), start);
      s.revenue += a.price;
      map.set(a.staffId, s);
    }
    return { map, openMinutes };
  }, [appointments, business?.workingHours, now]);

  const sorted = useMemo(
    () =>
      [...staff].sort(
        (a, b) =>
          ["owner", "admin", "staff"].indexOf(a.role) - ["owner", "admin", "staff"].indexOf(b.role) ||
          a.name.localeCompare(b.name),
      ),
    [staff],
  );

  const openNew = () => {
    if (atLimit) {
      toast.info(`The ${plan.name} plan includes ${seatLimit} staff ${seatLimit === 1 ? "seat" : "seats"}`, {
        description: "Upgrade to add more team members.",
        action: { label: "Upgrade", onClick: () => router.push("/app/billing") },
      });
      return;
    }
    setDialog({ open: true, member: null });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const member = pendingDelete;
    setPendingDelete(null);
    const ok = await deleteStaff(member.id);
    if (ok) toast.success(`${member.name} removed from the team`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Staff"
        description={
          seatLimit === null
            ? `${staff.length} team members · unlimited seats on ${plan.name}`
            : `${staff.length} of ${seatLimit} seats used on the ${plan.name} plan`
        }
        actions={
          <Button size="sm" onClick={openNew}>
            <UserPlusIcon /> Add member
          </Button>
        }
      />

      {atLimit ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4 sm:flex-row sm:items-center">
          <SparklesIcon className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm">
            You&apos;re using every seat on the <span className="font-medium">{plan.name}</span> plan. Upgrade
            to grow your team.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/app/billing">View plans</Link>
          </Button>
        </div>
      ) : null}

      {staff.length === 0 ? (
        <EmptyState
          icon={UsersRoundIcon}
          title="No team members"
          description="Add the people who take appointments so clients can book them."
          action={
            <Button size="sm" onClick={openNew}>
              <UserPlusIcon /> Add member
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((member) => {
            const s = stats.map.get(member.id) ?? { bookings: 0, minutes: 0, revenue: 0 };
            const utilization = stats.openMinutes
              ? Math.min(100, Math.round((s.minutes / stats.openMinutes) * 100))
              : 0;
            const offered = services.filter((svc) => member.serviceIds.includes(svc.id));
            const role = roleMeta[member.role];
            return (
              <li
                key={member.id}
                className={cn("flex flex-col rounded-xl border bg-card p-5", !member.active && "opacity-70")}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {initials(member.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{member.name}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                          role.className,
                        )}
                      >
                        {role.label}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {member.title || "Team member"}
                      {!member.active ? " · Inactive" : ""}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${member.name}`}
                        className="-mt-1 -mr-1"
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setDialog({ open: true, member })}>
                        <PencilIcon /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`mailto:${member.email}`}>
                          <MailIcon /> Email
                        </a>
                      </DropdownMenuItem>
                      {member.role !== "owner" ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(member)}>
                            <Trash2Icon /> Remove
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["This week", String(s.bookings)],
                    ["Booked", `${Math.round(s.minutes / 60)}h`],
                    ["Revenue", formatCurrency(s.revenue, currency, true)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-muted/50 px-2 py-2">
                      <dt className="text-[11px] text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Utilization this week</span>
                    <span className="font-medium tabular-nums">{utilization}%</span>
                  </div>
                  <Progress
                    value={utilization}
                    className="mt-1.5 h-1.5"
                    aria-label={`${member.name} utilization`}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-1 border-t pt-3">
                  {offered.length ? (
                    offered.map((svc) => (
                      <span
                        key={svc.id}
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: svc.color }} />
                        {svc.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No services assigned</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <StaffDialog
        open={dialog.open}
        member={dialog.member}
        services={services}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this workspace. Their past appointments stay in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
