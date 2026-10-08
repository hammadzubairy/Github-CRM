"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ColorSwatches } from "@/components/form/color-swatches";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { newId } from "@/lib/demo/random";
import type { Service, StaffMember } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness } from "@/lib/store/hooks";
import { roleMeta, roles } from "../roles";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(60),
  email: z.email("Enter a valid email"),
  title: z.string().trim().max(60),
  role: z.enum(["owner", "admin", "staff"]),
  color: z.string(),
  serviceIds: z.array(z.string()),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function StaffDialog({
  open,
  onOpenChange,
  member,
  services,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
  services: Service[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <StaffForm
            key={member?.id ?? "new"}
            member={member}
            services={services}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StaffForm({
  member,
  services,
  onDone,
}: {
  member: StaffMember | null;
  services: Service[];
  onDone: () => void;
}) {
  const business = useActiveBusiness();
  const saveStaff = useAppStore((s) => s.saveStaff);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: member?.name ?? "",
      email: member?.email ?? "",
      title: member?.title ?? "",
      role: member?.role ?? "staff",
      color: member?.color ?? "#0ea5e9",
      serviceIds: member?.serviceIds ?? services.map((s) => s.id),
      active: member?.active ?? true,
    },
  });
  const isOwner = member?.role === "owner";

  const onSubmit = form.handleSubmit(async (values) => {
    if (!business) return;
    const next: StaffMember = {
      id: member?.id ?? newId(),
      businessId: business.id,
      ...values,
      createdAt: member?.createdAt ?? new Date().toISOString(),
    };
    onDone();
    const ok = await saveStaff(next);
    if (ok) toast.success(member ? "Team member updated" : "Team member added", { description: next.name });
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{member ? "Edit team member" : "Add team member"}</DialogTitle>
        <DialogDescription>
          Each team member gets their own calendar column and booking availability.
        </DialogDescription>
      </DialogHeader>
      <form id="staff-form" onSubmit={onSubmit} noValidate className="max-h-[60vh] overflow-y-auto px-0.5">
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="name"
              label="Full name"
              placeholder="Jamie Rivera"
              autoComplete="off"
            />
            <TextField
              control={form.control}
              name="title"
              label="Job title"
              placeholder="Senior stylist"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="jamie@studio.com"
              autoComplete="off"
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="staff-role">Role</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isOwner}>
                    <SelectTrigger id="staff-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r} disabled={r === "owner" && !isOwner}>
                          {roleMeta[r].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>{roleMeta[field.value].description}</FieldDescription>
                </Field>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="serviceIds"
            render={({ field }) => (
              <FieldSet>
                <FieldLegend variant="label">Services offered</FieldLegend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {services.map((s) => {
                    const checked = field.value.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/[0.04]"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            field.onChange(
                              v ? [...field.value, s.id] : field.value.filter((id) => id !== s.id),
                            )
                          }
                        />
                        <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="truncate">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
              </FieldSet>
            )}
          />
          <Controller
            control={form.control}
            name="color"
            render={({ field }) => (
              <Field>
                <FieldLabel>Calendar color</FieldLabel>
                <ColorSwatches label="Calendar color" value={field.value} onChange={field.onChange} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="active"
            render={({ field }) => (
              <Field orientation="horizontal" className="rounded-lg border p-3">
                <div className="flex-1">
                  <FieldLabel htmlFor="staff-active">Accepting bookings</FieldLabel>
                  <FieldDescription>
                    Inactive members are hidden from the calendar and booking page.
                  </FieldDescription>
                </div>
                <Switch id="staff-active" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" form="staff-form" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {member ? "Save changes" : "Add member"}
        </Button>
      </DialogFooter>
    </>
  );
}
