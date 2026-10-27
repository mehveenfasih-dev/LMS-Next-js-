"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import type { Metric } from "web-vitals";

/**
 * Field measurement for Core Web Vitals (LCP, CLS, INP).
 * See docs/core-web-vitals.md for thresholds and lab tooling.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    let cancelled = false;

    async function startReporting() {
      const { onCLS, onINP, onLCP } = await import("web-vitals");
      if (cancelled) return;

      const report = (metric: Metric) => {
        if (process.env.NODE_ENV === "development") {
          console.info(`[CWV] ${metric.name}=${metric.value.toFixed(2)} (${metric.rating})`);
        }

        if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
          Sentry.addBreadcrumb({
            category: "web-vital",
            message: metric.name,
            level: "info",
            data: {
              value: metric.value,
              rating: metric.rating,
              id: metric.id,
              navigationType: metric.navigationType,
            },
          });
          const unit = metric.name === "CLS" ? "none" : "millisecond";
          Sentry.setMeasurement(metric.name, metric.value, unit);
        }
      };

      onLCP(report);
      onCLS(report);
      onINP(report);
    }

    void startReporting();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
