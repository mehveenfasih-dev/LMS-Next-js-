"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          background: "#f7f8f4",
          color: "#20332a",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <main style={{ maxWidth: 520, padding: 32 }}>
          <h1>Book Hub is unavailable</h1>
          <p>We hit an unexpected problem while starting the application.</p>
          <button onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
