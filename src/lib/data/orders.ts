import { createClient } from "@/lib/supabase/server";

function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** True if the user has a delivered order containing this book. */
export async function userHasDeliveredBook(
  userId: string,
  bookId: string
): Promise<boolean> {
  if (!hasSupabase()) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_order_items")
    .select("id, store_orders!inner(user_id, status)")
    .eq("book_id", bookId)
    .eq("store_orders.user_id", userId)
    .eq("store_orders.status", "delivered")
    .limit(1);
  return (data?.length || 0) > 0;
}
