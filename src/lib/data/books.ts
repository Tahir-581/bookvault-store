import type { HomepageSectionConfig, Tag } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePrice } from "@/lib/pricing";
import type { BookWithFormats, DealWithBook } from "@/lib/types";

export type BookFilters = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

const PAGE_SIZE = 24;

function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

async function getTagMap(): Promise<Map<string, string>> {
  const tags = await getTags();
  return new Map(tags.map((t) => [t.slug, t.name]));
}

function withTagLabels(
  book: BookWithFormats,
  tagMap: Map<string, string>
): BookWithFormats {
  return {
    ...book,
    tag_labels: (book.tags || []).map((slug) => tagMap.get(slug) || slug),
  };
}

export async function getTags(): Promise<Tag[]> {
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_tags")
    .select("id, name, slug, created_at")
    .order("name");
  return (data || []) as Tag[];
}

export async function getBooks(filters: BookFilters = {}) {
  if (!hasSupabase()) {
    return { books: [], total: 0, page: 1, pageSize: PAGE_SIZE };
  }
  const supabase = await createClient();
  const page = filters.page || 1;
  const limit = filters.limit || PAGE_SIZE;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let categoryBookIds: string[] | null = null;
  if (filters.category) {
    const category = await getCategoryBySlug(filters.category);
    if (!category) {
      return { books: [], total: 0, page, pageSize: limit };
    }
    const { data: links } = await supabase
      .from("store_book_categories")
      .select("book_id")
      .eq("category_id", category.id);
    categoryBookIds = [...new Set((links || []).map((l) => l.book_id))];
    if (categoryBookIds.length === 0) {
      return { books: [], total: 0, page, pageSize: limit };
    }
  }

  let query = supabase
    .from("store_books")
    .select("*, store_book_formats(*)", { count: "exact" })
    .eq("is_active", true);

  if (categoryBookIds) {
    query = query.in("id", categoryBookIds);
  }

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,author_name.ilike.%${filters.q}%`
    );
  }

  if (filters.minRating) {
    query = query.gte("avg_rating", filters.minRating);
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("avg_rating", { ascending: false });
      break;
    case "price_desc":
      query = query.order("avg_rating", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "bestseller":
      query = query.eq("is_bestseller", true).order("review_count", {
        ascending: false,
      });
      break;
    case "trending":
      query = query.eq("is_trending", true).order("review_count", {
        ascending: false,
      });
      break;
    case "rating":
      query = query.order("avg_rating", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", {
        ascending: false,
      });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const tagMap = await getTagMap();
  let books = (data || []).map((book) =>
    withTagLabels(
      {
        ...book,
        formats: book.store_book_formats?.filter((f) => f.is_active) || [],
      } as BookWithFormats,
      tagMap
    )
  );

  if (filters.minPrice || filters.maxPrice) {
    books = books.filter((b) => {
      const prices = b.formats.map((f) => getEffectivePrice(f).displayPrice);
      const min = prices.length ? Math.min(...prices) : 0;
      if (filters.minPrice && min < filters.minPrice) return false;
      if (filters.maxPrice && min > filters.maxPrice) return false;
      return true;
    });
  }

  return { books, total: count || 0, page, pageSize: limit };
}

export async function getBookBySlug(slug: string) {
  if (!hasSupabase()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_books")
    .select(
      "*, store_book_formats(*), store_book_images(*), store_book_categories(category_id, store_categories(id, name, slug))"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const tagMap = await getTagMap();
  return withTagLabels(
    {
      ...data,
      formats: data.store_book_formats?.filter((f) => f.is_active) || [],
      images: data.store_book_images || [],
      categories:
        data.store_book_categories?.map(
          (bc: { store_categories: { id: string; name: string; slug: string } }) =>
            bc.store_categories
        ) || [],
    } as BookWithFormats & {
      images?: { url: string; alt: string | null }[];
      categories?: { id: string; name: string; slug: string }[];
    },
    tagMap
  );
}

export async function getFeaturedBooks(limit = 12) {
  const { books } = await getBooks({ sort: "bestseller", limit });
  return books.slice(0, limit);
}

export async function getNewReleases(limit = 12) {
  const { books } = await getBooks({ sort: "newest", limit });
  return books.slice(0, limit);
}

export async function getDeals() {
  return getActiveDealsWithBooks(48);
}

export async function getRelatedBooks(bookId: string, categoryIds: string[], limit = 6) {
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  if (categoryIds.length === 0) {
    const { books } = await getBooks({ limit });
    return books.filter((b) => b.id !== bookId).slice(0, limit);
  }

  const { data } = await supabase
    .from("store_book_categories")
    .select("book_id")
    .in("category_id", categoryIds)
    .neq("book_id", bookId)
    .limit(limit);

  const ids = [...new Set((data || []).map((d) => d.book_id))].slice(0, limit);
  if (ids.length === 0) return [];

  return getBooksByIds(ids);
}

export async function getBookReviews(bookId: string) {
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_reviews")
    .select("*")
    .eq("book_id", bookId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getCategories() {
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}

export async function getCategoryBySlug(slug: string) {
  if (!hasSupabase()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

function mapBookRow(
  book: Record<string, unknown>,
  tagMap: Map<string, string>
): BookWithFormats {
  return withTagLabels(
    {
      ...book,
      formats: ((book.store_book_formats as BookWithFormats["formats"]) || []).filter(
        (f) => f.is_active
      ),
    } as BookWithFormats,
    tagMap
  );
}

export async function getBooksByIds(ids: string[]) {
  if (!hasSupabase() || ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_books")
    .select("*, store_book_formats(*)")
    .in("id", ids)
    .eq("is_active", true);
  const tagMap = await getTagMap();
  const books = (data || []).map((b) => mapBookRow(b as Record<string, unknown>, tagMap));
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  return books.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
}

export async function getBooksByCategory(slug: string, limit = 12) {
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  const category = await getCategoryBySlug(slug);
  if (!category) return [];

  const { data: links } = await supabase
    .from("store_book_categories")
    .select("book_id")
    .eq("category_id", category.id)
    .limit(limit * 2);

  const ids = (links || []).map((l) => l.book_id);
  if (ids.length === 0) return [];

  const books = await getBooksByIds(ids.slice(0, limit * 2));
  return books.slice(0, limit);
}

/** Active per-format sales (on_sale + percent within optional date window). */
export async function getActiveDealsWithBooks(limit = 12): Promise<DealWithBook[]> {
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_book_formats")
    .select("*, store_books(*, store_book_formats(*))")
    .eq("on_sale", true)
    .eq("is_active", true)
    .not("sale_percent", "is", null)
    .limit(limit * 3);

  const tagMap = await getTagMap();
  const now = new Date();
  const deals: DealWithBook[] = [];

  for (const row of data || []) {
    const effective = getEffectivePrice(row, now);
    if (!effective.onSale) continue;

    const rawBook = row.store_books as Record<string, unknown> | null;
    if (!rawBook || rawBook.is_active === false) continue;

    const book = mapBookRow(rawBook, tagMap);
    deals.push({
      id: row.id,
      book_id: row.book_id,
      format_id: row.id,
      deal_price: effective.displayPrice,
      starts_at: row.sale_starts_at || now.toISOString(),
      ends_at: row.sale_ends_at || "",
      is_active: true,
      book,
    });

    if (deals.length >= limit) break;
  }

  return deals;
}

export async function resolveSectionBooks(config: HomepageSectionConfig) {
  const limit = config.limit ?? 12;

  if (config.book_ids?.length) {
    const books = await getBooksByIds(config.book_ids);
    return books.slice(0, limit);
  }

  if (config.filter === "deals" || config.source === "deals") {
    const deals = await getActiveDealsWithBooks(limit);
    return deals.map((d) => d.book);
  }

  if (config.category) {
    return getBooksByCategory(config.category, limit);
  }

  let sort: string | undefined;
  switch (config.filter) {
    case "bestseller":
      sort = "bestseller";
      break;
    case "trending":
      sort = "trending";
      break;
    case "new_release":
      sort = "newest";
      break;
    case "featured":
      sort = undefined;
      break;
    default:
      sort = "bestseller";
  }

  const { books } = await getBooks({ sort, limit: limit * 2 });
  let filtered = books;

  if (config.filter === "new_release") {
    filtered = books.filter((b) => b.is_new_release);
    if (filtered.length < limit) {
      filtered = books;
    }
  } else if (config.filter === "featured") {
    filtered = books.filter((b) => b.is_featured);
    if (filtered.length < limit) {
      filtered = books;
    }
  } else if (config.filter === "trending") {
    filtered = books.filter((b) => b.is_trending);
    if (filtered.length < limit) {
      filtered = books;
    }
  }

  return filtered.slice(0, limit);
}

export async function resolveSectionDeals(config: HomepageSectionConfig) {
  const limit = config.limit ?? 12;
  return getActiveDealsWithBooks(limit);
}
