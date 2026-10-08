import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingContext } from "@/lib/billing-auth";
import { getSiteUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

const body = z.object({ businessId: z.uuid() });

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured for this deployment" }, { status: 501 });
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const auth = await getBillingContext(parsed.data.businessId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const customer = auth.context.business.stripe_customer_id;
  if (!customer) return NextResponse.json({ error: "No active subscription yet" }, { status: 400 });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${request.headers.get("origin") ?? getSiteUrl()}/app/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open the billing portal";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
