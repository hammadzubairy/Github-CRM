import { ogSize, renderOgImage } from "@/lib/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} - ${siteConfig.tagline}`;
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgImage({
    eyebrow: "Appointment booking for small businesses",
    title: "Scheduling that runs itself.",
    subtitle:
      "Online booking, calendar, clients and payments in one fast workspace for salons, clinics and consultants.",
  });
}
