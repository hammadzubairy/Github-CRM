import type { MetadataRoute } from "next";
import { posts } from "@/content/blog";
import { demoBookingPages } from "@/lib/demo/seed";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const latestPost = posts.reduce((latest, p) => (p.date > latest ? p.date : latest), "2026-01-01");

  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: latestPost, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/features`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/changelog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/blog`, lastModified: latestPost, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/signup`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...pages,
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...demoBookingPages.map((p) => ({
      url: `${base}/book/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
