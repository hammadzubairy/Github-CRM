import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isPlanId, type BillingInterval, type PlanId } from "@/lib/plans";
import { getStripe, planForPriceId } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type Admin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

const toIso = (seconds: number | null | undefined) =>
  seconds ? new Date(seconds * 1000).toISOString() : null;

function planFromSubscription(
  subscription: Stripe.Subscription,
): { plan: PlanId; interval: BillingInterval } | null {
  const fromPrice = planForPriceId(subscription.items.data[0]?.price.id);
  if (fromPrice) return fromPrice;
  const { plan, interval } = subscription.metadata ?? {};
  if (isPlanId(plan) && (interval === "monthly" || interval === "yearly")) return { plan, interval };
  return null;
}

async function syncSubscription(admin: Admin, subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const businessId = subscription.metadata?.businessId;
  const active = ["active", "trialing", "past_due"].includes(subscription.status);
  const resolved = planFromSubscription(subscription);

  const update =
    active && resolved
      ? {
          plan: resolved.plan,
          plan_interval: resolved.interval,
          current_period_end: toIso(subscription.items.data[0]?.current_period_end),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
        }
      : {
          plan: "free" as const,
          plan_interval: "monthly" as const,
          current_period_end: null,
          stripe_subscription_id: null,
        };

  const query = admin.from("businesses").update(update);
  const { error } = businessId
    ? await query.eq("id", businessId)
    : await query.eq("stripe_customer_id", customerId);
  if (error) throw new Error(error.message);

  if (businessId) {
    await admin.from("activity_log").insert({
      business_id: businessId,
      type: "plan_changed",
      message:
        active && resolved
          ? `Subscription active on the ${resolved.plan} plan`
          : "Subscription ended, workspace moved to Free",
    });
  }
}

async function recordInvoice(admin: Admin, invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId || !invoice.id) return;
  const { data: business } = await admin
    .from("businesses")
    .select("id, plan")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (!business) return;

  const line = invoice.lines.data[0];
  const price = line?.pricing?.price_details?.price;
  const { error } = await admin.from("invoices").upsert(
    {
      business_id: business.id,
      number: invoice.number ?? invoice.id,
      amount: (invoice.amount_paid ?? 0) / 100,
      status: invoice.status === "paid" ? "paid" : invoice.status === "void" ? "void" : "open",
      plan: planForPriceId(typeof price === "string" ? price : price?.id)?.plan ?? business.plan,
      period_start: toIso(line?.period.start ?? invoice.period_start),
      period_end: toIso(line?.period.end ?? invoice.period_end),
      stripe_invoice_id: invoice.id,
    },
    { onConflict: "stripe_invoice_id" },
  );
  if (error) throw new Error(error.message);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = createSupabaseAdminClient();
  if (!stripe || !secret || !admin) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          if (!subscription.metadata?.businessId && session.client_reference_id) {
            subscription.metadata = { ...subscription.metadata, businessId: session.client_reference_id };
          }
          await syncSubscription(admin, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(admin, event.data.object);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await recordInvoice(admin, event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
