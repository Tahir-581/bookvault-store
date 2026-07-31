import { createServiceClient } from "@/lib/supabase/server";
import { AdminDealsManager } from "@/components/admin/admin-deals-manager";
import type { BookWithFormats } from "@/lib/types";

export default async function AdminDealsPage() {
  const supabase = await createServiceClient();
  const [{ data: deals }, { data: books }] = await Promise.all([
    supabase
      .from("store_deals")
      .select("*, store_books(title)")
      .order("created_at", { ascending: false }),
    supabase
      .from("store_books")
      .select("*, store_book_formats(*)")
      .eq("is_active", true)
      .order("title"),
  ]);

  const mappedBooks = (books || []).map((b) => ({
    ...b,
    formats: b.store_book_formats?.filter((f) => f.is_active) || [],
  })) as BookWithFormats[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Lightning Deals</h1>
      <AdminDealsManager deals={deals || []} books={mappedBooks} />
    </div>
  );
}
