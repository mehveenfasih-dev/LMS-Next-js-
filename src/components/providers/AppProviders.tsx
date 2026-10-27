"use client";

import { Suspense } from "react";
import { WebVitalsReporter } from "@/components/performance/WebVitalsReporter";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { StateProviders } from "./StateProviders";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<div className="app-startup" aria-label="Starting Book Hub" />}
    >
      <WebVitalsReporter />
      <AnalyticsProvider>
        <StateProviders>{children}</StateProviders>
      </AnalyticsProvider>
    </Suspense>
  );
}
