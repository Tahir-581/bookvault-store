import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("store_orders")
    .select("id, order_number, status, grand_total, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Orders</h1>
      {!orders?.length ? (
        <p className="text-gray-600">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block rounded-lg border bg-white p-4 hover:shadow-sm"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(order.grand_total)}</p>
                  <p className="text-sm capitalize text-success">
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
