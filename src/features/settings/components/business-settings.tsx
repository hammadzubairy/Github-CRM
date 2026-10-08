"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckIcon, CopyIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Business, Industry } from "@/lib/data/types";
import { slugify } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";
import { SettingsCard } from "./settings-card";

const industries: { value: Industry; label: string }[] = [
  { value: "salon", label: "Salon & beauty" },
  { value: "clinic", label: "Clinic & wellness" },
  { value: "consulting", label: "Consulting & coaching" },
];

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "AED"];
const hues = [285, 255, 220, 190, 160, 25, 350];

const schema = z.object({
  name: z.string().trim().min(2, "Enter a business name").max(80),
  slug: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(48)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes"),
  industry: z.enum(["salon", "clinic", "consulting"]),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: z.string().trim().max(30),
  address: z.string().trim().max(160),
  description: z.string().trim().max(300, "Keep it under 300 characters"),
  currency: z.string(),
  accentHue: z.number(),
});

type Values = z.infer<typeof schema>;

export function BusinessSettings({ business }: { business: Business }) {
  const businesses = useAppStore((s) => s.businesses);
  const updateBusiness = useAppStore((s) => s.updateBusiness);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: business.name,
      slug: business.slug,
      industry: business.industry,
      email: business.email,
      phone: business.phone,
      address: business.address,
      description: business.description,
      currency: business.currency,
      accentHue: business.accentHue,
    },
  });

  const slug = useWatch({ control: form.control, name: "slug" });
  const bookingUrl =
    typeof window === "undefined" ? `/book/${slug}` : `${window.location.origin}/book/${slug}`;

  const onSubmit = form.handleSubmit(async (values) => {
    if (businesses.some((b) => b.id !== business.id && b.slug === values.slug)) {
      form.setError("slug", { message: "That booking link is already taken" });
      return;
    }
    const ok = await updateBusiness(values);
    if (ok) {
      form.reset(values);
      toast.success("Business details saved");
    }
  });

  const copyLink = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    toast.success("Booking link copied");
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsCard
        title="Business"
        description="Shown on your public booking page and in client emails."
        footer={
          <Button type="submit" size="sm" disabled={!form.formState.isDirty || form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            Save changes
          </Button>
        }
      >
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="name" label="Business name" autoComplete="organization" />
            <Controller
              control={form.control}
              name="industry"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="business-industry">Industry</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="business-industry" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((i) => (
                        <SelectItem key={i.value} value={i.value}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="business-slug">Booking link</FieldLabel>
                <div className="flex gap-2">
                  <InputGroup className="flex-1">
                    <InputGroupAddon>
                      <InputGroupText className="max-sm:hidden">flowdesk.app/book/</InputGroupText>
                      <InputGroupText className="sm:hidden">/book/</InputGroupText>
                    </InputGroupAddon>
                    <InputGroupInput
                      id="business-slug"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                      }
                      onBlur={() => {
                        field.onChange(slugify(field.value));
                        field.onBlur();
                      }}
                    />
                  </InputGroup>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    aria-label="Copy booking link"
                  >
                    <CopyIcon />
                  </Button>
                  <Button asChild variant="outline" size="icon">
                    <a
                      href={`/book/${business.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open booking page"
                    >
                      <ExternalLinkIcon />
                    </a>
                  </Button>
                </div>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Changing the link breaks any links you have already shared.
                  </FieldDescription>
                )}
              </Field>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="email"
              label="Contact email"
              type="email"
              autoComplete="email"
            />
            <TextField control={form.control} name="phone" label="Phone" type="tel" autoComplete="tel" />
          </div>
          <TextField control={form.control} name="address" label="Address" autoComplete="street-address" />
          <TextField
            control={form.control}
            name="description"
            label="About"
            multiline
            placeholder="A short intro that appears on your booking page."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="currency"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="business-currency">Currency</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="business-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="accentHue"
              render={({ field }) => (
                <Field>
                  <FieldLabel id="accent-label">Booking page accent</FieldLabel>
                  <div role="radiogroup" aria-labelledby="accent-label" className="flex flex-wrap gap-2 pt-1">
                    {hues.map((hue) => {
                      const selected = field.value === hue;
                      return (
                        <button
                          key={hue}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={`Hue ${hue}`}
                          onClick={() => field.onChange(hue)}
                          className={cn(
                            "grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-background transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                            selected && "ring-2 ring-foreground/70",
                          )}
                          style={{ backgroundColor: `oklch(0.6 0.2 ${hue})` }}
                        >
                          {selected ? <CheckIcon className="size-3.5 text-white" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </SettingsCard>
    </form>
  );
}
