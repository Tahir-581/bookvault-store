import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("store_orders")
    .select("*, store_order_items(*), store_order_events(*)")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Order {order.order_number}</h1>
      <p className="mb-6 text-gray-600">
        Placed on {new Date(order.created_at).toLocaleDateString()}
      </p>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <p className="font-medium capitalize">
          Status: {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
        </p>
        <p className="mt-2 text-lg font-bold">Total: {formatPrice(order.grand_total)}</p>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold">Items</h2>
        {(order.store_order_items || []).map(
          (item: { id: string; title: string; author: string; format: string; quantity: number; unit_price: number }) => (
            <div key={item.id} className="flex justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-500">{item.author}</p>
              </div>
              <p>{formatPrice(item.unit_price * item.quantity)}</p>
            </div>
          )
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold">Timeline</h2>
        {(order.store_order_events || []).map((event) => (
          <div key={event.id} className="mb-3 text-sm">
            <p className="font-medium capitalize">{event.status}</p>
            <p className="text-gray-500">{event.note}</p>
            <p className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
