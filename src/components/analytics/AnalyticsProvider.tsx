"use client";

import { useEffect, Suspense, type PropsWithChildren } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import posthog from "posthog-js";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

/**
 * Capture client-side page views in PostHog on Next.js App Router navigations.
 */
function PostHogPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    let url = window.origin + pathname;
    const query = searchParams?.toString();
    if (query) {
      url += `?${query}`;
    }

    posthog.capture("$pageview", {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if (!POSTHOG_KEY || typeof window === "undefined") return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // We track manually above on App Router navigation
      capture_pageleave: true,
      autocapture: false, // Privacy-first: only capture explicit events
    });
  }, []);

  return (
    <>
      {children}
      {/* Vercel Web Analytics */}
      <VercelAnalytics />

      {/* Google Analytics 4 via official @next/third-parties */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}

      {/* PostHog Router Tracker inside Suspense boundary for useSearchParams */}
      {POSTHOG_KEY && (
        <Suspense fallback={null}>
          <PostHogPageViewTracker />
        </Suspense>
      )}
    </>
  );
}

/**
 * Convenience helper to track custom domain events across active analytics providers
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  // Track in PostHog if configured
  if (POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  }

  // Track in Google Analytics (gtag) if configured
  if (GA_ID && typeof window.gtag === "function") {
    window.gtag("event", eventName, properties);
  }
}

/**
 * Associate authenticated user identity with analytics sessions
 */
export function identifyAnalyticsUser(
  userId: string,
  traits?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  if (POSTHOG_KEY) {
    posthog.identify(userId, traits);
  }

  if (GA_ID && typeof window.gtag === "function") {
    window.gtag("set", "user_properties", {
      user_id: userId,
      ...traits,
    });
  }
}

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "set",
      actionOrId: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}
