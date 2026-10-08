"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, MailPlusIcon, MinusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role } from "@/lib/data/types";
import { newId } from "@/lib/demo/random";
import { initials } from "@/lib/format";
import { getPlan } from "@/lib/plans";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useScoped } from "@/lib/store/hooks";
import { roleMeta } from "@/features/staff/roles";
import { SettingsCard } from "./settings-card";

const permissions: { label: string; roles: Role[] }[] = [
  { label: "Manage own calendar", roles: ["owner", "admin", "staff"] },
  { label: "See every calendar", roles: ["owner", "admin", "staff"] },
  { label: "Manage clients & notes", roles: ["owner", "admin", "staff"] },
  { label: "Edit services & staff", roles: ["owner", "admin"] },
  { label: "Business settings", roles: ["owner", "admin"] },
  { label: "Billing & plan", roles: ["owner"] },
];

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function TeamSettings() {
  const router = useRouter();
  const business = useActiveBusiness();
  const staff = useScoped("staff");
  const saveStaff = useAppStore((s) => s.saveStaff);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "owner">>("staff");
  const [error, setError] = useState<string | null>(null);

  if (!business) return null;
  const plan = getPlan(business.plan);
  const atLimit = plan.limits.staff !== null && staff.length >= plan.limits.staff;

  const changeRole = async (id: string, next: Role) => {
    const member = staff.find((m) => m.id === id);
    if (!member || member.role === next) return;
    const ok = await saveStaff({ ...member, role: next });
    if (ok) toast.success(`${member.name} is now ${roleMeta[next].label.toLowerCase()}`);
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!emailPattern.test(value)) {
      setError("Enter a valid email address");
      return;
    }
    if (staff.some((m) => m.email.toLowerCase() === value)) {
      setError("That person is already on the team");
      return;
    }
    if (atLimit) {
      setError(null);
      toast.info(`The ${plan.name} plan includes ${plan.limits.staff} seats`, {
        description: "Upgrade to invite more people.",
        action: { label: "Upgrade", onClick: () => router.push("/app/billing") },
      });
      return;
    }
    const palette = ["#6366f1", "#0ea5e9", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6"];
    const ok = await saveStaff({
      id: newId(),
      businessId: business.id,
      name: nameFromEmail(value) || value,
      email: value,
      title: "",
      role,
      color: palette[staff.length % palette.length],
      serviceIds: [],
      active: true,
      createdAt: new Date().toISOString(),
    });
    if (ok) {
      toast.success("Invitation sent", {
        description: `${value} can join ${business.name} as ${roleMeta[role].label.toLowerCase()}.`,
      });
      setEmail("");
      setError(null);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Team members"
        description={`${staff.length}${plan.limits.staff ? ` of ${plan.limits.staff}` : ""} seats used on the ${plan.name} plan.`}
      >
        <form onSubmit={invite} noValidate className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="invite-email" className="sr-only">
              Email address
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@business.com"
              value={email}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "invite-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
            />
          </div>
          <Select value={role} onValueChange={(v) => setRole(v as Exclude<Role, "owner">)}>
            <SelectTrigger className="sm:w-32" aria-label="Role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">
            <MailPlusIcon /> Invite
          </Button>
        </form>
        {error ? (
          <p id="invite-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <ul className="mt-5 divide-y rounded-lg border">
          {staff.map((member) => (
            <li key={member.id} className="flex items-center gap-3 px-3 py-2.5">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: member.color }}
              >
                {initials(member.name)}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{member.name}</p>
                <p className="truncate text-muted-foreground">{member.email}</p>
              </div>
              {member.role === "owner" ? (
                <span className="px-3 text-sm text-muted-foreground">Owner</span>
              ) : (
                <Select value={member.role} onValueChange={(v) => changeRole(member.id, v as Role)}>
                  <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${member.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Set titles, colors and services on the{" "}
          <Link href="/app/staff" className="font-medium text-foreground underline underline-offset-4">
            Staff page
          </Link>
          .
        </p>
      </SettingsCard>

      <SettingsCard title="Roles & permissions" description="What each role can do in this workspace.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium text-muted-foreground">Permission</th>
                {(["owner", "admin", "staff"] as const).map((r) => (
                  <th key={r} className="w-20 py-2 text-center font-medium">
                    {roleMeta[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.label} className="border-b last:border-0">
                  <td className="py-2.5 pr-4">{p.label}</td>
                  {(["owner", "admin", "staff"] as const).map((r) => (
                    <td key={r} className="py-2.5 text-center">
                      {p.roles.includes(r) ? (
                        <CheckIcon className="mx-auto size-4 text-primary" aria-label="Allowed" />
                      ) : (
                        <MinusIcon
                          className="mx-auto size-4 text-muted-foreground/50"
                          aria-label="Not allowed"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>
    </div>
  );
}
