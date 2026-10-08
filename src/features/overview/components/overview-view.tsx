"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";
import {
  ArrowDownRightIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarCheckIcon,
  CalendarPlusIcon,
  DollarSignIcon,
  UserPlusIcon,
  UserXIcon,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { initials, formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useLookups, useScoped } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";
import { activityIcons } from "@/features/dashboard/components/notifications-menu";
import { EmptyState, PageContainer, PageHeader } from "@/features/dashboard/components/page-header";
import { StatusBadge } from "@/features/calendar/status";
import { bookingsByService, computeKpis, ranges, revenueSeries, type RangeKey } from "../metrics";

function greeting(now: Date) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function KpiCard({
  label,
  value,
  change,
  icon: Icon,
  invert,
  percentPoints,
}: {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  invert?: boolean;
  percentPoints?: boolean;
}) {
  const up = change >= 0;
  const good = invert ? !up : up;
  const flat = Math.abs(change) < 0.0005;
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <CardDescription className="flex items-center gap-2 text-sm">
          <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </span>
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2 px-5">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
            flat
              ? "bg-muted text-muted-foreground"
              : good
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
          )}
          aria-label={`${up ? "Up" : "Down"} ${formatPercent(Math.abs(change))} versus previous period`}
        >
          {up ? <ArrowUpRightIcon className="size-3" /> : <ArrowDownRightIcon className="size-3" />}
          {percentPoints ? `${(Math.abs(change) * 100).toFixed(1)} pts` : formatPercent(Math.abs(change))}
        </span>
      </CardContent>
    </Card>
  );
}

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const serviceConfig = {
  bookings: { label: "Bookings", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function OverviewView() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [now] = useState(() => new Date());
  const business = useActiveBusiness();
  const profile = useAppStore((s) => s.profile);
  const appointments = useScoped("appointments");
  const clients = useScoped("clients");
  const services = useScoped("services");
  const activity = useScoped("activity");
  const { clientById, serviceById, staffById } = useLookups();
  const openNewAppointment = useUiStore((s) => s.openNewAppointment);
  const openEditAppointment = useUiStore((s) => s.openEditAppointment);

  const days = ranges.find((r) => r.key === range)!.days;
  const currency = business?.currency ?? "USD";

  const kpis = useMemo(
    () => computeKpis(appointments, clients, days, now),
    [appointments, clients, days, now],
  );
  const series = useMemo(() => revenueSeries(appointments, days, now), [appointments, days, now]);
  const byService = useMemo(
    () => bookingsByService(appointments, services, days, now),
    [appointments, services, days, now],
  );

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => new Date(a.start) >= now && (a.status === "confirmed" || a.status === "pending"))
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 6),
    [appointments, now],
  );
  const recent = useMemo(
    () => [...activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7),
    [activity],
  );
  const todayCount = useMemo(
    () => appointments.filter((a) => isToday(new Date(a.start)) && a.status !== "cancelled").length,
    [appointments],
  );

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting(now)}, ${profile.name.split(" ")[0]}`}
        description={
          <>
            {todayCount ? `${todayCount} appointments on the books today` : "No appointments today"} at{" "}
            {business?.name}.
          </>
        }
        actions={
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={range}
            onValueChange={(v) => v && setRange(v as RangeKey)}
            aria-label="Date range"
          >
            {ranges.map((r) => (
              <ToggleGroupItem key={r.key} value={r.key} className="px-3">
                {r.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          icon={DollarSignIcon}
          value={formatCurrency(kpis.revenue.value, currency)}
          change={kpis.revenue.change}
        />
        <KpiCard
          label="Bookings"
          icon={CalendarCheckIcon}
          value={formatNumber(kpis.bookings.value)}
          change={kpis.bookings.change}
        />
        <KpiCard
          label="New clients"
          icon={UserPlusIcon}
          value={formatNumber(kpis.newClients.value)}
          change={kpis.newClients.change}
        />
        <KpiCard
          label="No-show rate"
          icon={UserXIcon}
          value={formatPercent(kpis.noShowRate.value)}
          change={kpis.noShowRate.change}
          invert
          percentPoints
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>
              {days > 31 ? "Weekly" : "Daily"} revenue from attended appointments, last {days} days
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full">
              <AreaChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(v: number) => formatCurrency(v, currency, true)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => (
                        <span className="flex w-full justify-between gap-4">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(Number(value), currency)}
                          </span>
                        </span>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  fill="url(#fill-revenue)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings by service</CardTitle>
            <CardDescription>Top services, last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            {byService.length ? (
              <ChartContainer config={serviceConfig} className="aspect-auto h-64 w-full">
                <BarChart data={byService} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={112}
                    tickFormatter={(v: string) => (v.length > 15 ? `${v.slice(0, 13)}…` : v)}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
                  <Bar dataKey="bookings" radius={6} barSize={18}>
                    {byService.map((s) => (
                      <Cell key={s.id} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState
                icon={CalendarCheckIcon}
                title="No bookings yet"
                description="Bookings will show up here."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming appointments</CardTitle>
            <CardDescription>Next on the schedule</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/calendar">
                  Calendar <ArrowRightIcon />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {upcoming.length ? (
              <ul className="-mx-2 divide-y">
                {upcoming.map((appt) => {
                  const client = clientById.get(appt.clientId);
                  const service = serviceById.get(appt.serviceId);
                  const member = staffById.get(appt.staffId);
                  const start = new Date(appt.start);
                  const when = isToday(start)
                    ? "Today"
                    : isTomorrow(start)
                      ? "Tomorrow"
                      : format(start, "EEE d MMM");
                  return (
                    <li key={appt.id}>
                      <button
                        type="button"
                        onClick={() => openEditAppointment(appt)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                          {initials(client?.name ?? "?")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {client?.name ?? "Unknown client"}
                          </span>
                          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                            <span
                              className="size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: service?.color }}
                            />
                            {service?.name} · {member?.name.split(" ")[0]}
                          </span>
                        </span>
                        <span className="hidden sm:block">
                          <StatusBadge status={appt.status} />
                        </span>
                        <span className="w-24 shrink-0 text-right">
                          <span className="block text-sm font-medium tabular-nums">
                            {format(start, "HH:mm")}
                          </span>
                          <span className="block text-xs text-muted-foreground">{when}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={CalendarPlusIcon}
                title="Nothing scheduled"
                description="New bookings from your booking page will appear here."
                action={
                  <Button size="sm" onClick={() => openNewAppointment()}>
                    New booking
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>What happened lately</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length ? (
              <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
                {recent.map((item) => {
                  const meta = activityIcons[item.type] ?? activityIcons.booking_created;
                  return (
                    <li key={item.id} className="relative flex gap-3">
                      <span
                        className={cn(
                          "relative grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card",
                          meta.tone,
                        )}
                      >
                        <meta.icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 pt-1">
                        <p className="text-sm leading-snug">{item.message}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState icon={CalendarCheckIcon} title="No activity yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
