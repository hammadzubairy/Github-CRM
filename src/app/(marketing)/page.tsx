import { JsonLd } from "@/components/json-ld";
import { Faq, faqs } from "@/features/marketing/components/faq";
import { FeaturesSection, SectionHeading } from "@/features/marketing/components/features-section";
import { FinalCta } from "@/features/marketing/components/final-cta";
import { Hero } from "@/features/marketing/components/hero";
import { HowItWorks } from "@/features/marketing/components/how-it-works";
import { LogoCloud } from "@/features/marketing/components/logo-cloud";
import { PricingCards } from "@/features/marketing/components/pricing-section";
import { ProductPreview } from "@/features/marketing/components/product-preview";
import { Testimonials } from "@/features/marketing/components/testimonials";
import { plans } from "@/lib/plans";
import { siteConfig } from "@/lib/site";

const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: siteConfig.url,
  offers: plans.map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.monthly.toFixed(2),
    priceCurrency: "USD",
    category: "subscription",
  })),
  creator: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.author.url },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/icon.svg`,
  sameAs: [siteConfig.links.github],
};

const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function LandingPage() {
  return (
    <>
      <JsonLd data={softwareApplication} />
      <JsonLd data={organization} />
      <JsonLd data={faqPage} />
      <Hero />
      <LogoCloud />
      <div className="cv-auto">
        <FeaturesSection />
      </div>
      <div className="cv-auto">
        <HowItWorks />
      </div>
      <div className="cv-auto">
        <ProductPreview />
      </div>
      <div className="cv-auto">
        <Testimonials />
      </div>
      <section id="pricing" aria-labelledby="pricing-heading" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="pricing-heading"
            eyebrow="Pricing"
            title="Simple pricing that grows with you"
            description="Start free. Upgrade when your calendar fills up. Cancel any time."
          />
          <div className="mt-10">
            <PricingCards />
          </div>
        </div>
      </section>
      <Faq />
      <div className="cv-auto">
        <FinalCta />
      </div>
    </>
  );
}
