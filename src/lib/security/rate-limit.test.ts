import { afterEach, describe, expect, it } from "vitest";
import { rateLimit, resetMemoryRateLimitForTests } from "./rate-limit";

afterEach(() => {
  resetMemoryRateLimitForTests();
});

describe("rateLimit memory store", () => {
  it("allows requests under the limit", async () => {
    const first = await rateLimit("test:a", 2, 60_000);
    const second = await rateLimit("test:a", 2, 60_000);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });

  it("blocks once the window is full", async () => {
    await rateLimit("test:b", 2, 60_000);
    await rateLimit("test:b", 2, 60_000);
    const blocked = await rateLimit("test:b", 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates keys", async () => {
    await rateLimit("test:c", 1, 60_000);
    const other = await rateLimit("test:d", 1, 60_000);
    expect(other.ok).toBe(true);
  });
});
