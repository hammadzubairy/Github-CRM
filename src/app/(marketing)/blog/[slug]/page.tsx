import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { formatPostDate, getPost, posts } from "@/content/blog";
import { FinalCta } from "@/features/marketing/components/final-cta";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { default: Content } = await post.load();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { "@type": "Person", name: post.author, url: siteConfig.author.url },
          publisher: { "@type": "Organization", name: siteConfig.name },
          mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
        }}
      />
      <article className="mx-auto max-w-2xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> All posts
        </Link>
        <p className="mt-8 text-sm font-medium text-primary">{post.category}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{post.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
        <div className="mt-6 flex items-center gap-3 border-b pb-8">
          <span className="bg-brand-gradient grid size-9 place-items-center rounded-full text-xs font-semibold text-white">
            AK
          </span>
          <div className="text-sm">
            <p className="font-medium">{post.author}</p>
            <p className="text-muted-foreground">
              {formatPostDate(post.date)} · {post.readingTime}
            </p>
          </div>
        </div>
        <div className="prose-flow mt-8">
          <Content />
        </div>
      </article>
      <FinalCta />
    </>
  );
}
