import { BellRingIcon, CheckIcon, CreditCardIcon, MessageSquareIcon, MousePointer2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BookingIllustration() {
  const slots = ["9:00", "9:30", "10:15", "11:00", "1:30", "2:45", "3:30", "4:15"];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold">Thursday, May 15</span>
        <span className="text-[10px] text-muted-foreground">8 slots</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {slots.map((slot, i) => (
          <span
            key={slot}
            className={cn(
              "rounded-md border py-1.5 text-center text-[10px] font-medium",
              i === 3
                ? "animate-pulse-ring border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {slot}
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
        <CheckIcon className="size-3" /> Instant confirmation sent
      </div>
    </div>
  );
}

export function CalendarIllustration() {
  return (
    <div className="relative grid grid-cols-3 gap-2 rounded-lg border bg-background p-3 shadow-sm">
      {["Ava", "Liam", "Noah"].map((name) => (
        <div key={name} className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground">{name}</p>
          <div className="h-5 rounded border border-dashed" />
          <div className="h-5 rounded border border-dashed" />
          <div className="h-5 rounded border border-dashed" />
        </div>
      ))}
      <div className="absolute top-[34px] left-3 w-[calc((100%-40px)/3)]">
        <div className="relative animate-drag-block">
          <div className="h-5 rounded border-l-2 border-violet-500 bg-violet-500/15 px-1.5 text-[9px] leading-5 font-semibold text-violet-700 shadow-md dark:text-violet-300">
            Balayage
          </div>
          <MousePointer2Icon className="absolute -right-1 -bottom-3 size-3.5 fill-foreground text-foreground" />
        </div>
      </div>
    </div>
  );
}

export function RemindersIllustration() {
  return (
    <div className="relative h-[118px]">
      <div className="absolute inset-x-0 top-0 rounded-lg border bg-background p-2.5 shadow-sm">
        <div className="flex items-start gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <MessageSquareIcon className="size-3.5" />
          </span>
          <p className="text-[10px] leading-snug">
            <span className="font-semibold">Reminder:</span> Your appointment at Lumière is tomorrow at 10:30.
            Reply C to confirm.
          </p>
        </div>
      </div>
      <div className="absolute inset-x-3 top-[64px] animate-toast-in rounded-lg border bg-background p-2.5 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <BellRingIcon className="size-3.5" />
          </span>
          <p className="text-[10px] font-medium">Grace confirmed · no-show risk dropped 38%</p>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsIllustration() {
  const bars = [38, 52, 44, 61, 58, 72, 66, 84, 79, 93];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-muted-foreground">Revenue</span>
        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">+24.6%</span>
      </div>
      <p className="text-lg font-semibold tracking-tight">$48,210</p>
      <div className="mt-2 flex h-16 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 origin-bottom animate-bar-grow rounded-sm bg-gradient-to-t from-primary/60 to-brand"
            style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function PaymentsIllustration() {
  return (
    <div className="space-y-2">
      <div className="rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-700 p-3 text-white shadow-md dark:from-zinc-800 dark:to-zinc-950">
        <div className="flex items-center justify-between">
          <CreditCardIcon className="size-4 opacity-80" />
          <span className="text-[10px] font-semibold tracking-wider opacity-80">PRO PLAN</span>
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-widest">•••• •••• •••• 4242</p>
      </div>
      <div className="flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-[10px]">
        <span className="text-muted-foreground">Invoice FD-02048</span>
        <span className="rounded-full bg-emerald-500/12 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
          Paid
        </span>
      </div>
    </div>
  );
}

export function ClientsIllustration() {
  const rows = [
    {
      n: "Olivia Johnson",
      t: "VIP",
      c: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
      v: "$1,240",
    },
    { n: "Leo Martinez", t: "New", c: "bg-sky-500/15 text-sky-700 dark:text-sky-300", v: "$45" },
    { n: "Grace Kim", t: "Color", c: "bg-pink-500/15 text-pink-700 dark:text-pink-300", v: "$680" },
  ];
  return (
    <div className="divide-y rounded-lg border bg-background shadow-sm">
      {rows.map((r) => (
        <div key={r.n} className="flex items-center gap-2 px-2.5 py-2">
          <span className="grid size-6 place-items-center rounded-full bg-muted text-[9px] font-semibold">
            {r.n
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </span>
          <span className="flex-1 truncate text-[11px] font-medium">{r.n}</span>
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", r.c)}>{r.t}</span>
          <span className="w-10 text-right text-[10px] text-muted-foreground tabular-nums">{r.v}</span>
        </div>
      ))}
    </div>
  );
}
