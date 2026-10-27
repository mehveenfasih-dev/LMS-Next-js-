import { ImageResponse } from "next/og";

export const alt = "Book Hub - Modern Library Management";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            B
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>
            Book Hub
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -1,
              maxWidth: 900,
            }}
          >
            Discover books, borrow titles &amp; manage your library collection
          </div>
          <div style={{ fontSize: 24, color: "#94a3b8" }}>
            Production-grade library management built with Next.js, Auth.js &amp; Prisma
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #334155",
            paddingTop: 24,
            fontSize: 20,
            color: "#64748b",
          }}
        >
          <span>Next.js App Router</span>
          <span>Open Source Catalog</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
