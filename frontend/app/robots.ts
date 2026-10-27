import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://upmatch.tcmg.me";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about"],
        disallow: [
          "/swipe",
          "/swipe/",
          "/likes",
          "/likes/",
          "/matches",
          "/matches/",
          "/chat",
          "/chat/",
          "/profile",
          "/profile/",
          "/onboarding",
          "/onboarding/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
