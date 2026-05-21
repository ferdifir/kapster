import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/barber/", "/onboarding/"],
      },
      {
        userAgent: ["GPTBot", "Google-Extended", "CCBot", "Amazonbot"],
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/barber/", "/onboarding/"],
      },
    ],
    sitemap: "https://kapster.my.id/sitemap.xml",
  };
}
