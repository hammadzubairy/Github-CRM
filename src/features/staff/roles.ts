import type { Role } from "@/lib/data/types";

export const roleMeta: Record<Role, { label: string; description: string; className: string }> = {
  owner: {
    label: "Owner",
    description: "Full access, including billing and deleting the workspace.",
    className: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  },
  admin: {
    label: "Admin",
    description: "Manages the team, services, clients and settings.",
    className: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
  },
  staff: {
    label: "Staff",
    description: "Sees the calendar and manages their own bookings.",
    className: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300",
  },
};

export const roles = Object.keys(roleMeta) as Role[];
