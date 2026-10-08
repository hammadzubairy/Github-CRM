"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || /^[+\d][\d\s().-]{5,}$/.test(v), "Enter a valid phone number"),
  notes: z.string().trim().max(500, "Keep notes under 500 characters"),
});

export type DetailsValues = z.infer<typeof schema>;

export function DetailsForm({
  defaultValues,
  submitLabel,
  onSubmit,
  className,
}: {
  defaultValues?: DetailsValues;
  submitLabel: string;
  onSubmit: (values: DetailsValues) => Promise<void>;
  className?: string;
}) {
  const form = useForm<DetailsValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { name: "", email: "", phone: "", notes: "" },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className={cn("space-y-6", className)}>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="name"
            label="Full name"
            placeholder="Jordan Lee"
            autoComplete="name"
          />
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="jordan@example.com"
            autoComplete="email"
          />
        </div>
        <TextField
          control={form.control}
          name="phone"
          label="Phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
          labelAside={<span className="text-xs text-muted-foreground">Optional</span>}
        />
        <TextField
          control={form.control}
          name="notes"
          label="Anything we should know?"
          placeholder="Allergies, access needs, goals for the session…"
          multiline
          labelAside={<span className="text-xs text-muted-foreground">Optional</span>}
        />
      </FieldGroup>
      <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
        {submitLabel}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By booking you agree to the business&apos;s cancellation policy.
      </p>
    </form>
  );
}
