/**
 * Script #2: Import prepared-books.json into Supabase (upsert by slug).
 *
 * Usage: npm run books:import
 * Requires: npm run books:prepare first, plus .env.local with
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  COVER_BUCKET,
  buildCoverObjectPath,
  deleteStoredCover,
  getCoverPublicUrl,
  parseCoverStoragePath,
} from "../src/lib/storage/covers";
import type { PreparedBook } from "./prepare-books-from-csv";

const ROOT = path.resolve(__dirname, "..");
const CSV_DIR = path.join(ROOT, "product-listing-data");
const IN_BOOKS = path.join(CSV_DIR, "prepared-books.json");
const OUT_REPORT = path.join(CSV_DIR, "import-report.json");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mimeFromPath(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] || null;
}

type BookResult = {
  slug: string;
  title: string;
  action: "inserted" | "updated" | "failed";
  error?: string;
};

async function ensureCategory(
  supabase: ReturnType<typeof createClient>,
  name: string,
  cache: Map<string, string>
): Promise<{ id?: string; error?: string }> {
  const slug = slugify(name);
  if (!slug) return { error: `Invalid category name: ${name}` };
  if (cache.has(slug)) return { id: cache.get(slug) };

  const { data: existing } = await supabase
    .from("store_categories")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    cache.set(existing.slug, existing.id);
    return { id: existing.id };
  }

  const { data: created, error } = await supabase
    .from("store_categories")
    .insert({ name, slug, is_active: true })
    .select("id, slug")
    .single();

  if (error || !created) {
    return { error: error?.message || `Failed to create category: ${name}` };
  }

  cache.set(created.slug, created.id);
  return { id: created.id };
}

async function ensureTag(
  supabase: ReturnType<typeof createClient>,
  name: string,
  cache: Map<string, string>
): Promise<{ slug?: string; error?: string }> {
  const slug = slugify(name);
  if (!slug) return { error: `Invalid tag name: ${name}` };
  if (cache.has(slug)) return { slug };

  const { data: existing } = await supabase
    .from("store_tags")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    cache.set(existing.slug, existing.slug);
    return { slug: existing.slug };
  }

  const { error } = await supabase.from("store_tags").insert({ name, slug });
  if (error) return { error: error.message || `Failed to create tag: ${name}` };

  cache.set(slug, slug);
  return { slug };
}

async function uploadCover(
  supabase: ReturnType<typeof createClient>,
  coverPath: string,
  pathBase: string,
  previousCoverUrl: string | null
): Promise<{ url?: string; error?: string }> {
  const mime = mimeFromPath(coverPath);
  if (!mime) {
    return { error: `Unsupported cover extension: ${path.extname(coverPath)}` };
  }

  const buffer = fs.readFileSync(coverPath);
  if (buffer.length > 5 * 1024 * 1024) {
    return { error: "Cover image must be 5 MB or smaller" };
  }

  const objectPath = buildCoverObjectPath(pathBase, mime);
  const { error: uploadError } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(objectPath, buffer, {
      contentType: mime,
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message || "Cover upload failed" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return { error: "Missing NEXT_PUBLIC_SUPABASE_URL" };

  const url = getCoverPublicUrl(supabaseUrl, objectPath);

  const prevPath = previousCoverUrl
    ? parseCoverStoragePath(previousCoverUrl)
    : null;
  const nextPath = parseCoverStoragePath(url);
  if (prevPath && prevPath !== nextPath) {
    const deleted = await deleteStoredCover(supabase, previousCoverUrl);
    if (deleted.error) return { error: deleted.error };
  }

  return { url };
}

async function syncCategories(
  supabase: ReturnType<typeof createClient>,
  bookId: string,
  categoryIds: string[]
): Promise<{ error?: string }> {
  await supabase.from("store_book_categories").delete().eq("book_id", bookId);

  if (categoryIds.length === 0) return {};

  const { error } = await supabase.from("store_book_categories").insert(
    categoryIds.map((category_id) => ({ book_id: bookId, category_id }))
  );
  if (error) return { error: error.message };
  return {};
}

async function upsertHardcoverPrice(
  supabase: ReturnType<typeof createClient>,
  bookId: string,
  price: number
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("store_book_formats")
    .select("id, stock")
    .eq("book_id", bookId)
    .eq("format", "hardcover")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("store_book_formats")
      .update({ price })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    return {};
  }

  const { error } = await supabase.from("store_book_formats").insert({
    book_id: bookId,
    format: "hardcover",
    price,
    compare_at_price: null,
    stock: 100,
    is_active: true,
  });
  if (error) return { error: error.message };
  return {};
}

async function importBook(
  supabase: ReturnType<typeof createClient>,
  book: PreparedBook,
  categoryCache: Map<string, string>,
  tagCache: Map<string, string>
): Promise<BookResult> {
  const base: Omit<BookResult, "action"> = { slug: book.slug, title: book.title };

  try {
    const categoryIds: string[] = [];
    for (const name of book.categories) {
      const cat = await ensureCategory(supabase, name, categoryCache);
      if (cat.error || !cat.id) {
        return { ...base, action: "failed", error: cat.error };
      }
      if (!categoryIds.includes(cat.id)) categoryIds.push(cat.id);
    }

    const tagSlugs: string[] = [];
    for (const name of book.tags) {
      const tag = await ensureTag(supabase, name, tagCache);
      if (tag.error || !tag.slug) {
        return { ...base, action: "failed", error: tag.error };
      }
      if (!tagSlugs.includes(tag.slug)) tagSlugs.push(tag.slug);
    }

    const { data: existing } = await supabase
      .from("store_books")
      .select("id, cover_url")
      .eq("slug", book.slug)
      .maybeSingle();

    const cover = await uploadCover(
      supabase,
      book.cover_path,
      book.slug,
      existing?.cover_url ?? null
    );
    if (cover.error || !cover.url) {
      return { ...base, action: "failed", error: cover.error || "Cover upload failed" };
    }

    const bookFields = {
      title: book.title,
      slug: book.slug,
      author_name: book.author,
      description: book.description,
      language: "English",
      page_count: book.page_count,
      cover_url: cover.url,
      tags: tagSlugs,
      is_bestseller: book.badges.is_bestseller,
      is_featured: book.badges.is_featured,
      is_trending: book.badges.is_trending,
      is_new_release: book.badges.is_new_release,
      is_active: true,
    };

    let bookId: string;
    let action: "inserted" | "updated";

    if (existing) {
      const { error } = await supabase
        .from("store_books")
        .update(bookFields)
        .eq("id", existing.id);
      if (error) return { ...base, action: "failed", error: error.message };
      bookId = existing.id;
      action = "updated";
    } else {
      const { data: inserted, error } = await supabase
        .from("store_books")
        .insert({
          ...bookFields,
          avg_rating: book.avg_rating,
          review_count: book.review_count,
        })
        .select("id")
        .single();
      if (error || !inserted) {
        return {
          ...base,
          action: "failed",
          error: error?.message || "Failed to insert book",
        };
      }
      bookId = inserted.id;
      action = "inserted";
    }

    const fmt = await upsertHardcoverPrice(supabase, bookId, book.price);
    if (fmt.error) return { ...base, action: "failed", error: fmt.error };

    const cats = await syncCategories(supabase, bookId, categoryIds);
    if (cats.error) return { ...base, action: "failed", error: cats.error };

    return { ...base, action };
  } catch (e) {
    return {
      ...base,
      action: "failed",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "Warning: SUPABASE_SERVICE_ROLE_KEY not set; using anon key (may fail RLS/storage)."
    );
  }

  if (!fs.existsSync(IN_BOOKS)) {
    console.error(
      `Missing ${IN_BOOKS}. Run: npm run books:prepare`
    );
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(IN_BOOKS, "utf8")) as {
    books: PreparedBook[];
  };
  const books = payload.books || [];
  if (books.length === 0) {
    console.error("prepared-books.json has no books");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const categoryCache = new Map<string, string>();
  const tagCache = new Map<string, string>();
  const results: BookResult[] = [];

  console.log(`Importing ${books.length} book(s)…`);

  for (const book of books) {
    const result = await importBook(supabase, book, categoryCache, tagCache);
    results.push(result);
    const mark =
      result.action === "failed"
        ? `FAIL: ${result.error}`
        : result.action.toUpperCase();
    console.log(`  [${mark}] ${book.title}`);
  }

  const inserted = results.filter((r) => r.action === "inserted").length;
  const updated = results.filter((r) => r.action === "updated").length;
  const failed = results.filter((r) => r.action === "failed").length;

  const report = {
    generated_at: new Date().toISOString(),
    source: IN_BOOKS,
    total: results.length,
    inserted,
    updated,
    failed,
    results,
  };

  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));
  console.log(
    `Done: ${inserted} inserted, ${updated} updated, ${failed} failed → ${OUT_REPORT}`
  );

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
