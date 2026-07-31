import { AdminReviewsManager } from "@/components/admin/admin-reviews-manager";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminReviewsPage() {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("store_reviews")
    .select("*")
    .order("created_at", { ascending: false });
  return <AdminReviewsManager reviews={data || []} />;
}
