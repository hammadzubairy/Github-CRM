import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import {
  AnalyticsIllustration,
  BookingIllustration,
  CalendarIllustration,
  ClientsIllustration,
  PaymentsIllustration,
  RemindersIllustration,
} from "./feature-illustrations";

const features = [
  {
    title: "A booking page clients love",
    description:
      "Share one link. Clients pick a service, a team member and a time that actually works — 24/7.",
    illustration: <BookingIllustration />,
    className: "md:col-span-2",
  },
  {
    title: "Drag-and-drop calendar",
    description: "Day, week and month views for the whole team. Reschedule with a drag.",
    illustration: <CalendarIllustration />,
    className: "",
  },
  {
    title: "Client records that remember",
    description: "History, notes, tags and lifetime value — everything before they sit down.",
    illustration: <ClientsIllustration />,
    className: "",
  },
  {
    title: "Reminders that cut no-shows",
    description: "Automatic email and SMS confirmations and reminders, sent at the right moment.",
    illustration: <RemindersIllustration />,
    className: "",
  },
  {
    title: "Analytics that drive decisions",
    description: "Revenue, utilisation, retention and no-show rate, updated in real time.",
    illustration: <AnalyticsIllustration />,
    className: "",
  },
  {
    title: "Simple, transparent billing",
    description: "Upgrade, downgrade or cancel in a click. Every invoice in one place.",
    illustration: <PaymentsIllustration />,
    className: "md:col-span-2 lg:col-span-1",
  },
];

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-pretty text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="features-heading"
          eyebrow="Everything in one place"
          title="Replace five tools with one calm workspace"
          description="FlowDesk brings booking, scheduling, client management, reminders and billing together — designed for the way service businesses actually work."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.06} className={cn("h-full", feature.className)}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="bg-grid relative mb-5 rounded-xl border bg-muted/40 [background-size:20px_20px] p-4">
                  {feature.illustration}
                </div>
                <h3 className="font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
