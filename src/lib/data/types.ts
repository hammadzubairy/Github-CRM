import type { BillingInterval, PlanId } from "@/lib/plans";

export type Role = "owner" | "admin" | "staff";
export type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled" | "no_show";
export type ClientStatus = "new" | "active" | "vip" | "inactive";
export type Industry = "salon" | "clinic" | "consulting";
export type AppointmentSource = "online" | "manual";

export interface WorkingDay {
  /** 0 = Sunday ... 6 = Saturday */
  day: number;
  open: boolean;
  start: string;
  end: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  industry: Industry;
  email: string;
  phone: string;
  address: string;
  description: string;
  timezone: string;
  currency: string;
  accentHue: number;
  plan: PlanId;
  planInterval: BillingInterval;
  currentPeriodEnd: string | null;
  workingHours: WorkingDay[];
  createdAt: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  email: string;
  title: string;
  role: Role;
  color: string;
  serviceIds: string[];
  active: boolean;
  createdAt: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;
  durationMin: number;
  price: number;
  color: string;
  active: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  tags: string[];
  createdAt: string;
}

export interface ClientNote {
  id: string;
  businessId: string;
  clientId: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  price: number;
  notes: string;
  source: AppointmentSource;
  createdAt: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  number: string;
  amount: number;
  status: "paid" | "open" | "void";
  plan: PlanId;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export type ActivityType =
  | "booking_created"
  | "booking_cancelled"
  | "booking_completed"
  | "client_created"
  | "payment_received"
  | "review_received"
  | "plan_changed";

export interface Activity {
  id: string;
  businessId: string;
  type: ActivityType;
  message: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  title: string;
}

export interface DataSnapshot {
  profile: Profile;
  businesses: Business[];
  staff: StaffMember[];
  services: Service[];
  clients: Client[];
  notes: ClientNote[];
  appointments: Appointment[];
  invoices: Invoice[];
  activity: Activity[];
}

export type EntityKey = Exclude<keyof DataSnapshot, "profile">;
