import Link from "next/link";
import { notFound } from "next/navigation";
import {
  OrderItemsList,
  OrderTotals,
  ShippingAddressCard,
  OrderTimeline,
  type OrderItemDisplay,
  type OrderEventDisplay,
} from "@/components/orders";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

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

  const items = (order.store_order_items || []) as OrderItemDisplay[];
  const events = (order.store_order_events || []) as OrderEventDisplay[];
  const statusLabel =
    ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/account/orders"
        className="text-sm font-medium text-link hover:text-link-hover"
      >
        ← Back to Your Orders
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="mt-1 text-gray-600">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <p className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium capitalize text-success">
          {statusLabel}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <OrderItemsList items={items} size="lg" />
          <ShippingAddressCard address={order.shipping_address} />
        </div>

        <div className="space-y-6">
          <OrderTotals
            subtotal={order.subtotal}
            shippingFee={order.shipping_fee}
            discountTotal={order.discount_total}
            grandTotal={order.grand_total}
          />
          <OrderTimeline events={events} />
        </div>
      </div>
    </div>
  );
}
