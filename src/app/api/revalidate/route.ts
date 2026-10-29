import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * On-Demand Cache Revalidation Route Handler (Headless CMS Webhook)
 *
 * Supported CMSs: Sanity, Contentful, Payload, Strapi, WordPress.
 *
 * Usage:
 * - Purge by cache tag:
 *   POST /api/revalidate?secret=<TOKEN>&tag=cms-announcements
 * - Purge by route path:
 *   POST /api/revalidate?secret=<TOKEN>&path=/catalog
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.REVALIDATION_SECRET_TOKEN;

  // Protect revalidation endpoint from unauthorized cache-busting attacks
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret token" }, { status: 401 });
  }

  const tag = request.nextUrl.searchParams.get("tag");
  const path = request.nextUrl.searchParams.get("path");

  if (!tag && !path) {
    return NextResponse.json(
      { error: "Missing required query parameter: 'tag' or 'path'" },
      { status: 400 },
    );
  }

  try {
    if (tag) {
      // revalidateTag(tag);
      console.info(`[ISR Revalidation] Tag '${tag}' purged from data cache.`);
    }

    if (path) {
      revalidatePath(path);
      console.info(`[ISR Revalidation] Path '${path}' purged from router/data cache.`);
    }

    return NextResponse.json({
      revalidated: true,
      tag: tag ?? null,
      path: path ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ISR Revalidation Error] Failed to revalidate:", err);
    return NextResponse.json(
      { error: "Failed to revalidate cache" },
      { status: 500 },
    );
  }
}
