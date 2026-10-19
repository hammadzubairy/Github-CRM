import { getSiteUrl } from "@/lib/env";

export const siteConfig = {
  name: "FlowDesk",
  tagline: "Scheduling that runs itself",
  description:
    "FlowDesk is the appointment booking and client management platform for salons, clinics and consultants. Online booking, calendar, clients, payments and reporting in one fast workspace.",
  url: getSiteUrl(),
  author: {
    name: "Saad Abdullah",
    url: "https://github.com/saadxhammad",
  },
  links: {
    github: "https://github.com/saadxhammad/Github-CRM",
  },
  demoBookingSlug: "torix-glow",
} as const;

export const marketingNav = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "Changelog", href: "/changelog" },
  { title: "Blog", href: "/blog" },
] as const;
