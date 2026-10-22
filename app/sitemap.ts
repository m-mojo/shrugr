import type { MetadataRoute } from "next";
import { films } from "../lib/catalog";
import { editorialCollections } from "../lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://shrugr.ro.to";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/collections`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...editorialCollections.map(({ slug }) => ({
      url: `${baseUrl}/collections/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...films.map(({ slug }) => ({
      url: `${baseUrl}/films/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
