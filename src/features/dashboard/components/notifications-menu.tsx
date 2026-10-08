"use client";

import { useMemo } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  BellIcon,
  CalendarCheckIcon,
  CalendarXIcon,
  CheckCheckIcon,
  CreditCardIcon,
  SparklesIcon,
  StarIcon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActivityType } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/app-store";
import { useScoped } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

export const activityIcons: Record<ActivityType, { icon: LucideIcon; tone: string }> = {
  booking_created: { icon: CalendarCheckIcon, tone: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400" },
  booking_cancelled: { icon: CalendarXIcon, tone: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
  booking_completed: {
    icon: CheckCheckIcon,
    tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  },
  client_created: { icon: UserPlusIcon, tone: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  payment_received: {
    icon: CreditCardIcon,
    tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  },
  review_received: { icon: StarIcon, tone: "bg-amber-500/12 text-amber-600 dark:text-amber-400" },
  plan_changed: { icon: SparklesIcon, tone: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
};

export function NotificationsMenu() {
  const activity = useScoped("activity");
  const readAt = useAppStore((s) => s.notificationsReadAt);
  const markRead = useAppStore((s) => s.markNotificationsRead);

  const items = useMemo(
    () => [...activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12),
    [activity],
  );
  const unread = items.filter((i) => !readAt || i.createdAt > readAt).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <BellIcon />
          {unread ? (
            <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] leading-4 font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="xs" onClick={markRead} disabled={!unread}>
            <CheckCheckIcon /> Mark all read
          </Button>
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">You are all caught up.</div>
        ) : (
          <ScrollArea className="h-80">
            <ul className="divide-y">
              {items.map((item) => {
                const meta = activityIcons[item.type] ?? activityIcons.booking_created;
                const isUnread = !readAt || item.createdAt > readAt;
                return (
                  <li key={item.id} className={cn("flex gap-3 px-4 py-3", isUnread && "bg-primary/[0.03]")}>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", meta.tone)}>
                      <meta.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{item.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {isUnread ? (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
