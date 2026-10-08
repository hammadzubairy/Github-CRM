import { ChevronDownIcon } from "lucide-react";
import { SectionHeading } from "./features-section";

export const faqs = [
  {
    q: "Is there really a free plan?",
    a: "Yes. The Free plan includes one staff calendar, 50 bookings per month and your own booking page — forever, no credit card required.",
  },
  {
    q: "Can my clients book without creating an account?",
    a: "Absolutely. Clients choose a service, a team member and a time, enter their name and email, and they are done. Returning clients are recognised automatically.",
  },
  {
    q: "How do reminders work?",
    a: "FlowDesk sends a confirmation as soon as a booking is made and reminders 24 hours and 2 hours before the appointment. On Pro and Business you can add SMS reminders too.",
  },
  {
    q: "Can I import my existing clients?",
    a: "Yes. Upload a CSV from any spreadsheet or booking tool and FlowDesk maps the columns for you. You can export everything just as easily.",
  },
  {
    q: "Is my data secure?",
    a: "Every workspace is isolated with row-level security, data is encrypted in transit and at rest, and payments are handled by Stripe — we never store card details.",
  },
  {
    q: "Can I change plans later?",
    a: "Any time. Upgrades are prorated instantly and downgrades take effect at the end of your billing period. Yearly plans save 20%.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-heading" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading id="faq-heading" eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 flex flex-col">
          {faqs.map((item) => (
            <details key={item.q} name="faq" className="group not-last:border-b">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg py-3 text-[15px] font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                <h3>{item.q}</h3>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="pb-4 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
