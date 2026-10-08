"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ColorSwatches } from "@/components/form/color-swatches";
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { newId } from "@/lib/demo/random";
import type { Service } from "@/lib/data/types";
import { formatDuration } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness } from "@/lib/store/hooks";

const durations = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240];

const schema = z.object({
  name: z.string().trim().min(2, "Give the service a name").max(60),
  category: z.string().trim().min(1, "Add a category").max(40),
  description: z.string().trim().max(240, "Keep it under 240 characters"),
  durationMin: z.number().int().min(15),
  price: z.number({ error: "Enter a price" }).min(0, "Price can't be negative").max(10000),
  color: z.string(),
  active: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  categories: string[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <ServiceForm
            key={service?.id ?? "new"}
            service={service}
            categories={categories}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ServiceForm({
  service,
  categories,
  onDone,
}: {
  service: Service | null;
  categories: string[];
  onDone: () => void;
}) {
  const business = useActiveBusiness();
  const saveService = useAppStore((s) => s.saveService);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service?.name ?? "",
      category: service?.category ?? categories[0] ?? "",
      description: service?.description ?? "",
      durationMin: service?.durationMin ?? 60,
      price: service?.price ?? 50,
      color: service?.color ?? "#6366f1",
      active: service?.active ?? true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!business) return;
    const next: Service = {
      id: service?.id ?? newId(),
      businessId: business.id,
      ...values,
      createdAt: service?.createdAt ?? new Date().toISOString(),
    };
    onDone();
    const ok = await saveService(next);
    if (ok) toast.success(service ? "Service updated" : "Service created", { description: next.name });
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{service ? "Edit service" : "New service"}</DialogTitle>
        <DialogDescription>Services appear on your public booking page when active.</DialogDescription>
      </DialogHeader>
      <form id="service-form" onSubmit={onSubmit} noValidate>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <TextField
              control={form.control}
              name="name"
              label="Name"
              placeholder="Signature cut"
              autoComplete="off"
            />
            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="service-category">Category</FieldLabel>
                  <Input
                    id="service-category"
                    list="service-categories"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  <datalist id="service-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
              )}
            />
          </div>
          <TextField
            control={form.control}
            name="description"
            label="Description"
            multiline
            placeholder="What's included"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="durationMin"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="service-duration">Duration</FieldLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger id="service-duration" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {formatDuration(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <TextField
              control={form.control}
              name="price"
              label={`Price (${business?.currency ?? "USD"})`}
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
            />
          </div>
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
                  <FieldLabel htmlFor="service-active">Bookable online</FieldLabel>
                  <FieldDescription>Show this service on your public booking page.</FieldDescription>
                </div>
                <Switch id="service-active" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" form="service-form" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {service ? "Save changes" : "Create service"}
        </Button>
      </DialogFooter>
    </>
  );
}
