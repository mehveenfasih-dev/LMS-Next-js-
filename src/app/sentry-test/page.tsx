"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  return (
    <main style={{ padding: 30 }}>
      <h1>Sentry Test</h1>

      <button
        onClick={() =>
          Sentry.captureException(
            new Error("LMS test error from my application"),
          )
        }
      >
        Send test error to Sentry
      </button>
    </main>
  );
}