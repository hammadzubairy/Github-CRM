import "server-only";
import Stripe from "stripe";
import { isPlanId, type BillingInterval, type PlanId } from "@/lib/plans";

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key, { appInfo: { name: "FlowDesk" } });
  return client;
}

const priceEnv: Record<Exclude<PlanId, "free">, Record<BillingInterval, string>> = {
  pro: { monthly: "STRIPE_PRICE_PRO_MONTHLY", yearly: "STRIPE_PRICE_PRO_YEARLY" },
  business: { monthly: "STRIPE_PRICE_BUSINESS_MONTHLY", yearly: "STRIPE_PRICE_BUSINESS_YEARLY" },
};

export function priceIdFor(plan: PlanId, interval: BillingInterval): string | null {
  if (plan === "free") return null;
  return process.env[priceEnv[plan][interval]] || null;
}

export function planForPriceId(
  priceId: string | undefined,
): { plan: PlanId; interval: BillingInterval } | null {
  if (!priceId) return null;
  for (const [plan, intervals] of Object.entries(priceEnv)) {
    for (const [interval, envKey] of Object.entries(intervals)) {
      if (process.env[envKey] === priceId && isPlanId(plan)) {
        return { plan, interval: interval as BillingInterval };
      }
    }
  }
  return null;
}
