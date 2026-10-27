import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalog"],
        disallow: [
          "/api/",
          "/dashboard",
          "/books",
          "/requests",
          "/users",
          "/reports",
          "/settings",
          "/my-requests",
          "/profile",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
