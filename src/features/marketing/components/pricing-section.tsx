"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plans, planPrice, type BillingInterval } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function BillingToggle({
  value,
  onChange,
}: {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing interval"
      className="inline-flex items-center rounded-full border bg-muted/50 p-1 text-sm"
    >
      {(["monthly", "yearly"] as const).map((interval) => (
        <button
          key={interval}
          role="radio"
          aria-checked={value === interval}
          onClick={() => onChange(interval)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-medium text-muted-foreground transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === interval && "bg-background text-foreground shadow-sm",
          )}
        >
          {interval === "monthly" ? "Monthly" : "Yearly"}
          {interval === "yearly" ? (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              -20%
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function PricingCards({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");
  const Heading = headingLevel;
  return (
    <div>
      <div className="flex justify-center">
        <BillingToggle value={interval} onChange={setBillingInterval} />
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = planPrice(plan, interval);
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                plan.highlighted && "border-primary/50 shadow-xl ring-1 shadow-indigo-500/10 ring-primary/30",
              )}
            >
              {plan.highlighted ? (
                <Badge className="bg-brand-gradient absolute -top-2.5 left-6 text-white">Most popular</Badge>
              ) : null}
              <Heading className="text-lg font-semibold">{plan.name}</Heading>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">${price}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="mt-1 h-5 text-xs text-muted-foreground">
                {price === 0
                  ? "Free forever"
                  : interval === "yearly"
                    ? `$${price * 12} billed yearly`
                    : "Billed monthly"}
              </p>
              <Button asChild className="mt-6" variant={plan.highlighted ? "default" : "outline"} size="lg">
                <Link href={`/signup?plan=${plan.id}&interval=${interval}`}>{plan.cta}</Link>
              </Button>
              <ul className="mt-6 space-y-2.5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
