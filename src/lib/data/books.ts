import type { HomepageSectionConfig } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import type { BookWithFormats, DealWithBook } from "@/lib/types";

export type BookFilters = {
  q?: string;
  category?: string;
  format?: string;
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

export async function getBooks(filters: BookFilters = {}) {
  if (!hasSupabase()) {
    return { books: [], total: 0, page: 1, pageSize: PAGE_SIZE };
  }
  const supabase = await createClient();
  const page = filters.page || 1;
  const limit = filters.limit || PAGE_SIZE;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("store_books")
    .select("*, store_book_formats(*)", { count: "exact" })
    .eq("is_active", true);

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

  let books = (data || []).map((book) => ({
    ...book,
    formats: book.store_book_formats?.filter((f) => f.is_active) || [],
  })) as BookWithFormats[];

  if (filters.format) {
    books = books.filter((b) => {
      if (filters.format === "print") {
        return b.formats.some((f) => f.format === "paperback" || f.format === "hardcover");
      }
      return b.formats.some((f) => f.format === filters.format);
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    books = books.filter((b) => {
      const min = Math.min(...b.formats.map((f) => f.price));
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

  return {
    ...data,
    formats: data.store_book_formats?.filter((f) => f.is_active) || [],
    images: data.store_book_images || [],
    categories:
      data.store_book_categories?.map(
        (bc: { store_categories: { id: string; name: string; slug: string } }) =>
          bc.store_categories
      ) || [],
  };
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
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("store_deals")
    .select("*, store_books(*, store_book_formats(*))")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now);
  return data || [];
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

  const { data: books } = await supabase
    .from("store_books")
    .select("*, store_book_formats(*)")
    .in("id", ids)
    .eq("is_active", true);

  return (books || []).map((book) => ({
    ...book,
    formats: (book.store_book_formats?.filter((f) => f.is_active) || []) as BookWithFormats["formats"],
  })) as BookWithFormats[];
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

function mapBookRow(book: Record<string, unknown>): BookWithFormats {
  return {
    ...book,
    formats: ((book.store_book_formats as BookWithFormats["formats"]) || []).filter(
      (f) => f.is_active
    ),
  } as BookWithFormats;
}

function filterByFormat(books: BookWithFormats[], format?: string) {
  if (!format) return books;
  if (format === "print") {
    return books.filter((b) =>
      b.formats.some((f) => f.format === "paperback" || f.format === "hardcover")
    );
  }
  return books.filter((b) => b.formats.some((f) => f.format === format));
}

function pickDisplayFormat(book: BookWithFormats, preferred?: string) {
  if (preferred === "print") {
    return book.formats.find((f) => f.format === "paperback") || book.formats.find((f) => f.format === "hardcover");
  }
  if (preferred) {
    return book.formats.find((f) => f.format === preferred);
  }
  return book.formats[0];
}

export async function getBooksByIds(ids: string[]) {
  if (!hasSupabase() || ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_books")
    .select("*, store_book_formats(*)")
    .in("id", ids)
    .eq("is_active", true);
  const books = (data || []).map((b) => mapBookRow(b as Record<string, unknown>));
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  return books.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
}

export async function getBooksByCategory(slug: string, limit = 12, format?: string) {
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
  return filterByFormat(books, format).slice(0, limit);
}

export async function getActiveDealsWithBooks(limit = 12): Promise<DealWithBook[]> {
  if (!hasSupabase()) return [];
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("store_deals")
    .select("*, store_books(*, store_book_formats(*))")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .limit(limit);

  return (data || []).map((deal) => {
    const raw = deal.store_books as Record<string, unknown>;
    const book = mapBookRow(raw);
    return {
      id: deal.id,
      book_id: deal.book_id,
      format_id: deal.format_id,
      deal_price: Number(deal.deal_price),
      starts_at: deal.starts_at,
      ends_at: deal.ends_at,
      is_active: deal.is_active,
      book,
    };
  });
}

export async function resolveSectionBooks(config: HomepageSectionConfig) {
  const limit = config.limit ?? 12;
  const format = config.format;

  if (config.book_ids?.length) {
    const books = await getBooksByIds(config.book_ids);
    return filterByFormat(books, format).slice(0, limit);
  }

  if (config.filter === "deals" || config.source === "deals") {
    const deals = await getActiveDealsWithBooks(limit);
    return deals.map((d) => d.book);
  }

  if (config.category) {
    return getBooksByCategory(config.category, limit, format);
  }

  let sort: string | undefined;
  switch (config.filter) {
    case "bestseller":
      sort = "bestseller";
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
  }

  return filterByFormat(filtered, format).slice(0, limit);
}

export async function resolveSectionDeals(config: HomepageSectionConfig) {
  const limit = config.limit ?? 12;
  return getActiveDealsWithBooks(limit);
}

export { pickDisplayFormat };
