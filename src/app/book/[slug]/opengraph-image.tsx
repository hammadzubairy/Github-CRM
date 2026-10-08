import { demoBookingPages } from "@/lib/demo/seed";
import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "Book an appointment online";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return demoBookingPages.map((p) => ({ slug: p.slug }));
}

export default async function BookingOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = demoBookingPages.find((p) => p.slug === slug);
  return renderOgImage({
    eyebrow: "Book online in under a minute",
    title: page ? `Book with ${page.name}` : "Book an appointment",
    subtitle: page?.description ?? "Pick a service and a time that suits you.",
  });
}
