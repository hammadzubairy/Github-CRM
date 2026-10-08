"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#09090b",
          color: "#fafafa",
        }}
      >
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>FlowDesk is temporarily unavailable</h1>
          <p style={{ color: "#a1a1aa" }}>Please try again in a moment.</p>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 8,
              border: 0,
              background: "#6366f1",
              color: "white",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
