import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  let books: { slug: string; updated_at: string }[] = [];

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("store_books")
      .select("slug, updated_at")
      .eq("is_active", true);
    books = data || [];
  }

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/books`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/deals`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.7 },
    ...(books || []).map((book) => ({
      url: `${base}/dp/${book.slug}`,
      lastModified: book.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
