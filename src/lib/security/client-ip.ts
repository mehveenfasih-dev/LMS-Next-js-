import "server-only";
import { headers } from "next/headers";

/**
 * Derive a rate-limit key IP from proxy headers.
 * Only trust these when your reverse proxy overwrites client-controlled values.
 */
export function getClientIpFromHeaders(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export async function getRequestClientIp(): Promise<string> {
  return getClientIpFromHeaders(await headers());
}
