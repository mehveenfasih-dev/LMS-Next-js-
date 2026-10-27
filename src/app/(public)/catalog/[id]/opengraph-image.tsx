import { ImageResponse } from "next/og";
import { getServerBook } from "@/features/library/server-data";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookOpenGraphImage({ params }: OgImageProps) {
  const { id } = await params;
  const book = await getServerBook(id);

  const title = book?.title ?? "Book Details";
  const author = book?.author ? `By ${book.author}` : "Book Hub Catalog";
  const category = book?.category ?? "Library";
  const pages = book?.pages ? `${book.pages} pages` : undefined;
  const year = book?.year ? `Published ${book.year}` : undefined;

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
          background: "linear-gradient(135deg, #0b1329 0%, #172554 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              B
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#93c5fd" }}>
              Book Hub · Catalog
            </span>
          </div>

          <div
            style={{
              padding: "6px 16px",
              borderRadius: 9999,
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              fontSize: 18,
              color: "#38bdf8",
              fontWeight: 600,
            }}
          >
            {category}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -1,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#cbd5e1", fontWeight: 500 }}>
            {author}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            paddingTop: 24,
            fontSize: 20,
            color: "#94a3b8",
          }}
        >
          {pages && <span>{pages}</span>}
          {pages && year && <span>•</span>}
          {year && <span>{year}</span>}
          <span>•</span>
          <span style={{ color: "#38bdf8" }}>Available on Book Hub</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
