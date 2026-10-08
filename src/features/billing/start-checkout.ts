"use client";

import { toast } from "sonner";
import type { BillingInterval, PlanId } from "@/lib/plans";
import type { DataMode } from "@/lib/store/app-store";

/**
 * Demo workspaces use the built-in mock checkout. Real workspaces get a Stripe Checkout session.
 * Returns the URL to navigate to, or null when checkout could not start.
 */
export async function startCheckout({
  mode,
  businessId,
  plan,
  interval,
}: {
  mode: DataMode;
  businessId: string;
  plan: Exclude<PlanId, "free">;
  interval: BillingInterval;
}): Promise<string | null> {
  if (mode === "demo") return `/app/billing/checkout?plan=${plan}&interval=${interval}`;
  return postForUrl("/api/stripe/checkout", { businessId, plan, interval }, "Could not start checkout");
}

export async function openBillingPortal(businessId: string): Promise<string | null> {
  return postForUrl("/api/stripe/portal", { businessId }, "Could not open the billing portal");
}

async function postForUrl(endpoint: string, body: object, fallback: string): Promise<string | null> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !data.url) throw new Error(data.error ?? fallback);
    return data.url;
  } catch (error) {
    toast.error(fallback, { description: error instanceof Error ? error.message : undefined });
    return null;
  }
}
