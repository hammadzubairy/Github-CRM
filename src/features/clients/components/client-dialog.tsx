"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { newId } from "@/lib/demo/random";
import type { Client } from "@/lib/data/types";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness } from "@/lib/store/hooks";
import { clientStatuses, clientStatusMeta } from "../stats";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the client's name").max(80),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((v) => v === "" || /^[+()\d\s.-]{6,}$/.test(v), "Enter a valid phone number"),
  status: z.enum(["new", "active", "vip", "inactive"]),
  tags: z.string().max(200),
});

type Values = z.infer<typeof schema>;

export function ClientDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSaved?: (client: Client) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <ClientForm
            key={client?.id ?? "new"}
            client={client ?? null}
            onDone={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ClientForm({
  client,
  onDone,
  onSaved,
}: {
  client: Client | null;
  onDone: () => void;
  onSaved?: (client: Client) => void;
}) {
  const business = useActiveBusiness();
  const saveClient = useAppStore((s) => s.saveClient);
  const logActivity = useAppStore((s) => s.logActivity);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      status: client?.status ?? "new",
      tags: client?.tags.join(", ") ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!business) return;
    const next: Client = {
      id: client?.id ?? newId(),
      businessId: business.id,
      name: values.name,
      email: values.email,
      phone: values.phone,
      status: values.status,
      tags: [
        ...new Set(
          values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      ].slice(0, 6),
      createdAt: client?.createdAt ?? new Date().toISOString(),
    };
    onDone();
    const ok = await saveClient(next);
    if (!ok) return;
    if (!client) logActivity("client_created", `${next.name} was added as a new client`);
    toast.success(client ? "Client updated" : "Client added", { description: next.name });
    onSaved?.(next);
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{client ? "Edit client" : "Add client"}</DialogTitle>
        <DialogDescription>Contact details are only visible to your team.</DialogDescription>
      </DialogHeader>
      <form id="client-form" onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-4">
          <TextField
            control={form.control}
            name="name"
            label="Full name"
            placeholder="Jordan Lee"
            autoComplete="off"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="email"
              label="Email"
              type="email"
              placeholder="jordan@email.com"
              autoComplete="off"
            />
            <TextField
              control={form.control}
              name="phone"
              label="Phone"
              type="tel"
              placeholder="+1 555 0100"
              autoComplete="off"
            />
          </div>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="client-status">Status</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="client-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clientStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {clientStatusMeta[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <TextField
            control={form.control}
            name="tags"
            label="Tags"
            placeholder="VIP, Referral"
            description="Separate tags with commas."
          />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" form="client-form" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {client ? "Save changes" : "Add client"}
        </Button>
      </DialogFooter>
    </>
  );
}
