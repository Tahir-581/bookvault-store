import { AdminBooksManager } from "@/components/admin/admin-books-manager";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminBooksPage() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("store_books")
    .select("*, store_book_formats(*)")
    .order("created_at", { ascending: false });

  const books = (data || []).map((book) => ({
    ...book,
    formats: book.store_book_formats || [],
  }));

  return <AdminBooksManager books={books as never} />;
}
