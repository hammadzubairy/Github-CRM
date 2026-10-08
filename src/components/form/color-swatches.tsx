"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const palette = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
  "#64748b",
];

export function ColorSwatches({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {palette.map((color) => {
        const selected = value.toLowerCase() === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={color}
            onClick={() => onChange(color)}
            className={cn(
              "grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected && "ring-2 ring-foreground/60",
            )}
            style={{ backgroundColor: color }}
          >
            {selected ? <CheckIcon className="size-3.5 text-white" /> : null}
          </button>
        );
      })}
    </div>
  );
}
