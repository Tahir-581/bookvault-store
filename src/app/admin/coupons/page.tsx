import { AdminCouponsManager } from "@/components/admin/admin-coupons-manager";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminCouponsPage() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("store_coupons").select("*").order("created_at", { ascending: false });
  return <AdminCouponsManager coupons={data || []} />;
}
