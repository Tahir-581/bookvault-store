import { OrderItemRow } from "./order-item-row";
import type { OrderItemDisplay } from "./types";

export function OrderItemsList({
  items,
  title = "Items",
  size = "md",
}: {
  items: OrderItemDisplay[];
  title?: string;
  size?: "md" | "lg";
}) {
  if (!items.length) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">No items in this order.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-1 font-bold">
        {title}
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({items.reduce((sum, item) => sum + item.quantity, 0)})
        </span>
      </h2>
      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} size={size} />
        ))}
      </ul>
    </div>
  );
}
