import { addDays, addMinutes, setHours, setMinutes, startOfDay, subDays, subMonths } from "date-fns";
import type {
  Activity,
  Appointment,
  AppointmentStatus,
  Business,
  Client,
  ClientNote,
  ClientStatus,
  DataSnapshot,
  Industry,
  Invoice,
  Profile,
  Service,
  StaffMember,
  WorkingDay,
} from "@/lib/data/types";
import type { BillingInterval, PlanId } from "@/lib/plans";
import { getPlan } from "@/lib/plans";
import { chance, createRng, int, pick, uuid, type Rng } from "./random";

export const DEMO_SEED_VERSION = 4;

export const demoProfile: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Alex Morgan",
  email: "demo@flowdesk.app",
  title: "Owner",
};

interface ServiceSeed {
  name: string;
  description: string;
  category: string;
  durationMin: number;
  price: number;
  color: string;
}

interface StaffSeed {
  name: string;
  title: string;
  role: StaffMember["role"];
  color: string;
  /** Indexes into the service list; empty means all. */
  services: number[];
}

interface BusinessSeed {
  name: string;
  slug: string;
  industry: Industry;
  email: string;
  phone: string;
  address: string;
  description: string;
  accentHue: number;
  plan: PlanId;
  planInterval: BillingInterval;
  clientCount: number;
  dailyLoad: number;
  tags: string[];
  workingHours: WorkingDay[];
  services: ServiceSeed[];
  staff: StaffSeed[];
  noteTemplates: string[];
}

const salonHours: WorkingDay[] = [
  { day: 0, open: false, start: "10:00", end: "16:00" },
  { day: 1, open: true, start: "09:00", end: "18:00" },
  { day: 2, open: true, start: "09:00", end: "19:00" },
  { day: 3, open: true, start: "09:00", end: "19:00" },
  { day: 4, open: true, start: "09:00", end: "20:00" },
  { day: 5, open: true, start: "09:00", end: "19:00" },
  { day: 6, open: true, start: "10:00", end: "17:00" },
];

const clinicHours: WorkingDay[] = [
  { day: 0, open: false, start: "09:00", end: "13:00" },
  { day: 1, open: true, start: "08:00", end: "18:00" },
  { day: 2, open: true, start: "08:00", end: "18:00" },
  { day: 3, open: true, start: "08:00", end: "18:00" },
  { day: 4, open: true, start: "08:00", end: "18:00" },
  { day: 5, open: true, start: "08:00", end: "16:00" },
  { day: 6, open: true, start: "09:00", end: "13:00" },
];

const businessSeeds: BusinessSeed[] = [
  {
    name: "Lumière Hair Studio",
    slug: "lumiere-studio",
    industry: "salon",
    email: "hello@lumiere.studio",
    phone: "+1 (415) 555-0142",
    address: "218 Valencia St, San Francisco, CA",
    description:
      "An independent hair studio specialising in lived-in color, precision cuts and bridal styling.",
    accentHue: 285,
    plan: "pro",
    planInterval: "monthly",
    clientCount: 190,
    dailyLoad: 0.34,
    tags: ["VIP", "Color", "Referral", "Wedding", "Student", "Sensitive scalp"],
    workingHours: salonHours,
    services: [
      {
        name: "Signature Cut & Style",
        description: "Consultation, wash, precision cut and blow-dry.",
        category: "Cuts",
        durationMin: 60,
        price: 85,
        color: "#6366f1",
      },
      {
        name: "Men's Cut",
        description: "Classic or modern cut with hot towel finish.",
        category: "Cuts",
        durationMin: 30,
        price: 45,
        color: "#0ea5e9",
      },
      {
        name: "Balayage",
        description: "Hand-painted, lived-in color with toner and gloss.",
        category: "Color",
        durationMin: 150,
        price: 220,
        color: "#a855f7",
      },
      {
        name: "Root Color",
        description: "All-over root touch-up with glossing treatment.",
        category: "Color",
        durationMin: 90,
        price: 120,
        color: "#ec4899",
      },
      {
        name: "Blowout",
        description: "Wash and volumising blow-dry.",
        category: "Styling",
        durationMin: 45,
        price: 55,
        color: "#14b8a6",
      },
      {
        name: "Keratin Treatment",
        description: "Smoothing treatment for frizz-free hair for up to 4 months.",
        category: "Treatments",
        durationMin: 120,
        price: 260,
        color: "#f59e0b",
      },
      {
        name: "Bridal Styling",
        description: "Trial-ready bridal or event updo.",
        category: "Styling",
        durationMin: 90,
        price: 180,
        color: "#f43f5e",
      },
    ],
    staff: [
      { name: "Alex Morgan", title: "Owner & Senior Stylist", role: "owner", color: "#6366f1", services: [] },
      { name: "Liam Chen", title: "Color Director", role: "admin", color: "#a855f7", services: [0, 2, 3, 5] },
      { name: "Ava Patel", title: "Stylist", role: "staff", color: "#14b8a6", services: [0, 4, 6] },
      { name: "Noah Brooks", title: "Barber", role: "staff", color: "#0ea5e9", services: [1, 4] },
    ],
    noteTemplates: [
      "Prefers a cooler toner, avoid anything brassy.",
      "Sensitive scalp, use the gentle shampoo.",
      "Booked her wedding trial for next spring.",
      "Likes to keep length, only dusting the ends.",
      "Allergic to PPD, patch test before any color.",
      "Always running 5 minutes late, buffer the next slot.",
      "Referred two friends this quarter, send a thank-you voucher.",
      "Wants to grow out the fringe over the next few visits.",
    ],
  },
  {
    name: "Northside Physio",
    slug: "northside-physio",
    industry: "clinic",
    email: "care@northsidephysio.com",
    phone: "+1 (312) 555-0199",
    address: "1450 N Halsted St, Chicago, IL",
    description: "Sports injury, rehab and manual therapy clinic with same-week appointments.",
    accentHue: 200,
    plan: "business",
    planInterval: "yearly",
    clientCount: 120,
    dailyLoad: 0.3,
    tags: ["Sports", "Post-op", "Insurance", "Referral", "Chronic pain"],
    workingHours: clinicHours,
    services: [
      {
        name: "Initial Assessment",
        description: "Full movement assessment and treatment plan.",
        category: "Assessment",
        durationMin: 60,
        price: 120,
        color: "#0ea5e9",
      },
      {
        name: "Follow-up Session",
        description: "Hands-on treatment and exercise progression.",
        category: "Treatment",
        durationMin: 30,
        price: 75,
        color: "#6366f1",
      },
      {
        name: "Sports Massage",
        description: "Deep tissue massage for recovery and performance.",
        category: "Massage",
        durationMin: 45,
        price: 90,
        color: "#14b8a6",
      },
      {
        name: "Dry Needling",
        description: "Targeted trigger point release.",
        category: "Treatment",
        durationMin: 30,
        price: 85,
        color: "#f59e0b",
      },
      {
        name: "Rehab Class",
        description: "Small-group strength and mobility rehab.",
        category: "Classes",
        durationMin: 45,
        price: 40,
        color: "#22c55e",
      },
    ],
    staff: [
      { name: "Alex Morgan", title: "Clinical Director", role: "owner", color: "#0ea5e9", services: [] },
      {
        name: "Dr. Hannah Okafor",
        title: "Senior Physiotherapist",
        role: "admin",
        color: "#6366f1",
        services: [0, 1, 3],
      },
      { name: "Elena García", title: "Massage Therapist", role: "staff", color: "#14b8a6", services: [2, 4] },
    ],
    noteTemplates: [
      "ACL reconstruction 8 weeks post-op, progressing well.",
      "Lower back pain flares after long drives.",
      "Training for the Chicago marathon in October.",
      "Insurance pre-authorisation approved for 10 sessions.",
      "Prefers early morning appointments before work.",
      "Home exercise compliance has improved a lot.",
    ],
  },
];

/** Public facts about the demo workspaces, safe to use on the server for metadata and static params. */
export const demoBookingPages = businessSeeds.map(
  ({ slug, name, description, address, phone, email, industry }) => ({
    slug,
    name,
    description,
    address,
    phone,
    email,
    industry,
  }),
);

const firstNames = [
  "Olivia",
  "Emma",
  "Charlotte",
  "Amelia",
  "Sophia",
  "Mia",
  "Isabella",
  "Harper",
  "Evelyn",
  "Luna",
  "Chloe",
  "Grace",
  "Zoe",
  "Nora",
  "Lily",
  "Hannah",
  "Aria",
  "Maya",
  "Leah",
  "Ella",
  "James",
  "Benjamin",
  "Lucas",
  "Henry",
  "Theo",
  "Jack",
  "Leo",
  "Owen",
  "Daniel",
  "Mateo",
  "Ethan",
  "Samuel",
  "Julian",
  "Ezra",
  "Kai",
  "Omar",
  "Ryan",
  "Adrian",
  "Yuki",
  "Priya",
  "Fatima",
  "Sara",
  "Ines",
  "Nadia",
  "Camila",
  "Rosa",
  "Aisha",
  "Mei",
  "Ivy",
  "Naomi",
];

const lastNames = [
  "Johnson",
  "Williams",
  "Brown",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Lopez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Thompson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Nguyen",
  "Hill",
  "Kim",
  "Shah",
  "Rossi",
  "Novak",
  "Haddad",
  "Kowalski",
  "Fischer",
  "Okafor",
  "Sato",
  "Silva",
];

const emailDomains = ["gmail.com", "outlook.com", "icloud.com", "proton.me", "yahoo.com"];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function weightedStatus(rng: Rng, isPast: boolean, daysAway: number): AppointmentStatus {
  if (isPast) {
    const r = rng();
    if (r < 0.87) return "completed";
    if (r < 0.93) return "no_show";
    return "cancelled";
  }
  if (daysAway > 2 && chance(rng, 0.12)) return "pending";
  return chance(rng, 0.03) ? "cancelled" : "confirmed";
}

function buildBusiness(seed: BusinessSeed, index: number, now: Date, ownerName: string) {
  const rng = createRng(1337 + index * 7919);
  const created = subMonths(now, 14 - index * 3).toISOString();

  const business: Business = {
    id: uuid(rng),
    name: seed.name,
    slug: seed.slug,
    industry: seed.industry,
    email: seed.email,
    phone: seed.phone,
    address: seed.address,
    description: seed.description,
    timezone: "America/Los_Angeles",
    currency: "USD",
    accentHue: seed.accentHue,
    plan: seed.plan,
    planInterval: seed.planInterval,
    currentPeriodEnd: addDays(startOfDay(now), 18).toISOString(),
    workingHours: seed.workingHours,
    createdAt: created,
  };

  const services: Service[] = seed.services.map((s) => ({
    id: uuid(rng),
    businessId: business.id,
    ...s,
    active: true,
    createdAt: created,
  }));

  const staff: StaffMember[] = seed.staff.map((s, i) => {
    const name = i === 0 ? ownerName : s.name;
    return {
      id: uuid(rng),
      businessId: business.id,
      name,
      email:
        i === 0
          ? demoProfile.email
          : `${name
              .toLowerCase()
              .replace(/[^a-z]+/g, ".")
              .replace(/^\.|\.$/g, "")}@${seed.email.split("@")[1]}`,
      title: s.title,
      role: s.role,
      color: s.color,
      serviceIds: (s.services.length ? s.services : services.map((_, idx) => idx)).map(
        (idx) => services[idx].id,
      ),
      active: true,
      createdAt: created,
    };
  });

  // Clients, skewed so more of them joined recently.
  const clients: Client[] = [];
  const usedNames = new Set<string>();
  for (let i = 0; i < seed.clientCount; i++) {
    let name = "";
    do {
      name = `${pick(rng, firstNames)} ${pick(rng, lastNames)}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    const ageDays = Math.floor(Math.pow(rng(), 1.6) * 360) + 1;
    const [first, last] = name.toLowerCase().split(" ");
    const tags = seed.tags.filter(() => chance(rng, 0.14)).slice(0, 2);
    clients.push({
      id: uuid(rng),
      businessId: business.id,
      name,
      email: `${first}.${last}${chance(rng, 0.3) ? int(rng, 1, 99) : ""}@${pick(rng, emailDomains)}`,
      phone: `+1 (${int(rng, 200, 989)}) 555-${String(int(rng, 100, 9999)).padStart(4, "0")}`,
      status: "active",
      tags,
      createdAt: subDays(now, ageDays).toISOString(),
    });
  }
  clients.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // Regulars get booked far more often than one-off visitors.
  const loyalty = clients.map(() => Math.pow(rng(), 2.2));

  const appointments: Appointment[] = [];
  const clientCreatedTimes = clients.map((c) => Date.parse(c.createdAt)).sort((a, b) => a - b);
  const clientsCreatedBy = (time: number) => {
    let lo = 0;
    let hi = clientCreatedTimes.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (clientCreatedTimes[mid] <= time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const today = startOfDay(now);
  const pastDays = 84;
  const futureDays = 24;

  for (let offset = -pastDays; offset <= futureDays; offset++) {
    const day = addDays(today, offset);
    const hours = seed.workingHours.find((h) => h.day === day.getDay());
    if (!hours?.open) continue;
    const open = toMinutes(hours.start);
    const close = toMinutes(hours.end);
    const growth = (offset + pastDays) / (pastDays + futureDays);
    const futureFade = offset > 0 ? Math.max(0.25, 1 - offset / (futureDays + 6)) : 1;
    const load = Math.min(0.92, (seed.dailyLoad + growth * 0.14) * futureFade);

    for (const member of staff) {
      let cursor = open + (chance(rng, 0.4) ? 30 : 0);
      while (cursor < close - 30) {
        const serviceId = pick(rng, member.serviceIds);
        const service = services.find((s) => s.id === serviceId)!;
        if (cursor + service.durationMin > close) break;
        if (rng() < load) {
          const startAt = addMinutes(setMinutes(setHours(day, 0), 0), cursor);
          if (startAt <= now || offset >= 0) {
            const eligibleCount = clientsCreatedBy(startAt.getTime());
            const pool = Math.max(8, eligibleCount);
            let clientIndex = Math.floor(rng() * pool);
            if (chance(rng, 0.55)) {
              let best = clientIndex;
              for (let k = 0; k < 4; k++) {
                const candidate = Math.floor(rng() * pool);
                if (loyalty[candidate] > loyalty[best]) best = candidate;
              }
              clientIndex = best;
            }
            const client = clients[Math.min(clientIndex, clients.length - 1)];
            const endAt = addMinutes(startAt, service.durationMin);
            const isPast = endAt <= now;
            const status = weightedStatus(rng, isPast, offset);
            appointments.push({
              id: uuid(rng),
              businessId: business.id,
              clientId: client.id,
              staffId: member.id,
              serviceId: service.id,
              start: startAt.toISOString(),
              end: endAt.toISOString(),
              status,
              price: service.price,
              notes: chance(rng, 0.08) ? pick(rng, seed.noteTemplates) : "",
              source: chance(rng, 0.64) ? "online" : "manual",
              createdAt: subDays(startAt, int(rng, 1, 21)).toISOString(),
            });
          }
          cursor += service.durationMin + (chance(rng, 0.3) ? 15 : 0);
        } else {
          cursor += 30;
        }
      }
    }
  }

  // Derive client status from their history.
  const visits = new Map<string, { count: number; last: string; spent: number }>();
  for (const a of appointments) {
    if (a.status !== "completed") continue;
    const v = visits.get(a.clientId) ?? { count: 0, last: "", spent: 0 };
    v.count += 1;
    v.spent += a.price;
    if (a.start > v.last) v.last = a.start;
    visits.set(a.clientId, v);
  }
  for (const c of clients) {
    const v = visits.get(c.id);
    let status: ClientStatus = "active";
    if (!v) status = "new";
    else if (v.spent > 1400 || v.count >= 11) status = "vip";
    else if (v.last < subDays(now, 75).toISOString()) status = "inactive";
    c.status = status;
    if (status === "vip" && !c.tags.includes("VIP") && seed.tags.includes("VIP"))
      c.tags = ["VIP", ...c.tags].slice(0, 3);
  }

  const notes: ClientNote[] = [];
  for (const c of clients) {
    if (!chance(rng, 0.32)) continue;
    const count = int(rng, 1, 2);
    for (let i = 0; i < count; i++) {
      const author = pick(rng, staff);
      notes.push({
        id: uuid(rng),
        businessId: business.id,
        clientId: c.id,
        body: pick(rng, seed.noteTemplates),
        author: author.name,
        createdAt: subDays(now, int(rng, 1, 80)).toISOString(),
      });
    }
  }

  const plan = getPlan(seed.plan);
  const invoices: Invoice[] = [];
  const invoiceCount = seed.planInterval === "yearly" ? 2 : 6;
  for (let i = 0; i < invoiceCount; i++) {
    const periodStart =
      seed.planInterval === "yearly" ? subMonths(today, 12 * i + 11) : subMonths(today, i + 1);
    const periodEnd = seed.planInterval === "yearly" ? addDays(periodStart, 365) : addDays(periodStart, 30);
    const amount = seed.planInterval === "yearly" ? plan.yearly * 12 : plan.monthly;
    invoices.push({
      id: uuid(rng),
      businessId: business.id,
      number: `FD-${String(2041 + index * 300 + (invoiceCount - i) * 7).padStart(5, "0")}`,
      amount,
      status: "paid",
      plan: seed.plan,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      createdAt: periodStart.toISOString(),
    });
  }

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const recent = appointments
    .filter((a) => a.createdAt <= now.toISOString())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 18);
  const activity: Activity[] = recent.map((a, i) => {
    const client = clientById.get(a.clientId)!;
    const service = serviceById.get(a.serviceId)!;
    const createdAt = new Date(now.getTime() - (i * 47 + int(rng, 3, 40)) * 60_000).toISOString();
    if (a.status === "cancelled") {
      return {
        id: uuid(rng),
        businessId: business.id,
        type: "booking_cancelled",
        message: `${client.name} cancelled ${service.name}`,
        createdAt,
      };
    }
    if (i % 5 === 3) {
      return {
        id: uuid(rng),
        businessId: business.id,
        type: "payment_received",
        message: `Payment of $${a.price} received from ${client.name}`,
        createdAt,
      };
    }
    if (i % 7 === 5) {
      return {
        id: uuid(rng),
        businessId: business.id,
        type: "review_received",
        message: `${client.name} left a 5-star review`,
        createdAt,
      };
    }
    if (i % 6 === 4) {
      return {
        id: uuid(rng),
        businessId: business.id,
        type: "client_created",
        message: `New client ${client.name} joined via booking page`,
        createdAt,
      };
    }
    return {
      id: uuid(rng),
      businessId: business.id,
      type: "booking_created",
      message: `${client.name} booked ${service.name}`,
      createdAt,
    };
  });

  return { business, staff, services, clients, notes, appointments, invoices, activity };
}

export function generateDemoData(now: Date = new Date(), profile: Profile = demoProfile): DataSnapshot {
  const snapshot: DataSnapshot = {
    profile,
    businesses: [],
    staff: [],
    services: [],
    clients: [],
    notes: [],
    appointments: [],
    invoices: [],
    activity: [],
  };
  businessSeeds.forEach((seed, index) => {
    const result = buildBusiness(seed, index, now, profile.name);
    snapshot.businesses.push(result.business);
    snapshot.staff.push(...result.staff);
    snapshot.services.push(...result.services);
    snapshot.clients.push(...result.clients);
    snapshot.notes.push(...result.notes);
    snapshot.appointments.push(...result.appointments);
    snapshot.invoices.push(...result.invoices);
    snapshot.activity.push(...result.activity);
  });
  return snapshot;
}
