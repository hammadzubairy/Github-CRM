import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataSnapshot, EntityKey, Profile } from "./types";

export const tableFor: Record<EntityKey, string> = {
  businesses: "businesses",
  staff: "staff",
  services: "services",
  clients: "clients",
  notes: "client_notes",
  appointments: "appointments",
  invoices: "invoices",
  activity: "activity_log",
};

/** Columns whose names differ from a plain camelCase to snake_case conversion. */
const columnAliases: Record<string, string> = { start: "starts_at", end: "ends_at" };
const fieldAliases: Record<string, string> = Object.fromEntries(
  Object.entries(columnAliases).map(([field, column]) => [column, field]),
);

const camelToSnake = (key: string) =>
  columnAliases[key] ?? key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const snakeToCamel = (key: string) =>
  fieldAliases[key] ?? key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const readOnlyBusinessColumns = new Set([
  "plan",
  "plan_interval",
  "current_period_end",
  "stripe_customer_id",
  "stripe_subscription_id",
  "created_at",
]);

export function toRow(record: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [camelToSnake(k), v]));
}

export function fromRow<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [snakeToCamel(k), v])) as T;
}

async function client(): Promise<SupabaseClient> {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

export const remote = {
  async upsert(entity: EntityKey, rows: object[]): Promise<void> {
    if (!rows.length) return;
    const { error } = await (await client()).from(tableFor[entity]).upsert(rows.map(toRow));
    if (error) throw new Error(error.message);
  },

  /** Businesses are never inserted from the client, so edits use a plain update. */
  async updateBusiness(business: object & { id: string }): Promise<void> {
    const row = Object.fromEntries(
      Object.entries(toRow(business)).filter(([key]) => !readOnlyBusinessColumns.has(key)),
    );
    const { error } = await (await client()).from("businesses").update(row).eq("id", business.id);
    if (error) throw new Error(error.message);
  },

  async remove(entity: EntityKey, ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await (await client()).from(tableFor[entity]).delete().in("id", ids);
    if (error) throw new Error(error.message);
  },

  async updateProfile(profile: Profile): Promise<void> {
    const supabase = await client();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.name, title: profile.title })
      .eq("id", profile.id);
    if (error) throw new Error(error.message);
  },

  async load(): Promise<DataSnapshot> {
    const supabase = await client();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) throw new Error("Not signed in");

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id, full_name, title")
      .eq("id", user.id)
      .maybeSingle();

    const profile: Profile = {
      id: user.id,
      name:
        (profileRow?.full_name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "You",
      email: user.email ?? "",
      title: (profileRow?.title as string | undefined) ?? "Owner",
    };

    let { data: businesses } = await supabase.from("businesses").select("*").order("created_at");
    if (!businesses?.length) {
      const businessName =
        (user.user_metadata?.business_name as string | undefined) ?? `${profile.name}'s Studio`;
      const { error } = await supabase.rpc("create_business", { business_name: businessName });
      if (error) throw new Error(error.message);
      ({ data: businesses } = await supabase.from("businesses").select("*").order("created_at"));
    }

    const entities: EntityKey[] = [
      "staff",
      "services",
      "clients",
      "notes",
      "appointments",
      "invoices",
      "activity",
    ];
    const results = await Promise.all(
      entities.map((entity) => supabase.from(tableFor[entity]).select("*").limit(5000)),
    );

    const snapshot: DataSnapshot = {
      profile,
      businesses: (businesses ?? []).map((row) => fromRow(row)),
      staff: [],
      services: [],
      clients: [],
      notes: [],
      appointments: [],
      invoices: [],
      activity: [],
    };
    results.forEach((result, i) => {
      if (result.error) throw new Error(result.error.message);
      const key = entities[i];
      (snapshot[key] as unknown[]) = (result.data ?? []).map((row) => fromRow(row));
    });
    return snapshot;
  },
};
