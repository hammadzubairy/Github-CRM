import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/features/marketing/components/page-hero";

export const metadata: Metadata = {
  title: "Changelog",
  description: "New features, improvements and fixes shipped to FlowDesk.",
  alternates: { canonical: "/changelog" },
};

const entries = [
  {
    version: "2.8",
    date: "September 30, 2026",
    title: "Smart waitlist & SMS reminders",
    tag: "New",
    body: "When a slot opens up, FlowDesk now offers it to waitlisted clients automatically. Pro and Business workspaces can also send SMS reminders 24 hours and 2 hours before each appointment.",
    items: [
      "Waitlist with automatic slot offers",
      "SMS reminders with two-way confirm",
      "Reminder delivery reports",
    ],
  },
  {
    version: "2.7",
    date: "September 9, 2026",
    title: "Drag-to-reschedule across staff",
    tag: "Improved",
    body: "The week view now supports dragging an appointment to a different day and time with snapping to 15-minute increments. Clients are notified of the change automatically.",
    items: ["15-minute snapping", "Conflict warnings", "Undo from the toast"],
  },
  {
    version: "2.6",
    date: "August 18, 2026",
    title: "Command palette",
    tag: "New",
    body: "Press ⌘K (or Ctrl K) anywhere in the dashboard to jump to a page, find a client or create a booking without touching the mouse.",
    items: ["Fuzzy search across clients", "Quick actions", "Keyboard shortcut hints"],
  },
  {
    version: "2.5",
    date: "July 29, 2026",
    title: "Client CSV export & bulk tagging",
    tag: "Improved",
    body: "Select any number of clients to tag, export or remove them in one go. Exports respect your current search and filters.",
    items: ["Bulk tag & delete", "Filter-aware CSV export", "Sticky table header"],
  },
  {
    version: "2.4",
    date: "July 2, 2026",
    title: "Revenue analytics",
    tag: "New",
    body: "A brand new overview with revenue trends, bookings by service, no-show rate and new client growth compared to the previous period.",
    items: ["Period-over-period trends", "Bookings by service", "No-show rate KPI"],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <PageHero
        eyebrow="Changelog"
        title="What's new in FlowDesk"
        description="We ship improvements every week. Here are the highlights."
      />
      <section className="pb-24">
        <ol className="mx-auto max-w-3xl px-4 sm:px-6">
          {entries.map((entry) => (
            <li
              key={entry.version}
              className="relative grid gap-4 border-l pb-14 pl-8 last:pb-0 md:grid-cols-[160px_1fr] md:border-l-0 md:pl-0"
            >
              <div className="md:border-r md:pr-6 md:text-right">
                <span className="absolute top-1.5 -left-[5px] size-2.5 rounded-full bg-primary ring-4 ring-background md:hidden" />
                <time className="text-sm text-muted-foreground">{entry.date}</time>
                <p className="mt-1 font-mono text-xs text-muted-foreground">v{entry.version}</p>
              </div>
              <article className="relative md:pl-6">
                <span className="absolute top-1.5 -left-[5px] hidden size-2.5 rounded-full bg-primary ring-4 ring-background md:block" />
                <Badge variant={entry.tag === "New" ? "default" : "secondary"}>{entry.tag}</Badge>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">{entry.title}</h2>
                <p className="mt-3 text-muted-foreground">{entry.body}</p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {entry.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
