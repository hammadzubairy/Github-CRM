import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const ogSize = { width: 1200, height: 630 };

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#g)" />
      <path d="M10 11.5h12M10 16h8M10 20.5h5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22" cy="20.5" r="2.4" fill="white" />
    </svg>
  );
}

/** Shared Open Graph card used by the marketing site, blog posts and booking pages. */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const host = siteConfig.url.replace(/^https?:\/\//, "");
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: "#09090b",
        backgroundImage:
          "radial-gradient(circle at 85% 0%, rgba(124,58,237,0.45), transparent 55%), radial-gradient(circle at 0% 100%, rgba(79,70,229,0.35), transparent 50%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 100% 100%, 48px 48px, 48px 48px",
        color: "#fafafa",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={56} />
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>{siteConfig.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "8px 18px",
            borderRadius: 999,
            border: "1px solid rgba(165,180,252,0.35)",
            backgroundColor: "rgba(99,102,241,0.15)",
            color: "#c7d2fe",
            fontSize: 24,
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontSize: title.length > 48 ? 58 : 70,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          {title}
        </span>
        {subtitle ? (
          <span style={{ fontSize: 28, color: "#a1a1aa", lineHeight: 1.4, maxWidth: 940 }}>{subtitle}</span>
        ) : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#71717a" }}>
        <span>{host}</span>
        <span>Booking · Calendar · Clients · Billing</span>
      </div>
    </div>,
    ogSize,
  );
}
