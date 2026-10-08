import { getPost, posts } from "@/content/blog";
import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "FlowDesk blog post";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return renderOgImage({
    eyebrow: post ? `Blog · ${post.category}` : "Blog",
    title: post?.title ?? "FlowDesk blog",
    subtitle: post?.description,
  });
}
