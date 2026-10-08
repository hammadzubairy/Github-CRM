"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { addDays, addMinutes, format, startOfDay } from "date-fns";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CalendarOffIcon,
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  InfoIcon,
  MapPinIcon,
  RotateCwIcon,
  SearchXIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDuration, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BOOKING_WINDOW_DAYS,
  bookingWindow,
  buildIcs,
  computeSlots,
  groupSlots,
  isClosedDay,
  type BusyInterval,
  type Slot,
} from "../availability";
import {
  useBookingSource,
  type BookingPage,
  type PublicService,
  type PublicStaff,
} from "../use-booking-source";
import type { DetailsValues } from "./details-form";

const DetailsForm = dynamic(() => import("./details-form").then((mod) => mod.DetailsForm), {
  ssr: false,
  loading: () => <DetailsFormSkeleton />,
});
const Calendar = dynamic(() => import("@/components/ui/calendar").then((mod) => mod.Calendar), {
  ssr: false,
  loading: () => <Skeleton className="h-[296px] w-[252px] rounded-lg" />,
});

type Step = "service" | "staff" | "time" | "details" | "done";
const steps: { id: Exclude<Step, "done">; label: string }[] = [
  { id: "service", label: "Service" },
  { id: "staff", label: "Team member" },
  { id: "time", label: "Date & time" },
  { id: "details", label: "Your details" },
];

const ANY_STAFF = "any";

export type BookingPreview = { name: string; address?: string };

export function BookingFlow({ slug, preview }: { slug: string; preview?: BookingPreview }) {
  const { state, retry, getBusy, createBooking } = useBookingSource(slug);

  if (state.status === "loading") return <BookingSkeleton preview={preview} />;
  if (state.status === "not-found") {
    return (
      <CenteredMessage
        icon={SearchXIcon}
        title="Booking page not found"
        description="This link may be out of date. Check the address or contact the business directly."
        action={
          <Button asChild variant="outline">
            <Link href="/">Go to FlowDesk</Link>
          </Button>
        }
      />
    );
  }
  if (state.status === "error") {
    return (
      <CenteredMessage
        icon={CalendarOffIcon}
        title="We couldn't load this booking page"
        description={state.message}
        action={
          <Button variant="outline" onClick={retry}>
            <RotateCwIcon /> Try again
          </Button>
        }
      />
    );
  }

  return (
    <BookingWizard
      page={state.page}
      isDemo={state.source === "demo"}
      getBusy={getBusy}
      createBooking={createBooking}
    />
  );
}

function BookingWizard({
  page,
  isDemo,
  getBusy,
  createBooking,
}: {
  page: BookingPage;
  isDemo: boolean;
  getBusy: ReturnType<typeof useBookingSource>["getBusy"];
  createBooking: ReturnType<typeof useBookingSource>["createBooking"];
}) {
  const { business, services, staff } = page;
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffChoice, setStaffChoice] = useState<string>(ANY_STAFF);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<{ start: Date; staffId: string } | null>(null);
  const [busy, setBusy] = useState<BusyInterval[] | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [confirmation, setConfirmation] = useState<{ id: string; details: DetailsValues } | null>(null);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const eligibleStaff = useMemo(
    () => (service ? staff.filter((m) => m.serviceIds.includes(service.id)) : []),
    [service, staff],
  );
  const candidateIds = useMemo(
    () => (staffChoice === ANY_STAFF ? eligibleStaff.map((m) => m.id) : [staffChoice]),
    [staffChoice, eligibleStaff],
  );
  const assignedStaff = slot ? (staff.find((m) => m.id === slot.staffId) ?? null) : null;

  const refreshBusy = useCallback(async () => {
    const current = new Date();
    setNow(current);
    const { from, to } = bookingWindow(current);
    try {
      setBusy(await getBusy(from, to));
    } catch (error) {
      toast.error("Could not load availability", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      setBusy([]);
    }
  }, [getBusy]);

  useEffect(() => {
    document.title = `Book with ${business.name} · FlowDesk`;
  }, [business.name]);

  useEffect(() => {
    void import("@/components/ui/calendar");
    void import("./details-form");
  }, []);

  const goToTime = () => {
    setStep("time");
    if (busy === null) void refreshBusy();
  };

  const slotsFor = useCallback(
    (day: Date): Slot[] =>
      service && busy
        ? computeSlots({
            date: day,
            durationMin: service.durationMin,
            hours: business.workingHours,
            busy,
            staffIds: candidateIds,
            now,
          })
        : [],
    [service, busy, business.workingHours, candidateIds, now],
  );

  const firstOpenDay = useMemo(() => {
    if (!busy) return null;
    for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
      const day = addDays(startOfDay(now), i);
      if (slotsFor(day).length) return day;
    }
    return startOfDay(now);
  }, [busy, now, slotsFor]);

  const activeDate = date ?? firstOpenDay;
  const daySlots = useMemo(() => (activeDate ? slotsFor(activeDate) : []), [activeDate, slotsFor]);

  const pickSlot = (s: Slot) => {
    let staffId = s.staffIds[0];
    if (s.staffIds.length > 1 && busy) {
      const dayStart = startOfDay(s.start);
      const dayEnd = addDays(dayStart, 1);
      const load = (id: string) =>
        busy
          .filter((b) => b.staffId === id && b.start < dayEnd && b.end > dayStart)
          .reduce((sum, b) => sum + (b.end.getTime() - b.start.getTime()), 0);
      staffId = [...s.staffIds].sort((a, b) => load(a) - load(b))[0];
    }
    setSlot({ start: s.start, staffId });
    setStep("details");
  };

  const submit = async (details: DetailsValues) => {
    if (!service || !slot) return;
    try {
      const id = await createBooking(
        { ...details, serviceId: service.id, staffId: slot.staffId, start: slot.start },
        service,
      );
      setConfirmation({ id, details });
      setStep("done");
    } catch (error) {
      toast.error("We couldn't confirm that time", {
        description: error instanceof Error ? error.message : "Please pick another slot.",
      });
      setSlot(null);
      setStep("time");
      void refreshBusy();
    }
  };

  const reset = () => {
    setServiceId(null);
    setStaffChoice(ANY_STAFF);
    setDate(null);
    setSlot(null);
    setBusy(null);
    setConfirmation(null);
    setStep("service");
  };

  const stepIndex = steps.findIndex((s) => s.id === step);
  const goBack = () => {
    if (stepIndex > 0) setStep(steps[stepIndex - 1].id);
  };

  const { from: windowStart, to: windowEnd } = bookingWindow(now);
  const accentStyle = {
    "--primary": `oklch(0.56 0.2 ${business.accentHue})`,
    "--ring": `oklch(0.56 0.2 ${business.accentHue})`,
    "--primary-foreground": "oklch(0.985 0 0)",
  } as React.CSSProperties;

  return (
    <LazyMotion features={domAnimation}>
      <div style={accentStyle} className="relative min-h-dvh bg-muted/30">
        <div
          aria-hidden
          className="bg-grid mask-radial pointer-events-none absolute inset-x-0 top-0 h-72 opacity-50"
        />
        <header className="relative border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, oklch(0.6 0.2 ${business.accentHue}), oklch(0.5 0.22 ${business.accentHue + 40}))`,
              }}
            >
              {initials(business.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-semibold">{business.name}</h1>
              {business.address ? (
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPinIcon className="size-3 shrink-0" /> {business.address}
                </p>
              ) : null}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {isDemo ? (
          <div className="relative border-b bg-primary/[0.06] text-sm">
            <div className="mx-auto flex max-w-5xl items-start gap-2 px-4 py-2.5 sm:items-center sm:px-6">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary sm:mt-0" />
              <p className="flex-1 text-muted-foreground">
                Demo booking page. Bookings are saved in this browser and show up in the{" "}
                <Link
                  href="/app/calendar"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  FlowDesk demo calendar
                </Link>
                .
              </p>
            </div>
          </div>
        ) : null}

        <main
          id="main"
          className="relative mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_300px]"
        >
          <section
            className="min-w-0 rounded-2xl border bg-background shadow-sm"
            aria-label="Book an appointment"
          >
            {step !== "done" ? (
              <div className="border-b px-5 py-4 sm:px-6">
                <ol className="flex items-center gap-2 text-xs">
                  {steps.map((s, i) => {
                    const complete = i < stepIndex;
                    const current = i === stepIndex;
                    return (
                      <li key={s.id} className="flex flex-1 items-center gap-2">
                        <button
                          type="button"
                          disabled={!complete}
                          onClick={() => setStep(s.id)}
                          aria-current={current ? "step" : undefined}
                          className={cn(
                            "flex items-center gap-2 rounded-md font-medium transition-colors disabled:cursor-default",
                            current
                              ? "text-foreground"
                              : complete
                                ? "text-muted-foreground hover:text-foreground"
                                : "text-muted-foreground/60",
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] tabular-nums",
                              current && "border-primary bg-primary text-primary-foreground",
                              complete && "border-primary/40 bg-primary/10 text-primary",
                            )}
                          >
                            {complete ? <CheckIcon className="size-3.5" /> : i + 1}
                          </span>
                          <span className={cn("hidden sm:inline", !current && "max-md:hidden")}>
                            {s.label}
                          </span>
                        </button>
                        {i < steps.length - 1 ? <span aria-hidden className="h-px flex-1 bg-border" /> : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}

            <div className="p-5 sm:p-6">
              <m.div
                key={step}
                initial={reduceMotion || step === "service" ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {step === "service" ? (
                  <ServiceStep
                    services={services}
                    currency={business.currency}
                    selected={serviceId}
                    onSelect={(id) => {
                      if (id !== serviceId) {
                        setStaffChoice(ANY_STAFF);
                        setSlot(null);
                        setDate(null);
                      }
                      setServiceId(id);
                      setStep("staff");
                    }}
                  />
                ) : null}

                {step === "staff" && service ? (
                  <StaffStep
                    staff={eligibleStaff}
                    selected={staffChoice}
                    onBack={goBack}
                    onSelect={(id) => {
                      if (id !== staffChoice) {
                        setSlot(null);
                        setDate(null);
                      }
                      setStaffChoice(id);
                      goToTime();
                    }}
                  />
                ) : null}

                {step === "time" && service ? (
                  <div>
                    <StepHeading title="Pick a date and time" onBack={goBack} />
                    <div className="mt-5 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
                      <div className="rounded-xl border p-1 md:self-start">
                        <Calendar
                          key={firstOpenDay?.toDateString() ?? "loading"}
                          mode="single"
                          selected={activeDate ?? undefined}
                          onSelect={(d) => d && setDate(d)}
                          weekStartsOn={1}
                          startMonth={windowStart}
                          endMonth={windowEnd}
                          defaultMonth={activeDate ?? windowStart}
                          disabled={[
                            { before: windowStart },
                            { after: addDays(windowEnd, -1) },
                            (d) => isClosedDay(business.workingHours, d),
                          ]}
                          className="mx-auto"
                        />
                      </div>
                      <div className="min-w-0">
                        {busy === null || !activeDate ? (
                          <div
                            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                            aria-busy="true"
                            aria-label="Loading availability"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <Skeleton key={i} className="h-9 rounded-md" />
                            ))}
                          </div>
                        ) : (
                          <SlotPicker
                            date={activeDate}
                            slots={daySlots}
                            selected={slot?.start ?? null}
                            onPick={pickSlot}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === "details" && service && slot ? (
                  <div>
                    <StepHeading title="Your details" onBack={goBack} />
                    <p className="mt-1 text-sm text-muted-foreground">
                      We&apos;ll send your confirmation to this email address.
                    </p>
                    <DetailsForm
                      className="mt-5"
                      defaultValues={confirmation?.details}
                      submitLabel={`Confirm booking · ${formatCurrency(service.price, business.currency)}`}
                      onSubmit={submit}
                    />
                  </div>
                ) : null}

                {step === "done" && service && slot && confirmation ? (
                  <Confirmation
                    business={business}
                    service={service}
                    staffMember={assignedStaff}
                    start={slot.start}
                    bookingId={confirmation.id}
                    details={confirmation.details}
                    isDemo={isDemo}
                    onReset={reset}
                  />
                ) : null}
              </m.div>
            </div>
          </section>

          <Summary
            business={business}
            service={service}
            staffLabel={
              assignedStaff?.name ??
              (staffChoice === ANY_STAFF ? "Any available" : staff.find((m) => m.id === staffChoice)?.name)
            }
            start={slot?.start ?? null}
            showStaff={step !== "service"}
          />
        </main>

        <footer className="relative pb-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-foreground">
            Scheduling by <Logo compact className="[&_svg]:size-4" />{" "}
            <span className="font-medium">FlowDesk</span>
          </Link>
        </footer>
      </div>
    </LazyMotion>
  );
}

function StepHeading({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {onBack ? (
        <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back" className="-ml-2">
          <ArrowLeftIcon />
        </Button>
      ) : null}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function ServiceStep({
  services,
  currency,
  selected,
  onSelect,
}: {
  services: PublicService[];
  currency: string;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, PublicService[]>();
    for (const s of services)
      map.set(s.category || "Services", [...(map.get(s.category || "Services") ?? []), s]);
    return [...map.entries()];
  }, [services]);

  if (!services.length) {
    return (
      <div className="py-10 text-center">
        <CalendarOffIcon className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-medium">No services are bookable online yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Please get in touch with the business to book.</p>
      </div>
    );
  }

  return (
    <div>
      <StepHeading title="Choose a service" />
      <div className="mt-5 space-y-6">
        {groups.map(([category, list]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {category}
            </h3>
            <ul className="grid gap-2">
              {list.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    aria-pressed={selected === s.id}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      selected === s.id && "border-primary/60 bg-primary/[0.05]",
                    )}
                  >
                    <span
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{s.name}</span>
                      {s.description ? (
                        <span className="mt-0.5 block text-sm text-muted-foreground">{s.description}</span>
                      ) : null}
                      <span className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <ClockIcon className="size-3.5" /> {formatDuration(s.durationMin)}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">{formatCurrency(s.price, currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffStep({
  staff,
  selected,
  onSelect,
  onBack,
}: {
  staff: PublicStaff[];
  selected: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const options = [
    { id: ANY_STAFF, name: "Any available", title: "Earliest availability with whoever is free", color: "" },
    ...staff,
  ];
  return (
    <div>
      <StepHeading title="Who would you like to see?" onBack={onBack} />
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onSelect(o.id)}
              aria-pressed={selected === o.id}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                selected === o.id && "border-primary/60 bg-primary/[0.05]",
              )}
            >
              {o.id === ANY_STAFF ? (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <UsersRoundIcon className="size-5" />
                </span>
              ) : (
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: o.color }}
                >
                  {initials(o.name)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-medium">{o.name}</span>
                <span className="block text-sm text-muted-foreground">{o.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SlotPicker({
  date,
  slots,
  selected,
  onPick,
}: {
  date: Date;
  slots: Slot[];
  selected: Date | null;
  onPick: (slot: Slot) => void;
}) {
  const groups = groupSlots(slots);
  return (
    <div>
      <p className="text-sm font-medium">{format(date, "EEEE, MMMM d")}</p>
      {groups.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed p-6 text-center">
          <CalendarDaysIcon className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No times left on this day</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try another date, or choose &ldquo;Any available&rdquo;.
          </p>
        </div>
      ) : (
        <div className="mt-3 max-h-[22rem] space-y-4 overflow-y-auto pr-1">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-xs text-muted-foreground">{g.label}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {g.slots.map((s) => {
                  const active = selected ? s.start.getTime() === selected.getTime() : false;
                  return (
                    <Button
                      key={s.start.toISOString()}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      className="tabular-nums"
                      onClick={() => onPick(s)}
                      aria-label={`${format(s.start, "HH:mm")}, ${s.staffIds.length} available`}
                    >
                      {format(s.start, "HH:mm")}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Summary({
  business,
  service,
  staffLabel,
  start,
  showStaff,
}: {
  business: BookingPage["business"];
  service: PublicService | null;
  staffLabel: string | undefined;
  start: Date | null;
  showStaff: boolean;
}) {
  return (
    <aside
      className="h-fit rounded-2xl border bg-background p-5 shadow-sm lg:sticky lg:top-6"
      aria-label="Booking summary"
    >
      <h2 className="text-sm font-semibold">Your appointment</h2>
      {service ? (
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full"
              style={{ backgroundColor: service.color }}
            />
            <div className="flex-1">
              <dt className="sr-only">Service</dt>
              <dd className="font-medium">{service.name}</dd>
              <dd className="text-muted-foreground">{formatDuration(service.durationMin)}</dd>
            </div>
          </div>
          {showStaff && staffLabel ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">With</dt>
              <dd className="text-right font-medium">{staffLabel}</dd>
            </div>
          ) : null}
          {start ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">When</dt>
              <dd className="text-right font-medium">
                {format(start, "EEE, MMM d")}
                <br />
                {format(start, "HH:mm")}–{format(addMinutes(start, service.durationMin), "HH:mm")}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t pt-3">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(service.price, business.currency)}</dd>
          </div>
          <p className="text-xs text-muted-foreground">
            Pay at the appointment. Free cancellation up to 24 hours before.
          </p>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Choose a service to get started.</p>
      )}
      {business.description ? (
        <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          {business.description}
        </p>
      ) : null}
    </aside>
  );
}

function Confirmation({
  business,
  service,
  staffMember,
  start,
  bookingId,
  details,
  isDemo,
  onReset,
}: {
  business: BookingPage["business"];
  service: PublicService;
  staffMember: PublicStaff | null;
  start: Date;
  bookingId: string;
  details: DetailsValues;
  isDemo: boolean;
  onReset: () => void;
}) {
  const end = addMinutes(start, service.durationMin);
  const reduceMotion = useReducedMotion();

  const downloadIcs = () => {
    const ics = buildIcs({
      id: bookingId,
      title: `${service.name} at ${business.name}`,
      description: staffMember ? `With ${staffMember.name}` : "",
      location: business.address,
      start,
      end,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.slug}-booking.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-4 text-center sm:py-8">
      <m.span
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5 dark:text-emerald-400"
      >
        <CheckIcon className="size-7" strokeWidth={2.5} />
      </m.span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">
        You&apos;re booked, {details.name.split(" ")[0]}!
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A confirmation has been sent to <span className="font-medium text-foreground">{details.email}</span>.
      </p>
      <div className="mx-auto mt-6 max-w-sm rounded-xl border bg-muted/30 p-4 text-left text-sm">
        <p className="font-medium">{service.name}</p>
        <p className="mt-1 text-muted-foreground">
          {format(start, "EEEE, MMMM d")} · {format(start, "HH:mm")}–{format(end, "HH:mm")}
        </p>
        {staffMember ? <p className="text-muted-foreground">with {staffMember.name}</p> : null}
        <p className="mt-2 text-xs text-muted-foreground">Reference {bookingId.slice(0, 8).toUpperCase()}</p>
      </div>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button variant="outline" onClick={downloadIcs}>
          <DownloadIcon /> Add to calendar
        </Button>
        {isDemo ? (
          <Button asChild>
            <Link href="/app/calendar">
              <SparklesIcon /> See it in the dashboard
            </Link>
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onReset}>
          Book another
        </Button>
      </div>
    </div>
  );
}

function BookingSkeleton({ preview }: { preview?: BookingPreview }) {
  return (
    <div id="main" className="min-h-dvh bg-muted/30" aria-busy="true" aria-label="Loading booking page">
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <Skeleton className="size-10 rounded-xl" />
          {preview ? (
            <div className="min-w-0">
              <h1 className="truncate font-semibold">{preview.name}</h1>
              {preview.address ? (
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPinIcon className="size-3 shrink-0" /> {preview.address}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3 rounded-2xl border bg-background p-6">
          {preview ? <StepHeading title="Choose a service" /> : <Skeleton className="h-6 w-48" />}
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

function DetailsFormSkeleton() {
  return (
    <div className="mt-5 space-y-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function CenteredMessage({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-muted/30 px-4">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">{action}</div>
      </div>
    </main>
  );
}
