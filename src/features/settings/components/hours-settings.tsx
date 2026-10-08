"use client";

import { useState } from "react";
import { CopyIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Business, WorkingDay } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./settings-card";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Monday first. */
const order = [1, 2, 3, 4, 5, 6, 0];

const times = Array.from({ length: 33 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

function normalise(hours: WorkingDay[]): WorkingDay[] {
  return order.map(
    (day) => hours.find((h) => h.day === day) ?? { day, open: false, start: "09:00", end: "17:00" },
  );
}

export function HoursSettings({ business }: { business: Business }) {
  const updateBusiness = useAppStore((s) => s.updateBusiness);
  const [hours, setHours] = useState(() => normalise(business.workingHours));
  const [saving, setSaving] = useState(false);

  const original = JSON.stringify(normalise(business.workingHours));
  const dirty = JSON.stringify(hours) !== original;
  const invalid = hours.filter((h) => h.open && h.end <= h.start).map((h) => h.day);
  const weeklyHours = hours.reduce((sum, h) => {
    if (!h.open || h.end <= h.start) return sum;
    const [sh, sm] = h.start.split(":").map(Number);
    const [eh, em] = h.end.split(":").map(Number);
    return sum + (eh * 60 + em - sh * 60 - sm) / 60;
  }, 0);

  const update = (day: number, patch: Partial<WorkingDay>) =>
    setHours((prev) => prev.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  const copyMonday = () => {
    const monday = hours.find((h) => h.day === 1);
    if (!monday) return;
    setHours((prev) =>
      prev.map((h) =>
        h.day >= 2 && h.day <= 5 ? { ...h, open: monday.open, start: monday.start, end: monday.end } : h,
      ),
    );
  };

  const save = async () => {
    if (invalid.length) return;
    setSaving(true);
    const ok = await updateBusiness({ workingHours: hours });
    setSaving(false);
    if (ok)
      toast.success("Working hours saved", { description: "Your booking page now uses the new hours." });
  };

  return (
    <SettingsCard
      title="Working hours"
      description="Clients can only book inside these hours. Times use your local timezone."
      footer={
        <>
          <span className="mr-auto text-xs text-muted-foreground">
            {weeklyHours.toFixed(1).replace(/\.0$/, "")} hours per week
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!dirty || saving}
            onClick={() => setHours(normalise(business.workingHours))}
          >
            Reset
          </Button>
          <Button type="button" size="sm" disabled={!dirty || saving || invalid.length > 0} onClick={save}>
            {saving ? <Loader2Icon className="animate-spin" /> : null}
            Save hours
          </Button>
        </>
      }
    >
      <div className="mb-3 flex justify-end">
        <Button type="button" variant="outline" size="xs" onClick={copyMonday}>
          <CopyIcon /> Copy Monday to weekdays
        </Button>
      </div>
      <ul className="divide-y rounded-lg border">
        {hours.map((h) => {
          const name = dayNames[h.day];
          const isInvalid = invalid.includes(h.day);
          return (
            <li key={h.day} className="flex flex-wrap items-center gap-3 px-3 py-2.5 sm:flex-nowrap">
              <div className="flex w-36 items-center gap-3">
                <Switch
                  id={`open-${h.day}`}
                  checked={h.open}
                  onCheckedChange={(open) => update(h.day, { open })}
                  aria-label={`Open on ${name}`}
                />
                <label htmlFor={`open-${h.day}`} className="text-sm font-medium">
                  {name}
                </label>
              </div>
              {h.open ? (
                <div className="flex flex-1 items-center gap-2">
                  <TimeSelect
                    value={h.start}
                    onChange={(start) => update(h.day, { start })}
                    label={`${name} opening time`}
                    invalid={isInvalid}
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <TimeSelect
                    value={h.end}
                    onChange={(end) => update(h.day, { end })}
                    label={`${name} closing time`}
                    invalid={isInvalid}
                  />
                  {isInvalid ? (
                    <span role="alert" className="text-xs text-destructive">
                      Closing must be after opening
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="flex-1 text-sm text-muted-foreground">Closed</span>
              )}
            </li>
          );
        })}
      </ul>
    </SettingsCard>
  );
}

function TimeSelect({
  value,
  onChange,
  label,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  invalid: boolean;
}) {
  const options = times.includes(value) ? times : [...times, value].sort();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className={cn("w-24 tabular-nums", invalid && "border-destructive")}
        aria-label={label}
        aria-invalid={invalid}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((t) => (
          <SelectItem key={t} value={t} className="tabular-nums">
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
