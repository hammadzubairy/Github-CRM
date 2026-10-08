import type { MDXContent } from "mdx/types";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  role: string;
  readingTime: string;
  category: string;
  load: () => Promise<{ default: MDXContent }>;
}

export const posts: BlogPost[] = [
  {
    slug: "cut-no-shows-in-half",
    title: "How to cut no-shows in half without annoying your clients",
    description:
      "No-shows quietly cost small businesses thousands each year. Here is the reminder cadence and policy that works for the studios on FlowDesk.",
    date: "2026-09-22",
    author: "Ahmad Khajeh",
    role: "Product",
    readingTime: "6 min read",
    category: "Playbooks",
    load: () => import("./cut-no-shows-in-half.mdx"),
  },
  {
    slug: "booking-page-that-converts",
    title: "Anatomy of a booking page that converts",
    description:
      "We analysed thousands of booking sessions. These seven details separate pages that fill calendars from pages that leak clients.",
    date: "2026-08-30",
    author: "Ahmad Khajeh",
    role: "Product",
    readingTime: "5 min read",
    category: "Growth",
    load: () => import("./booking-page-that-converts.mdx"),
  },
  {
    slug: "metrics-every-salon-should-track",
    title: "The five metrics every salon owner should check weekly",
    description:
      "Revenue is only the start. Utilisation, rebooking rate and client lifetime value tell you where your next dollar is coming from.",
    date: "2026-08-04",
    author: "Ahmad Khajeh",
    role: "Product",
    readingTime: "7 min read",
    category: "Analytics",
    load: () => import("./metrics-every-salon-should-track.mdx"),
  },
];

export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
