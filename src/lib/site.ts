import { getSiteUrl } from "@/lib/env";

export const siteConfig = {
  name: "FlowDesk",
  tagline: "Scheduling that runs itself",
  description:
    "FlowDesk is the appointment booking and client management platform for salons, clinics and consultants. Online booking, calendar, clients, payments and reporting in one fast workspace.",
  url: getSiteUrl(),
  author: {
    name: "Ahmad Khajeh",
    url: "https://ahmadkhajeh.com",
  },
  links: {
    github: "https://github.com/REALAVAT/flowdesk-saas",
  },
  demoBookingSlug: "lumiere-studio",
} as const;

export const marketingNav = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "Changelog", href: "/changelog" },
  { title: "Blog", href: "/blog" },
] as const;
