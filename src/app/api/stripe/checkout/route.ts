import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingContext } from "@/lib/billing-auth";
import { getSiteUrl } from "@/lib/env";
import { getStripe, priceIdFor } from "@/lib/stripe";

const body = z.object({
  businessId: z.uuid(),
  plan: z.enum(["pro", "business"]),
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured for this deployment" }, { status: 501 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { businessId, plan, interval } = parsed.data;

  const price = priceIdFor(plan, interval);
  if (!price) return NextResponse.json({ error: "This plan is not available yet" }, { status: 501 });

  const auth = await getBillingContext(businessId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { business, email, userId } = auth.context;

  const origin = request.headers.get("origin") ?? getSiteUrl();
  const metadata = { businessId, plan, interval, userId };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      ...(business.stripe_customer_id
        ? { customer: business.stripe_customer_id }
        : { customer_email: email || undefined }),
      client_reference_id: businessId,
      metadata,
      subscription_data: { metadata },
      allow_promotion_codes: true,
      success_url: `${origin}/app/billing?checkout=success`,
      cancel_url: `${origin}/app/billing?checkout=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
