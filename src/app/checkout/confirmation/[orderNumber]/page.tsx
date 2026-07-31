import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <Link href="/"><Button className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-lg bg-white p-8 text-center shadow-sm">
        <CheckCircle className="mx-auto h-16 w-16 text-[#007600]" />
        <h1 className="mt-4 text-2xl font-bold">Order Placed!</h1>
        <p className="mt-2 text-gray-600">
          Thank you. Your order <strong>{orderNumber}</strong> has been confirmed.
        </p>
        <p className="mt-4 text-lg font-medium">
          Total: {formatPrice(order.grand_total)}
        </p>
        <p className="text-sm text-gray-500">
          A confirmation email will be sent to {order.email}
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/account/orders">
            <Button variant="outline">View Orders</Button>
          </Link>
          <Link href="/books">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>

      {order.store_order_events && order.store_order_events.length > 0 && (
        <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold">Order Timeline</h2>
          <div className="space-y-3">
            {order.store_order_events.map((event) => (
              <div key={event.id} className="flex gap-3 text-sm">
                <div className="h-2 w-2 mt-1.5 rounded-full bg-[#FF9900]" />
                <div>
                  <p className="font-medium capitalize">{event.status}</p>
                  <p className="text-gray-500">{event.note}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
