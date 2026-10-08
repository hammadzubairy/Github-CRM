import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { WorkingDay } from "@/lib/data/types";

export const memberRole = pgEnum("member_role", ["owner", "admin", "staff"]);
export const appointmentStatus = pgEnum("appointment_status", [
  "confirmed",
  "pending",
  "completed",
  "cancelled",
  "no_show",
]);
export const clientStatus = pgEnum("client_status", ["new", "active", "vip", "inactive"]);
export const planId = pgEnum("plan_id", ["free", "pro", "business"]);
export const billingInterval = pgEnum("billing_interval", ["monthly", "yearly"]);
export const industry = pgEnum("industry", ["salon", "clinic", "consulting"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name").notNull().default(""),
  title: text("title").notNull().default("Owner"),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  industry: industry("industry").notNull().default("salon"),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  description: text("description").notNull().default(""),
  timezone: text("timezone").notNull().default("UTC"),
  currency: text("currency").notNull().default("USD"),
  accentHue: integer("accent_hue").notNull().default(280),
  plan: planId("plan").notNull().default("free"),
  planInterval: billingInterval("plan_interval").notNull().default("monthly"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  workingHours: jsonb("working_hours").$type<WorkingDay[]>().notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  createdAt: createdAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: memberRole("role").notNull().default("staff"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.businessId, t.userId] })],
);

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  userId: uuid("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  title: text("title").notNull().default(""),
  role: memberRole("role").notNull().default("staff"),
  color: text("color").notNull().default("#6366f1"),
  serviceIds: uuid("service_ids").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("General"),
  durationMin: integer("duration_min").notNull(),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  color: text("color").notNull().default("#6366f1"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  status: clientStatus("status").notNull().default("new"),
  tags: text("tags").array().notNull().default([]),
  createdAt: createdAt(),
});

export const clientNotes = pgTable("client_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  author: text("author").notNull().default(""),
  createdAt: createdAt(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staff.id, { onDelete: "set null" }),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: appointmentStatus("status").notNull().default("confirmed"),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  notes: text("notes").notNull().default(""),
  source: text("source").notNull().default("manual"),
  createdAt: createdAt(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
  status: text("status").notNull().default("paid"),
  plan: planId("plan").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  createdAt: createdAt(),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: createdAt(),
});
