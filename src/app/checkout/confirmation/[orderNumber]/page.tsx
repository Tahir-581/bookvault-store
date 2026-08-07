import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OrderItemsList,
  OrderTotals,
  ShippingAddressCard,
  OrderTimeline,
  type OrderItemDisplay,
  type OrderEventDisplay,
} from "@/components/orders";
import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createServiceClient();

  const { data: order } = await supabase
    .from("store_orders")
    .select("*, store_order_items(*), store_order_events(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p>Order not found.</p>
        <Link href="/">
          <Button className="mt-4">Go Home</Button>
        </Link>
      </div>
    );
  }

  const items = (order.store_order_items || []) as OrderItemDisplay[];
  const events = (order.store_order_events || []) as OrderEventDisplay[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <CheckCircle className="mx-auto h-16 w-16 text-success" />
        <h1 className="mt-4 text-2xl font-bold">Order Placed!</h1>
        <p className="mt-2 text-gray-600">
          Thank you. Your order <strong>{orderNumber}</strong> has been
          confirmed.
        </p>
        <p className="mt-4 text-lg font-medium">
          Total: {formatPrice(order.grand_total)}
        </p>
        <p className="mt-2 text-sm font-medium text-gray-700">
          Payment method: Cash on Delivery (COD)
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Please pay in cash when your order is delivered.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          A confirmation email will be sent to {order.email}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/account/orders">
            <Button variant="outline">View Orders</Button>
          </Link>
          <Link href="/books">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
