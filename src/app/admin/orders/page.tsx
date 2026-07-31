import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminOrdersPage() {
  const supabase = await createServiceClient();
  const { data: orders } = await supabase
    .from("store_orders")
    .select("id, order_number, email, status, grand_total, created_at")
    .order("created_at", { ascending: false });

  return <AdminOrdersTable orders={orders || []} />;
}
