import { CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./features-section";
import { ProductPreviewTabs, type PreviewTabId } from "./product-preview-tabs";

function CalendarPanel() {
  const staff = [
    {
      name: "Alex",
      color: "bg-indigo-500",
      items: [
        [0, 2, "Signature Cut"],
        [3, 3, "Balayage"],
        [7, 2, "Blowout"],
      ],
    },
    {
      name: "Liam",
      color: "bg-violet-500",
      items: [
        [1, 3, "Root Color"],
        [5, 4, "Keratin"],
      ],
    },
    {
      name: "Ava",
      color: "bg-teal-500",
      items: [
        [0, 1, "Blowout"],
        [2, 2, "Signature Cut"],
        [6, 3, "Bridal Trial"],
      ],
    },
    {
      name: "Noah",
      color: "bg-sky-500",
      items: [
        [0, 1, "Men's Cut"],
        [1, 1, "Men's Cut"],
        [4, 1, "Men's Cut"],
        [8, 1, "Men's Cut"],
      ],
    },
  ] as const;
  return (
    <div className="grid grid-cols-4 gap-3">
      {staff.map((s) => (
        <div key={s.name}>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium">
            <span className={cn("size-2 rounded-full", s.color)} /> {s.name}
          </div>
          <div className="relative h-72 rounded-lg border bg-muted/30">
            {s.items.map(([start, len, title]) => (
              <div
                key={`${title}-${start}`}
                className="absolute inset-x-1 rounded-md border bg-background px-2 py-1 shadow-sm"
                style={{ top: `${(start / 10) * 100}%`, height: `calc(${(len / 10) * 100}% - 4px)` }}
              >
                <div className={cn("absolute inset-y-1 left-0 w-0.5 rounded-full", s.color)} />
                <p className="truncate text-[11px] font-medium">{title}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientsPanel() {
  const rows = [
    ["Olivia Johnson", "VIP · Color", "14 visits", "$2,140"],
    ["Mia Rodriguez", "Balayage", "6 visits", "$1,120"],
    ["Leo Martinez", "New", "1 visit", "$45"],
    ["Grace Kim", "Referral", "9 visits", "$860"],
    ["Hannah Shah", "Wedding", "3 visits", "$540"],
    ["Theo Brown", "Student", "5 visits", "$225"],
  ];
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] border-b bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground">
        <span>Client</span>
        <span>Tags</span>
        <span>Visits</span>
        <span className="text-right">Lifetime value</span>
      </div>
      {rows.map(([name, tags, visits, value]) => (
        <div
          key={name}
          className="grid grid-cols-[2fr_1.5fr_1fr_1fr] items-center border-b px-4 py-2.5 text-xs last:border-0"
        >
          <span className="flex items-center gap-2 font-medium">
            <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-[10px] text-primary">
              {name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            {name}
          </span>
          <span className="text-muted-foreground">{tags}</span>
          <span className="text-muted-foreground">{visits}</span>
          <span className="text-right font-medium tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

function InsightsPanel() {
  const values = [42, 48, 45, 56, 61, 58, 67, 72, 70, 81, 86, 92];
  const max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 85}`).join(" ");
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Revenue", "$48.2k", "+24.6%"],
        ["Bookings", "1,284", "+12.1%"],
        ["No-show rate", "3.2%", "-1.8 pts"],
      ].map(([label, value, delta]) => (
        <div key={label} className="rounded-lg border bg-background p-3">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
          <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{delta}</p>
        </div>
      ))}
      <div className="rounded-lg border bg-background p-3 sm:col-span-3">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full" aria-hidden="true">
          <defs>
            <linearGradient id="pv-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,100 ${points} 100,100`} fill="url(#pv-fill)" />
          <polyline
            points={points}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

function BookingPanel() {
  return (
    <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        {[
          ["Signature Cut & Style", "60 min", "$85"],
          ["Balayage", "2h 30m", "$220"],
          ["Blowout", "45 min", "$55"],
        ].map(([name, dur, price], i) => (
          <div
            key={name}
            className={cn(
              "rounded-lg border bg-background p-3",
              i === 1 && "border-primary ring-2 ring-primary/20",
            )}
          >
            <div className="flex items-center justify-between text-xs font-medium">
              {name} <span className="tabular-nums">{price}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{dur}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border bg-background p-3">
        <p className="text-xs font-medium">Friday, May 16</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {["9:00", "9:30", "10:30", "11:00", "1:15", "2:00", "3:30", "4:00", "4:45"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "rounded-md border py-1.5 text-center text-[11px]",
                i === 2 && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2Icon className="size-3.5" /> Booked with Liam · confirmation sent
        </div>
      </div>
    </div>
  );
}

const panels: Record<PreviewTabId, React.ReactNode> = {
  calendar: <CalendarPanel />,
  clients: <ClientsPanel />,
  insights: <InsightsPanel />,
  booking: <BookingPanel />,
};

export function ProductPreview() {
  return (
    <section aria-labelledby="preview-heading" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="preview-heading"
          eyebrow="Take a look inside"
          title="Built for the front desk, loved by the back office"
          description="Click through the parts of FlowDesk your team will use every day."
        />
        <ProductPreviewTabs panels={panels} />
      </div>
    </section>
  );
}
