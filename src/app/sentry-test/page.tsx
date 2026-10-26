"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  return (
    <button
      onClick={() => {
        Sentry.captureException(
          new Error("LMS test error from my application"),
        );
      }}
    >
      Send test error
    </button>
  );
}