import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface BillingContext {
  userId: string;
  email: string;
  business: { id: string; name: string; stripe_customer_id: string | null };
}

/** Resolves the signed-in user and checks they are an owner or admin of the business. */
export async function getBillingContext(
  businessId: string,
): Promise<{ ok: true; context: BillingContext } | { ok: false; status: number; error: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, status: 501, error: "Supabase is not configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, status: 401, error: "Please sign in again" };

  const { data: membership } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!membership || !["owner", "admin"].includes(membership.role as string)) {
    return { ok: false, status: 403, error: "Only owners and admins can manage billing" };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, stripe_customer_id")
    .eq("id", businessId)
    .single();
  if (!business) return { ok: false, status: 404, error: "Workspace not found" };

  return { ok: true, context: { userId: auth.user.id, email: auth.user.email ?? "", business } };
}
