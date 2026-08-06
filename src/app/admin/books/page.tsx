import { AdminBooksManager } from "@/components/admin/admin-books-manager";
import { createServiceClient } from "@/lib/supabase/server";
import type { BookWithFormats, Category, Tag } from "@/lib/types";

export default async function AdminBooksPage() {
  const supabase = await createServiceClient();
  const [{ data }, { data: tags }, { data: categories }] = await Promise.all([
    supabase
      .from("store_books")
      .select(
        "*, store_book_formats(*), store_book_categories(category_id, store_categories(id, name, slug))"
      )
      .order("created_at", { ascending: false }),
    supabase.from("store_tags").select("id, name, slug, created_at").order("name"),
    supabase
      .from("store_categories")
      .select("id, parent_id, name, slug, description, image_url, sort_order, is_active, show_on_homepage, homepage_sort_order")
      .order("sort_order")
      .order("name"),
  ]);

  const books = (data || []).map((book) => ({
    ...book,
    formats: book.store_book_formats || [],
    categories:
      book.store_book_categories
        ?.map(
          (bc: {
            store_categories: { id: string; name: string; slug: string } | null;
          }) => bc.store_categories
        )
        .filter(Boolean) || [],
  }));

  return (
    <AdminBooksManager
      books={books as BookWithFormats[]}
      tags={(tags || []) as Tag[]}
      categories={(categories || []) as Category[]}
    />
  );
}
