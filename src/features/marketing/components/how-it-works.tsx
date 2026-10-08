import { CalendarPlusIcon, Link2Icon, RocketIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "./features-section";

const steps = [
  {
    icon: CalendarPlusIcon,
    title: "Set up in minutes",
    description: "Add your services, team and opening hours. Import clients from a CSV or another tool.",
  },
  {
    icon: Link2Icon,
    title: "Share your booking link",
    description: "Put it on Instagram, Google and your website. Clients book themselves, any time of day.",
  },
  {
    icon: RocketIcon,
    title: "Grow on autopilot",
    description: "Reminders cut no-shows, insights spot your best clients, and your calendar stays full.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-y bg-muted/20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="how-heading" eyebrow="How it works" title="Live by this afternoon" />
        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
          />
          <ol className="relative grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={i * 0.1} className="relative text-center">
                  <span className="relative mx-auto grid size-12 place-items-center rounded-xl border bg-background shadow-sm">
                    <step.icon className="size-5 text-primary" />
                    <span className="bg-brand-gradient absolute -top-2 -right-2 grid size-5 place-items-center rounded-full text-[10px] font-semibold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-5 font-semibold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{step.description}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
