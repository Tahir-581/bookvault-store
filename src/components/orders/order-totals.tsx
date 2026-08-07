import { formatPrice } from "@/lib/utils";

export function OrderTotals({
  subtotal,
  shippingFee,
  discountTotal = 0,
  grandTotal,
  title = "Order summary",
}: {
  subtotal: number;
  shippingFee: number;
  discountTotal?: number;
  grandTotal: number;
  title?: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-bold">{title}</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Subtotal</dt>
          <dd className="font-medium">{formatPrice(subtotal)}</dd>
        </div>
        {discountTotal > 0 ? (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd className="font-medium">−{formatPrice(discountTotal)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-gray-600">Shipping</dt>
          <dd className="font-medium">
            {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
          <dt className="font-bold">Order total</dt>
          <dd className="font-bold">{formatPrice(grandTotal)}</dd>
        </div>
      </dl>
    </div>
  );
}
