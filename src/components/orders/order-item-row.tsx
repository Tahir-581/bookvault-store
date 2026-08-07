import { CoverImage } from "@/components/store/cover-image";
import { formatPrice } from "@/lib/utils";
import type { OrderItemDisplay } from "./types";

export function OrderItemRow({
  item,
  size = "md",
}: {
  item: OrderItemDisplay;
  size?: "md" | "lg";
}) {
  const thumbClass =
    size === "lg" ? "relative h-28 w-20 shrink-0 bg-muted" : "relative h-20 w-16 shrink-0 bg-muted";

  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <div className={thumbClass}>
        <CoverImage
          src={item.cover_url || ""}
          alt={item.title}
          sizes={size === "lg" ? "80px" : "64px"}
          className="object-contain p-1"
        />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium leading-snug text-gray-900">{item.title}</p>
        {item.author ? (
          <p className="mt-0.5 text-gray-600">{item.author}</p>
        ) : null}
        <p className="mt-1 text-xs capitalize text-gray-500">
          {item.format.replace(/_/g, " ")}
          {item.quantity > 1 ? ` · Qty: ${item.quantity}` : " · Qty: 1"}
        </p>
      </div>
      <div className="shrink-0 text-sm font-medium text-gray-900">
        {formatPrice(item.unit_price * item.quantity)}
      </div>
    </li>
  );
}
