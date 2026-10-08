import type { AppointmentStatus } from "@/lib/data/types";

export const statusMeta: Record<AppointmentStatus, { label: string; className: string; dot: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
  no_show: {
    label: "No-show",
    className: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export const appointmentStatuses = Object.keys(statusMeta) as AppointmentStatus[];

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = statusMeta[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
