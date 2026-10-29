import "server-only";
import { draftMode } from "next/headers";
import type { CMSAnnouncement, CMSQueryResult } from "./types";

/**
 * Headless CMS Client (Sanity / Contentful / Payload pattern)
 *
 * Demonstrates:
 * 1. Tagged caching with `next: { tags: [...] }` for instantaneous On-Demand Revalidation.
 * 2. Next.js Draft Mode detection (`draftMode().isEnabled`) to fetch unpublished drafts.
 * 3. Fallback to local CMS store when external headless CMS credentials are not configured.
 */

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const SANITY_API_VERSION = "2024-01-01";
const SANITY_READ_TOKEN = process.env.SANITY_API_READ_TOKEN;

export async function fetchCMSAnnouncements(): Promise<
  CMSQueryResult<CMSAnnouncement[]>
> {
  const { isEnabled: isDraft } = await draftMode();

  // If Sanity credentials are provided in production, perform live query
  if (SANITY_PROJECT_ID) {
    const query = encodeURIComponent(
      `*[_type == "announcement"] | order(publishedAt desc) {
        slug, title, summary, publishedAt, category, author, content
      }`,
    );

    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${query}`;

    try {
      const res = await fetch(url, {
        headers: {
          ...(isDraft && SANITY_READ_TOKEN
            ? { Authorization: `Bearer ${SANITY_READ_TOKEN}` }
            : {}),
        },
        // Tagged for on-demand revalidation via /api/revalidate
        next: {
          tags: ["cms-announcements"],
          revalidate: isDraft ? 0 : 3600, // Bypass cache in draft mode
        },
      });

      if (res.ok) {
        const json = await res.json();
        return {
          data: json.result ?? [],
          source: "sanity",
          isDraft,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch from Sanity CMS, falling back to local store:", err);
    }
  }

  // Fallback default announcements (MDX / Local storage)
  return {
    data: [
      {
        slug: "spring-extended-hours",
        title: "Extended Study Hours for Finals Week",
        summary: "The main library reading hall and research desks will remain open until midnight throughout the upcoming exam period.",
        publishedAt: "2026-10-20",
        category: "Hours",
        author: "Head Librarian",
        content: "We understand student and researcher needs during exam weeks. Quiet rooms 201-208 will be open with complimentary coffee stations.",
      },
      {
        slug: "new-digital-humanities-collection",
        title: "Digital Humanities & Archive Additions",
        summary: "Over 40 new rare manuscripts and historical treatises have been cataloged and made accessible in the special collections wing.",
        publishedAt: "2026-10-15",
        category: "Collection",
        author: "Archival Services",
        content: "Our archival department has completed restoration of 18th-century local historical records. Visit the digital terminal in the reference section.",
      },
      {
        slug: "borrowing-policy-reminder",
        title: "Standard Loan Periods and Renewals",
        summary: "Standard titles may be borrowed for 14 days, with up to one renewal allowed if no waitlist hold is active on the title.",
        publishedAt: "2026-10-01",
        category: "Policy",
        author: "Circulation Desk",
        content: "To ensure equal access to popular fiction and reference literature, please return or renew your titles before the due date stamped on your receipt.",
      },
    ],
    source: "mdx",
    isDraft,
  };
}
