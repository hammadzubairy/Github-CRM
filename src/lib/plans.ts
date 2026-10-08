export type PlanId = "free" | "pro" | "business";
export type BillingInterval = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthly: number;
  /** Price per month when billed yearly. */
  yearly: number;
  highlighted?: boolean;
  cta: string;
  limits: {
    staff: number | null;
    bookingsPerMonth: number | null;
  };
  features: string[];
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "For solo practitioners getting started with online booking.",
    monthly: 0,
    yearly: 0,
    cta: "Start for free",
    limits: { staff: 1, bookingsPerMonth: 50 },
    features: [
      "1 staff calendar",
      "50 bookings per month",
      "Public booking page",
      "Client records & notes",
      "Email confirmations",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing studios that want automation and insights.",
    monthly: 19,
    yearly: 15,
    highlighted: true,
    cta: "Start 14-day trial",
    limits: { staff: 5, bookingsPerMonth: null },
    features: [
      "Up to 5 staff calendars",
      "Unlimited bookings",
      "SMS & email reminders",
      "Revenue & retention analytics",
      "Custom booking branding",
      "CSV import & export",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For multi-location teams with advanced controls.",
    monthly: 49,
    yearly: 39,
    cta: "Upgrade to Business",
    limits: { staff: null, bookingsPerMonth: null },
    features: [
      "Unlimited staff & locations",
      "Roles & permissions",
      "Priority support",
      "Advanced reporting",
      "API & webhooks",
      "Dedicated onboarding",
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  return plans.find((p) => p.id === id) ?? plans[0];
}

export function planPrice(plan: Plan, interval: BillingInterval): number {
  return interval === "yearly" ? plan.yearly : plan.monthly;
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "pro" || value === "business";
}
