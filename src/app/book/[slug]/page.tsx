import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { Toaster } from "@/components/ui/sonner";
import { BookingFlow } from "@/features/booking/components/booking-flow";
import { demoBookingPages } from "@/lib/demo/seed";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return demoBookingPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/book/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const demo = demoBookingPages.find((p) => p.slug === slug);
  const title = demo ? `Book with ${demo.name}` : "Book an appointment";
  return {
    title: { absolute: `${title} · FlowDesk` },
    description: demo?.description ?? "Pick a service, a time that suits you and confirm in seconds.",
    alternates: { canonical: `/book/${slug}` },
    openGraph: { title, url: `/book/${slug}` },
  };
}

async function BookingRoute({ params }: { params: PageProps<"/book/[slug]">["params"] }) {
  const { slug } = await params;
  const demo = demoBookingPages.find((p) => p.slug === slug);
  return (
    <>
      {demo ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": demo.industry === "clinic" ? "MedicalBusiness" : "LocalBusiness",
            name: demo.name,
            description: demo.description,
            address: demo.address,
            telephone: demo.phone,
            email: demo.email,
            url: `${siteConfig.url}/book/${demo.slug}`,
          }}
        />
      ) : null}
      <BookingFlow slug={slug} preview={demo ? { name: demo.name, address: demo.address } : undefined} />
      <Toaster />
    </>
  );
}

export default function BookPage({ params }: PageProps<"/book/[slug]">) {
  return (
    <Suspense>
      <BookingRoute params={params} />
    </Suspense>
  );
}
