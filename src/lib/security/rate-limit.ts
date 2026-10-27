import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  ok: boolean;
  retryAfterSec: number;
};

type WindowEntry = {
  timestamps: number[];
};

const memoryBuckets = new Map<string, WindowEntry>();
const upstashLimiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${limit}:${windowMs}`;
  const existing = upstashLimiters.get(cacheKey);
  if (existing) return existing;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: "book-hub:rl",
    analytics: false,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

/**
 * Sliding-window rate limit. Uses Upstash when configured; otherwise an
 * in-process store suitable for a single Node instance (not multi-replica).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const upstash = getUpstashLimiter(limit, windowMs);
  if (upstash) {
    const result = await upstash.limit(key);
    const retryAfterSec = result.success
      ? 0
      : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return { ok: result.success, retryAfterSec };
  }

  return rateLimitMemory(key, limit, windowMs);
}

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${key}:${limit}:${windowMs}`;
  const entry = memoryBuckets.get(bucketKey) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    memoryBuckets.set(bucketKey, entry);
    return { ok: false, retryAfterSec };
  }

  entry.timestamps.push(now);
  memoryBuckets.set(bucketKey, entry);
  return { ok: true, retryAfterSec: 0 };
}

/** Test helper: clear in-memory buckets between unit tests. */
export function resetMemoryRateLimitForTests(): void {
  memoryBuckets.clear();
  upstashLimiters.clear();
}

export function rateLimitExceededResponse(retryAfterSec: number): Response {
  return Response.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}
