"use client";

import { useEffect, useState } from "react";
import { BarChart3Icon, CalendarDaysIcon, Globe2Icon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "calendar", label: "Calendar", icon: CalendarDaysIcon },
  { id: "clients", label: "Clients", icon: UsersIcon },
  { id: "insights", label: "Insights", icon: BarChart3Icon },
  { id: "booking", label: "Booking page", icon: Globe2Icon },
] as const;

export type PreviewTabId = (typeof tabs)[number]["id"];

export function ProductPreviewTabs({ panels }: { panels: Record<PreviewTabId, React.ReactNode> }) {
  const [active, setActive] = useState<PreviewTabId>("calendar");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => tabs[(tabs.findIndex((t) => t.id === current) + 1) % tabs.length].id);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <>
      <div className="mt-10 flex justify-center">
        <div
          role="tablist"
          aria-label="Product areas"
          className="inline-flex flex-wrap justify-center gap-1 rounded-xl border bg-muted/40 p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => {
                setActive(tab.id);
                setPaused(true);
              }}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active === tab.id && "text-foreground",
              )}
            >
              {active === tab.id && (
                <span className="absolute inset-0 animate-in rounded-lg bg-background shadow-sm duration-200 fade-in-0 zoom-in-95 motion-reduce:animate-none" />
              )}
              <tab.icon className="relative size-4" />
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div
        className="relative mx-auto mt-8 max-w-5xl rounded-2xl border bg-card p-4 shadow-xl shadow-indigo-500/5 sm:p-6"
        onMouseEnter={() => setPaused(true)}
      >
        <div
          key={active}
          role="tabpanel"
          id={`panel-${active}`}
          aria-labelledby={`tab-${active}`}
          className="min-h-80 animate-in duration-300 fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
        >
          {panels[active]}
        </div>
      </div>
    </>
  );
}
