/**
 * Seeds a Supabase database with the same realistic data used by demo mode.
 *
 *   DATABASE_URL=postgres://... SEED_OWNER_EMAIL=you@example.com npm run db:seed
 *
 * The owner must already exist in auth.users (sign up once through the app first).
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { generateDemoData } from "../src/lib/demo/seed";
import * as schema from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  const ownerEmail = process.env.SEED_OWNER_EMAIL;
  if (!url || !ownerEmail) {
    throw new Error("DATABASE_URL and SEED_OWNER_EMAIL are required");
  }

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const owners = await db.execute<{ id: string; name: string | null }>(
    sql`select u.id, p.full_name as name from auth.users u left join public.profiles p on p.id = u.id where lower(u.email) = lower(${ownerEmail}) limit 1`,
  );
  const owner = owners[0];
  if (!owner) throw new Error(`No auth user found for ${ownerEmail}. Sign up first.`);

  const data = generateDemoData(new Date(), {
    id: owner.id,
    name: owner.name || ownerEmail.split("@")[0],
    email: ownerEmail,
    title: "Owner",
  });

  const chunk = <T>(rows: T[], size = 500) =>
    Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, i * size + size));

  await db.transaction(async (tx) => {
    for (const b of data.businesses) {
      await tx.delete(schema.businesses).where(sql`${schema.businesses.slug} = ${b.slug}`);
    }

    await tx.insert(schema.businesses).values(
      data.businesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        industry: b.industry,
        email: b.email,
        phone: b.phone,
        address: b.address,
        description: b.description,
        timezone: b.timezone,
        currency: b.currency,
        accentHue: b.accentHue,
        plan: b.plan,
        planInterval: b.planInterval,
        currentPeriodEnd: b.currentPeriodEnd ? new Date(b.currentPeriodEnd) : null,
        workingHours: b.workingHours,
        createdAt: new Date(b.createdAt),
      })),
    );

    await tx
      .insert(schema.memberships)
      .values(data.businesses.map((b) => ({ businessId: b.id, userId: owner.id, role: "owner" as const })));

    await tx
      .insert(schema.services)
      .values(data.services.map((s) => ({ ...s, createdAt: new Date(s.createdAt) })));
    await tx.insert(schema.staff).values(
      data.staff.map((m) => ({
        ...m,
        userId: m.role === "owner" ? owner.id : null,
        createdAt: new Date(m.createdAt),
      })),
    );
    for (const rows of chunk(data.clients)) {
      await tx.insert(schema.clients).values(rows.map((c) => ({ ...c, createdAt: new Date(c.createdAt) })));
    }
    for (const rows of chunk(data.notes)) {
      await tx
        .insert(schema.clientNotes)
        .values(rows.map((n) => ({ ...n, createdAt: new Date(n.createdAt) })));
    }
    for (const rows of chunk(data.appointments)) {
      await tx.insert(schema.appointments).values(
        rows.map(({ start, end, ...a }) => ({
          ...a,
          startsAt: new Date(start),
          endsAt: new Date(end),
          createdAt: new Date(a.createdAt),
        })),
      );
    }
    await tx.insert(schema.invoices).values(
      data.invoices.map((i) => ({
        ...i,
        periodStart: new Date(i.periodStart),
        periodEnd: new Date(i.periodEnd),
        createdAt: new Date(i.createdAt),
      })),
    );
    await tx
      .insert(schema.activityLog)
      .values(data.activity.map((a) => ({ ...a, createdAt: new Date(a.createdAt) })));
  });

  console.log(
    `Seeded ${data.businesses.length} businesses, ${data.clients.length} clients and ${data.appointments.length} appointments for ${ownerEmail}.`,
  );
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
