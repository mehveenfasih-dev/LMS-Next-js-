import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Extra Server Action hosts only when a reverse proxy reports a different Host
 * than the browser Origin. Use exact hosts (no wildcards). Empty = same-origin.
 * This Origin check is CSRF protection for Server Actions, not authorization.
 */
const serverActionAllowedOrigins = (
  process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
      allowedOrigins: serverActionAllowedOrigins,
    },
  },
};

export default withSentryConfig(withAnalyzer(nextConfig), { silent: true });
