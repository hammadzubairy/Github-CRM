import type { Metadata } from "next";
import {
  BarChart3Icon,
  BellRingIcon,
  BriefcaseBusinessIcon,
  CalendarRangeIcon,
  CommandIcon,
  CreditCardIcon,
  Globe2Icon,
  HeartPulseIcon,
  LockKeyholeIcon,
  MoonIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UsersRoundIcon,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { FeaturesSection } from "@/features/marketing/components/features-section";
import { FinalCta } from "@/features/marketing/components/final-cta";
import { PageHero } from "@/features/marketing/components/page-hero";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Online booking page, drag-and-drop team calendar, client CRM, automated reminders, analytics and billing — every FlowDesk feature in one place.",
  alternates: { canonical: "/features" },
};

const capabilities = [
  {
    icon: Globe2Icon,
    title: "Branded booking page",
    text: "Your logo, your colors, your services. Works beautifully on every phone.",
  },
  {
    icon: CalendarRangeIcon,
    title: "Team scheduling",
    text: "Per-staff working hours, service assignments and buffer times.",
  },
  {
    icon: UsersRoundIcon,
    title: "Client CRM",
    text: "Profiles, visit history, notes, tags and lifetime value at a glance.",
  },
  {
    icon: BellRingIcon,
    title: "Smart reminders",
    text: "Confirmation, reminder and follow-up messages that send themselves.",
  },
  {
    icon: BarChart3Icon,
    title: "Live analytics",
    text: "Revenue, bookings, utilisation and no-show rate by day, week or month.",
  },
  {
    icon: CreditCardIcon,
    title: "Stripe billing",
    text: "Upgrade in a click with secure Stripe Checkout and downloadable invoices.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Roles & permissions",
    text: "Owners, admins and staff each see exactly what they need.",
  },
  {
    icon: LockKeyholeIcon,
    title: "Isolated workspaces",
    text: "Row-level security keeps every business's data strictly separate.",
  },
  {
    icon: CommandIcon,
    title: "Keyboard first",
    text: "A command palette and shortcuts for everything you do daily.",
  },
  {
    icon: MoonIcon,
    title: "Light & dark mode",
    text: "Easy on the eyes from the morning rush to late-night admin.",
  },
  {
    icon: SmartphoneIcon,
    title: "Mobile ready",
    text: "Run your day from your phone with a fully responsive dashboard.",
  },
  {
    icon: BriefcaseBusinessIcon,
    title: "Multiple workspaces",
    text: "Manage several locations or brands and switch in one click.",
  },
];

const industries = [
  {
    id: "salons",
    icon: ScissorsIcon,
    title: "Hair & beauty salons",
    text: "Color processing gaps, stylist-specific services and rebooking prompts that keep chairs full.",
    points: ["Service durations per stylist", "Patch-test reminders in client notes", "VIP and color tags"],
  },
  {
    id: "clinics",
    icon: HeartPulseIcon,
    title: "Clinics & therapists",
    text: "Assessments, follow-ups and treatment plans with a clear history for every patient.",
    points: ["Initial vs follow-up services", "Secure treatment notes", "Same-week availability"],
  },
  {
    id: "consultants",
    icon: BriefcaseBusinessIcon,
    title: "Consultants & coaches",
    text: "Discovery calls, packages and recurring sessions with clients across time zones.",
    points: ["Shareable booking links", "Session packages", "Automatic time zone handling"],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything you need to run a fully booked business"
        description="From the first click on your booking page to the invoice at the end of the month, FlowDesk handles the busywork."
      />
      <FeaturesSection />
      <section aria-labelledby="industries-heading" className="border-y bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="industries-heading" className="text-center text-3xl font-semibold tracking-tight">
            Made for the way you work
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {industries.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.08}>
                <article id={item.id} className="h-full scroll-mt-24 rounded-2xl border bg-card p-6">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {item.points.map((p) => (
                      <li key={p} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary" /> {p}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section aria-labelledby="capabilities-heading" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="capabilities-heading" className="text-center text-3xl font-semibold tracking-tight">
            And a lot more under the hood
          </h2>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <div key={c.title} className="flex gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-background shadow-sm">
                  <c.icon className="size-4 text-primary" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FinalCta />
    </>
  );
}
