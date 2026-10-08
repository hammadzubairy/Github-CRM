import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #6366f1, #a855f7)",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
        <path d="M10 11.5h12M10 16h8M10 20.5h5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="22" cy="20.5" r="2.4" fill="white" />
      </svg>
    </div>,
    size,
  );
}
