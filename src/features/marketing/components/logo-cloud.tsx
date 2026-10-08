import {
  FeatherIcon,
  FlowerIcon,
  GemIcon,
  HeartPulseIcon,
  LeafIcon,
  MoonStarIcon,
  ScissorsIcon,
  SunIcon,
} from "lucide-react";

const brands = [
  { name: "Atelier Nord", icon: ScissorsIcon, font: "font-serif italic" },
  { name: "PULSE CLINIC", icon: HeartPulseIcon, font: "tracking-[0.2em] text-[13px]" },
  { name: "verdant", icon: LeafIcon, font: "lowercase" },
  { name: "Maison Lune", icon: MoonStarIcon, font: "font-serif" },
  { name: "Solace Spa", icon: SunIcon, font: "" },
  { name: "BLOOM & CO", icon: FlowerIcon, font: "tracking-widest text-[13px]" },
  { name: "Gemma Skin", icon: GemIcon, font: "font-medium" },
  { name: "featherlight", icon: FeatherIcon, font: "lowercase italic" },
];

export function LogoCloud() {
  return (
    <section aria-labelledby="logos-heading" className="border-y bg-muted/20 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="logos-heading" className="text-center text-sm text-muted-foreground">
          Trusted by 4,000+ studios, clinics and independent professionals
        </h2>
        <div className="mask-fade-x relative mt-7 overflow-hidden">
          <ul className="flex w-max animate-marquee gap-14 hover:[animation-play-state:paused]">
            {[...brands, ...brands].map((brand, i) => (
              <li
                key={`${brand.name}-${i}`}
                aria-hidden={i >= brands.length ? true : undefined}
                className="flex shrink-0 items-center gap-2 text-lg font-semibold text-muted-foreground grayscale transition hover:text-foreground"
              >
                <brand.icon className="size-5" />
                <span className={brand.font}>{brand.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
