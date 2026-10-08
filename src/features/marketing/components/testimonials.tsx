import { StarIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "./features-section";

const testimonials = [
  {
    quote:
      "We went from a paper diary and endless DMs to a booking page that fills itself. No-shows dropped by a third in the first month.",
    name: "Camila Rossi",
    role: "Owner, Atelier Nord",
    tone: "from-indigo-500 to-violet-500",
  },
  {
    quote:
      "The calendar is the first one my whole team actually likes. Dragging appointments between therapists takes seconds.",
    name: "Dr. Daniel Okafor",
    role: "Clinical Director, Pulse Clinic",
    tone: "from-sky-500 to-indigo-500",
  },
  {
    quote:
      "I can see who my best clients are and who has not been back in a while. That alone paid for the Pro plan.",
    name: "Yuki Sato",
    role: "Founder, Maison Lune",
    tone: "from-pink-500 to-rose-500",
  },
  {
    quote: "Set up on a Sunday evening, live on Monday morning. The onboarding is genuinely that simple.",
    name: "Omar Haddad",
    role: "Independent consultant",
    tone: "from-amber-500 to-orange-500",
  },
  {
    quote:
      "Our clients compliment the booking experience constantly. It feels like a much bigger brand than we are.",
    name: "Ines Silva",
    role: "Co-founder, Solace Spa",
    tone: "from-teal-500 to-emerald-500",
  },
  {
    quote: "Reports used to take me a whole afternoon. Now I glance at the overview with my morning coffee.",
    name: "Ryan Novak",
    role: "Manager, Bloom & Co",
    tone: "from-violet-500 to-fuchsia-500",
  },
];

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="border-y bg-muted/20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="testimonials-heading"
          eyebrow="Loved by small businesses"
          title="Less admin. More time with clients."
        />
        <div className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={(i % 3) * 0.08} className="mb-4 break-inside-avoid">
              <figure className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex gap-0.5" role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-4 text-[15px] leading-relaxed text-pretty">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className={`grid size-9 place-items-center rounded-full bg-gradient-to-br ${t.tone} text-xs font-semibold text-white`}
                  >
                    {t.name
                      .replace("Dr. ", "")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
