import { NextResponse, type NextRequest } from "next/server";

/**
 * Health & Edge Headers Demonstration Endpoint:
 * - Next.js 16 deprecates the Edge Runtime in favor of the Node.js runtime with cache components.
 * - This endpoint inspects edge-injected geolocation headers (x-vercel-ip-country, x-forwarded-for)
 *   while running securely under the standard Node.js runtime.
 */
export async function GET(request: NextRequest) {
  const geoCountry = request.headers.get("x-vercel-ip-country") ?? "Unknown";
  const geoCity = request.headers.get("x-vercel-ip-city") ?? "Unknown";
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  return NextResponse.json(
    {
      status: "healthy",
      runtime: "nodejs",
      timestamp: new Date().toISOString(),
      edgeLocation: {
        country: geoCountry,
        city: geoCity,
      },
      clientIp,
      features: {
        runtimeNotice: "Edge Runtime is deprecated in Next.js 16 in favor of Node.js runtime and cache components",
        databaseAccess: "Full TCP socket support with Prisma & SQL Server",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
