import {
  BarChart3Icon,
  BellIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  ScissorsIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16"];
const hours = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM"];

const events: { day: number; start: number; len: number; title: string; who: string; tone: string }[] = [
  { day: 0, start: 0, len: 1, title: "Signature Cut", who: "Olivia J.", tone: "indigo" },
  { day: 0, start: 1.5, len: 2.5, title: "Balayage", who: "Mia R.", tone: "violet" },
  { day: 1, start: 0.5, len: 1.5, title: "Root Color", who: "Grace K.", tone: "pink" },
  { day: 1, start: 3, len: 1, title: "Blowout", who: "Zoe L.", tone: "teal" },
  { day: 2, start: 0, len: 2, title: "Keratin", who: "Hannah S.", tone: "amber" },
  { day: 2, start: 2.5, len: 1, title: "Men's Cut", who: "Leo M.", tone: "sky" },
  { day: 2, start: 4, len: 1.5, title: "Bridal Trial", who: "Aria N.", tone: "rose" },
  { day: 3, start: 1, len: 1, title: "Signature Cut", who: "Emma W.", tone: "indigo" },
  { day: 3, start: 2.5, len: 2.5, title: "Balayage", who: "Luna P.", tone: "violet" },
  { day: 4, start: 0, len: 1, title: "Men's Cut", who: "Theo B.", tone: "sky" },
  { day: 4, start: 1.5, len: 1.5, title: "Root Color", who: "Chloe D.", tone: "pink" },
  { day: 4, start: 3.5, len: 1, title: "Blowout", who: "Nora H.", tone: "teal" },
];

const tones: Record<string, string> = {
  indigo: "bg-indigo-500/12 border-indigo-500/60 text-indigo-700 dark:text-indigo-300",
  violet: "bg-violet-500/12 border-violet-500/60 text-violet-700 dark:text-violet-300",
  pink: "bg-pink-500/12 border-pink-500/60 text-pink-700 dark:text-pink-300",
  teal: "bg-teal-500/12 border-teal-500/60 text-teal-700 dark:text-teal-300",
  amber: "bg-amber-500/14 border-amber-500/60 text-amber-700 dark:text-amber-300",
  sky: "bg-sky-500/12 border-sky-500/60 text-sky-700 dark:text-sky-300",
  rose: "bg-rose-500/12 border-rose-500/60 text-rose-700 dark:text-rose-300",
};

const nav = [
  { icon: LayoutDashboardIcon, label: "Overview" },
  { icon: CalendarDaysIcon, label: "Calendar", active: true },
  { icon: UsersIcon, label: "Clients" },
  { icon: ScissorsIcon, label: "Services" },
  { icon: BarChart3Icon, label: "Reports" },
  { icon: CreditCardIcon, label: "Billing" },
  { icon: SettingsIcon, label: "Settings" },
];

export function ProductMockup({ className }: { className?: string }) {
  const rowH = 44;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card text-left shadow-2xl ring-1 shadow-indigo-500/10 ring-black/5 dark:ring-white/5",
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex h-9 items-center gap-2 border-b bg-muted/50 px-3">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-green-400/80" />
        <div className="mx-auto hidden h-5 w-64 items-center justify-center rounded-md bg-background/80 text-[10px] text-muted-foreground sm:flex">
          app.flowdesk.io/calendar
        </div>
      </div>
      <div className="flex">
        <div className="hidden w-44 shrink-0 flex-col gap-0.5 border-r bg-muted/30 p-2.5 md:flex">
          <div className="mb-3 flex items-center gap-2 px-1.5">
            <LogoMark className="size-5" />
            <span className="text-xs font-semibold">Lumière Studio</span>
          </div>
          {nav.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground",
                item.active && "bg-background font-medium text-foreground shadow-sm",
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <span className="text-xs font-semibold">May 12 – 16</span>
            <div className="ml-2 hidden rounded-md border p-0.5 text-[10px] sm:flex">
              <span className="rounded px-1.5 py-0.5 text-muted-foreground">Day</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium">Week</span>
              <span className="rounded px-1.5 py-0.5 text-muted-foreground">Month</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden h-6 w-36 items-center gap-1.5 rounded-md border px-2 text-[10px] text-muted-foreground lg:flex">
                <SearchIcon className="size-3" /> Search
                <kbd className="ml-auto rounded border bg-background px-1 font-mono text-[9px] text-foreground/70">
                  ⌘K
                </kbd>
              </div>
              <BellIcon className="size-3.5 text-muted-foreground" />
              <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
                + New booking
              </span>
            </div>
          </div>
          <div className="grid grid-cols-[40px_repeat(5,1fr)] border-b text-[10px] text-muted-foreground">
            <span />
            {days.map((d, i) => (
              <span key={d} className={cn("border-l px-2 py-1.5", i === 2 && "font-semibold text-primary")}>
                {d}
              </span>
            ))}
          </div>
          <div
            className="relative grid grid-cols-[40px_repeat(5,1fr)]"
            style={{ height: rowH * hours.length }}
          >
            <div className="flex flex-col">
              {hours.map((h) => (
                <span
                  key={h}
                  className="pt-0.5 pr-1 text-right text-[9px] text-muted-foreground"
                  style={{ height: rowH }}
                >
                  {h}
                </span>
              ))}
            </div>
            {days.map((d, dayIndex) => (
              <div key={d} className="relative border-l">
                {hours.map((h) => (
                  <div key={h} className="border-b border-dashed border-border/60" style={{ height: rowH }} />
                ))}
                {events
                  .filter((e) => e.day === dayIndex)
                  .map((e) => (
                    <div
                      key={`${e.title}-${e.start}`}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-md border-l-2 px-1.5 py-1",
                        tones[e.tone],
                      )}
                      style={{ top: e.start * rowH + 2, height: e.len * rowH - 4 }}
                    >
                      <p className="truncate text-[10px] font-semibold">{e.title}</p>
                      <p className="truncate text-[9px] font-medium">{e.who}</p>
                    </div>
                  ))}
                {dayIndex === 2 && (
                  <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: rowH * 2.3 }}>
                    <span className="-ml-1 size-2 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
