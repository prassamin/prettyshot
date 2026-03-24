import type { MetadataRoute } from "next";
import { getOrigin } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getOrigin();

  return [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
