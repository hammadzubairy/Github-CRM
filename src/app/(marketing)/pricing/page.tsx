import type { Metadata } from "next";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Faq } from "@/features/marketing/components/faq";
import { FinalCta } from "@/features/marketing/components/final-cta";
import { PageHero } from "@/features/marketing/components/page-hero";
import { PricingCards } from "@/features/marketing/components/pricing-section";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for FlowDesk. Start free, upgrade to Pro for $19/month or Business for $49/month.",
  alternates: { canonical: "/pricing" },
};

type Cell = boolean | string;

const comparison: { group: string; rows: { label: string; values: [Cell, Cell, Cell] }[] }[] = [
  {
    group: "Scheduling",
    rows: [
      { label: "Staff calendars", values: ["1", "Up to 5", "Unlimited"] },
      { label: "Bookings per month", values: ["50", "Unlimited", "Unlimited"] },
      { label: "Public booking page", values: [true, true, true] },
      { label: "Day, week & month views", values: [true, true, true] },
      { label: "Multiple locations", values: [false, false, true] },
    ],
  },
  {
    group: "Clients",
    rows: [
      { label: "Client records & notes", values: [true, true, true] },
      { label: "Tags, filters & bulk actions", values: [false, true, true] },
      { label: "CSV import & export", values: [false, true, true] },
    ],
  },
  {
    group: "Automation & insights",
    rows: [
      { label: "Email confirmations", values: [true, true, true] },
      { label: "SMS reminders", values: [false, true, true] },
      { label: "Revenue & retention analytics", values: [false, true, true] },
      { label: "Advanced reporting", values: [false, false, true] },
      { label: "API & webhooks", values: [false, false, true] },
    ],
  },
  {
    group: "Team & support",
    rows: [
      { label: "Roles & permissions", values: [false, "Basic", "Advanced"] },
      { label: "Support", values: ["Community", "Email", "Priority"] },
    ],
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) return <CheckIcon className="mx-auto size-4 text-primary" aria-label="Included" />;
  if (value === false)
    return <MinusIcon className="mx-auto size-4 text-muted-foreground/50" aria-label="Not included" />;
  return <span className="text-sm">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Pricing that pays for itself"
        description="One recovered no-show a month covers the Pro plan. Start free, upgrade any time, and save 20% with yearly billing."
      />
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <PricingCards headingLevel="h2" />
        </div>
      </section>
      <section aria-labelledby="compare-heading" className="pb-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="compare-heading" className="text-center text-2xl font-semibold tracking-tight">
            Compare plans
          </h2>
          <div className="mt-8 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b bg-muted/40 text-sm">
                  <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
                    Features
                  </th>
                  {["Free", "Pro", "Business"].map((p) => (
                    <th key={p} scope="col" className="px-5 py-3 text-center font-semibold">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              {comparison.map((group) => (
                <tbody key={group.group}>
                  <tr>
                    <th
                      colSpan={4}
                      scope="colgroup"
                      className="bg-muted/20 px-5 pt-5 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      {group.group}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t">
                      <th scope="row" className="px-5 py-3 text-sm font-normal">
                        {row.label}
                      </th>
                      {row.values.map((v, i) => (
                        <td key={i} className="px-5 py-3 text-center">
                          <CellValue value={v} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </section>
      <Faq />
      <FinalCta />
    </>
  );
}
