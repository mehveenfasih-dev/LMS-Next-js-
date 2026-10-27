import "server-only";
import { assertSameOrigin } from "./csrf";
import { getClientIpFromHeaders } from "./client-ip";
import { rateLimit, rateLimitExceededResponse } from "./rate-limit";

const DEFAULT_API_LIMIT = 60;
const DEFAULT_API_WINDOW_MS = 60_000;

/**
 * CSRF + rate-limit gate for cookie-authenticated mutating Route Handlers.
 * Call before reading the body. Prefer passing userId after auth when available
 * by calling rateLimit again with a user-scoped key for sensitive operations.
 */
export async function guardMutatingRequest(
  request: Request,
  bucket: string,
  options?: {
    limit?: number;
    windowMs?: number;
    identity?: string;
  },
): Promise<Response | null> {
  const csrfFailure = assertSameOrigin(request);
  if (csrfFailure) return csrfFailure;

  const identity =
    options?.identity ?? getClientIpFromHeaders(request.headers);
  const limited = await rateLimit(
    `${bucket}:${identity}`,
    options?.limit ?? DEFAULT_API_LIMIT,
    options?.windowMs ?? DEFAULT_API_WINDOW_MS,
  );
  if (!limited.ok) {
    return rateLimitExceededResponse(limited.retryAfterSec);
  }

  return null;
}
