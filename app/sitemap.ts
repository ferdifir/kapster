import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://kapster.my.id";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: barbershops, error } = await supabase
    .from("barbershops")
    .select("slug, settings_json")
    .eq("is_active", true);

  if (error) {
    console.error("[sitemap] Failed to fetch barbershops:", error.message);
  }

  const barbershopEntries: MetadataRoute.Sitemap = [];

  if (barbershops) {
    for (const bs of barbershops) {
      const settings = bs.settings_json as Record<string, unknown> | null;
      if (settings?.show_in_directory === false) continue;

      const slug = bs.slug;
      barbershopEntries.push(
        {
          url: `${siteUrl}/q/${slug}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.7,
        },
        {
          url: `${siteUrl}/booking/${slug}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.7,
        },
      );
    }
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/map`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...barbershopEntries,
  ];
}
