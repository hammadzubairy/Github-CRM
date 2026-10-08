"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, addYears, format } from "date-fns";
import { ArrowLeftIcon, CheckIcon, CreditCardIcon, Loader2Icon, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/form/text-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillingToggle } from "@/features/marketing/components/pricing-section";
import { formatCurrency } from "@/lib/format";
import { getPlan, isPlanId, planPrice, type BillingInterval } from "@/lib/plans";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness } from "@/lib/store/hooks";

const DECLINE_CARD = "4000000000000002";

function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

const schema = z.object({
  email: z.email("Enter a valid email"),
  card: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => /^\d{13,19}$/.test(v) && luhn(v), "Your card number is invalid"),
  expiry: z.string().refine((v) => {
    const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(v);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return false;
    return new Date(year, month, 1) > new Date();
  }, "Your card's expiration date is invalid"),
  cvc: z.string().regex(/^\d{3,4}$/, "Your card's security code is invalid"),
  name: z.string().trim().min(2, "Enter the name on the card"),
  country: z.string().min(2),
});

type PaymentInput = z.input<typeof schema>;
type PaymentOutput = z.output<typeof schema>;

const countries = [
  ["US", "United States"],
  ["CA", "Canada"],
  ["GB", "United Kingdom"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["NL", "Netherlands"],
  ["AU", "Australia"],
  ["AE", "United Arab Emirates"],
] as const;

const formatCard = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
};

function cardBrand(card: string) {
  const v = card.replace(/\s/g, "");
  if (/^4/.test(v)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(v)) return "Mastercard";
  if (/^3[47]/.test(v)) return "Amex";
  return null;
}

export function CheckoutView() {
  const router = useRouter();
  const params = useSearchParams();
  const business = useActiveBusiness();
  const profile = useAppStore((s) => s.profile);
  const applyPlan = useAppStore((s) => s.applyPlan);
  const mode = useAppStore((s) => s.mode);

  const planParam = params.get("plan");
  const plan = getPlan(isPlanId(planParam) && planParam !== "free" ? planParam : "pro");
  const [interval, setBillingInterval] = useState<BillingInterval>(
    params.get("interval") === "yearly" ? "yearly" : "monthly",
  );
  const [paid, setPaid] = useState(false);

  const form = useForm<PaymentInput, unknown, PaymentOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: profile.email,
      card: "",
      expiry: "",
      cvc: "",
      name: profile.name,
      country: "US",
    },
  });

  const monthly = planPrice(plan, interval);
  const total = interval === "yearly" ? monthly * 12 : monthly;
  const saving = interval === "yearly" ? (plan.monthly - plan.yearly) * 12 : 0;
  const renews = interval === "yearly" ? addYears(new Date(), 1) : addDays(new Date(), 30);
  const cardNumber = useWatch({ control: form.control, name: "card" });
  const brand = cardBrand(cardNumber ?? "");

  const onSubmit = form.handleSubmit(async (values) => {
    await new Promise((r) => setTimeout(r, 1100));
    if (values.card === DECLINE_CARD) {
      form.setError("card", { message: "Your card was declined. Try another card." });
      toast.error("Payment declined", { description: "The test card 4000 0000 0000 0002 always declines." });
      return;
    }
    const ok = await applyPlan(plan.id, interval);
    if (!ok) return;
    setPaid(true);
    await new Promise((r) => setTimeout(r, 900));
    router.replace("/app/billing?checkout=success");
  });

  if (mode !== "demo") {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="font-medium">Checkout runs on Stripe for live workspaces.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/app/billing">Back to billing</Link>
        </Button>
      </div>
    );
  }

  const fillTestCard = () => {
    form.setValue("card", "4242 4242 4242 4242", { shouldValidate: true });
    form.setValue("expiry", `12 / ${String(new Date().getFullYear() + 3).slice(2)}`, {
      shouldValidate: true,
    });
    form.setValue("cvc", "424", { shouldValidate: true });
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 p-4 sm:p-8 lg:grid-cols-2 lg:gap-16">
      <section aria-label="Order summary" className="space-y-6">
        <Link
          href="/app/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> {business?.name ?? "Back"}
          <Badge variant="outline" className="ml-1 border-amber-500/40 text-amber-700 dark:text-amber-400">
            Test mode
          </Badge>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Subscribe to FlowDesk {plan.name}</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(total, "USD")}
            </span>
            <span className="text-sm text-muted-foreground">
              per {interval === "yearly" ? "year" : "month"}
            </span>
          </p>
        </div>
        <BillingToggle value={interval} onChange={setBillingInterval} />
        <dl className="space-y-3 rounded-xl border bg-card p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt>
              FlowDesk {plan.name}
              <span className="block text-xs text-muted-foreground">Billed {interval}</span>
            </dt>
            <dd className="tabular-nums">{formatCurrency(total + saving, "USD")}</dd>
          </div>
          {saving > 0 ? (
            <div className="flex justify-between gap-4 text-emerald-700 dark:text-emerald-400">
              <dt>Yearly discount</dt>
              <dd className="tabular-nums">−{formatCurrency(saving, "USD")}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t pt-3">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="text-muted-foreground tabular-nums">{formatCurrency(0, "USD")}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t pt-3 font-semibold">
            <dt>Total due today</dt>
            <dd className="tabular-nums">{formatCurrency(total, "USD")}</dd>
          </div>
        </dl>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {plan.features.slice(0, 4).map((f) => (
            <li key={f} className="flex gap-2">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Payment details" className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        {paid ? (
          <div className="grid min-h-80 place-items-center text-center" role="status">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckIcon className="size-7" strokeWidth={2.5} />
              </span>
              <p className="mt-4 text-lg font-semibold">Payment successful</p>
              <p className="mt-1 text-sm text-muted-foreground">Taking you back to FlowDesk…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
              <span>
                Test card <span className="font-mono">4242 4242 4242 4242</span>
              </span>
              <Button type="button" variant="outline" size="xs" onClick={fillTestCard}>
                Autofill
              </Button>
            </div>
            <FieldGroup className="gap-4">
              <TextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
              />
              <Controller
                control={form.control}
                name="card"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="cc-number">Card information</FieldLabel>
                    <div className="relative">
                      <Input
                        id="cc-number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="1234 1234 1234 1234"
                        aria-invalid={fieldState.invalid}
                        className="pr-24 font-mono"
                        {...field}
                        onChange={(e) => field.onChange(formatCard(e.target.value))}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {brand ?? <CreditCardIcon className="size-4" />}
                      </span>
                    </div>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="expiry"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="cc-exp">Expiry</FieldLabel>
                      <Input
                        id="cc-exp"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM / YY"
                        aria-invalid={fieldState.invalid}
                        className="font-mono"
                        {...field}
                        onChange={(e) => field.onChange(formatExpiry(e.target.value))}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="cvc"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="cc-csc">CVC</FieldLabel>
                      <Input
                        id="cc-csc"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        aria-invalid={fieldState.invalid}
                        className="font-mono"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </div>
              <TextField control={form.control} name="name" label="Name on card" autoComplete="cc-name" />
              <Controller
                control={form.control}
                name="country"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="cc-country">Country or region</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="cc-country" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(([code, label]) => (
                          <SelectItem key={code} value={code}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </FieldGroup>
            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <LockIcon /> Subscribe · {formatCurrency(total, "USD")}
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Renews on {format(renews, "MMMM d, yyyy")}. Cancel any time. This is a simulated checkout, no
              card is charged.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
