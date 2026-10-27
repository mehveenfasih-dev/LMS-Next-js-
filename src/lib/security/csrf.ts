import "server-only";

/**
 * Same-origin CSRF check for cookie-authenticated Route Handlers.
 * Next.js Server Actions already compare Origin to Host; API writes need this
 * explicitly. This is CSRF protection, not authentication or authorization.
 */
export function assertSameOrigin(request: Request): Response | null {
  const expectedHost = getExpectedHost(request);
  if (!expectedHost) {
    return Response.json(
      { error: "Could not verify the request origin." },
      { status: 403 },
    );
  }

  const originHost = getOriginHost(request);
  if (!originHost) {
    return Response.json(
      { error: "Missing request origin." },
      { status: 403 },
    );
  }

  if (!hostsMatch(originHost, expectedHost)) {
    return Response.json(
      { error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  return null;
}

export function getExpectedHost(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim().toLowerCase();
    if (first) return stripDefaultPort(first);
  }

  const host = request.headers.get("host")?.trim().toLowerCase();
  return host ? stripDefaultPort(host) : null;
}

export function getOriginHost(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return stripDefaultPort(new URL(origin).host.toLowerCase());
    } catch {
      return null;
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return stripDefaultPort(new URL(referer).host.toLowerCase());
    } catch {
      return null;
    }
  }

  return null;
}

function hostsMatch(a: string, b: string): boolean {
  return a === b;
}

function stripDefaultPort(host: string): string {
  if (host.endsWith(":443") || host.endsWith(":80")) {
    return host.replace(/:(443|80)$/, "");
  }
  return host;
}
