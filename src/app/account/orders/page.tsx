import Link from "next/link";
import { CoverImage } from "@/components/store/cover-image";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

type OrderListItem = {
  id: string;
  title: string;
  cover_url: string | null;
};

type OrderListRow = {
  id: string;
  order_number: string;
  status: string;
  grand_total: number;
  created_at: string;
  store_order_items: OrderListItem[] | null;
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("store_orders")
    .select(
      "id, order_number, status, grand_total, created_at, store_order_items(id, title, cover_url)"
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const rows = (orders || []) as OrderListRow[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Orders</h1>
      {!rows.length ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/books"
            className="mt-4 inline-block text-sm font-medium text-link hover:text-link-hover"
          >
            Browse books
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((order) => {
            const items = order.store_order_items || [];
            const preview = items.slice(0, 4);
            const statusLabel =
              ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status;
            const firstTitle = items[0]?.title;
            const moreCount = Math.max(items.length - 1, 0);

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.order_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(order.grand_total)}
                    </p>
                    <p className="text-sm font-medium capitalize text-success">
                      {statusLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  {preview.length > 0 ? (
                    <div className="flex shrink-0 -space-x-2">
                      {preview.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative h-16 w-12 overflow-hidden rounded-sm border border-white bg-muted shadow-sm"
                          style={{ zIndex: preview.length - index }}
                        >
                          <CoverImage
                            src={item.cover_url || ""}
                            alt={item.title}
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="min-w-0 flex-1">
                    {firstTitle ? (
                      <p className="truncate text-sm text-gray-800">
                        {firstTitle}
                        {moreCount > 0 ? (
                          <span className="text-gray-500">
                            {" "}
                            + {moreCount} more
                          </span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">View order details</p>
                    )}
                    <p className="mt-1 text-xs text-link">View order details</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
