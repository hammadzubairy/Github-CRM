import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { formatPostDate, posts } from "@/content/blog";
import { PageHero } from "@/features/marketing/components/page-hero";

export const metadata: Metadata = {
  title: "Blog",
  description: "Playbooks, growth ideas and product thinking for salons, clinics and service businesses.",
  alternates: { canonical: "/blog" },
};

const gradients = [
  "from-indigo-500 via-violet-500 to-fuchsia-500",
  "from-sky-500 via-indigo-500 to-violet-500",
  "from-amber-400 via-rose-500 to-violet-600",
];

export default function BlogPage() {
  const [featured, ...rest] = posts;
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Ideas for fuller calendars"
        description="Practical playbooks for running and growing a service business."
      />
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href={`/blog/${featured.slug}`}
            className="group grid overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg md:grid-cols-2"
          >
            <div className={`relative min-h-56 bg-gradient-to-br ${gradients[0]}`}>
              <div className="bg-grid absolute inset-0 [background-size:32px_32px] opacity-20" />
            </div>
            <div className="flex flex-col justify-center p-8">
              <p className="text-xs font-medium text-primary">{featured.category}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance group-hover:underline group-hover:underline-offset-4">
                {featured.title}
              </h2>
              <p className="mt-3 text-muted-foreground">{featured.description}</p>
              <p className="mt-5 text-sm text-muted-foreground">
                {formatPostDate(featured.date)} · {featured.readingTime}
              </p>
            </div>
          </Link>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rest.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"
              >
                <div className={`h-36 bg-gradient-to-br ${gradients[(i + 1) % gradients.length]}`} />
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-medium text-primary">{post.category}</p>
                  <h2 className="mt-2 text-lg font-semibold tracking-tight">{post.title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{post.description}</p>
                  <p className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    {formatPostDate(post.date)} · {post.readingTime}
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
