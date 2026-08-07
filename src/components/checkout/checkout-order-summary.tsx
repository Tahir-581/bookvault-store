"use client";

import { CoverImage } from "@/components/store/cover-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartItem } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";

type CheckoutOrderSummaryProps = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  grandTotal: number;
  couponCode: string;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
  applyingCoupon?: boolean;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
};

export function CheckoutOrderSummary({
  items,
  itemCount,
  subtotal,
  discount,
  shippingFee,
  tax,
  grandTotal,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  applyingCoupon,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaLoading,
}: CheckoutOrderSummaryProps) {
  return (
    <aside className="rounded-lg bg-white p-5 shadow-sm lg:sticky lg:top-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-lg font-bold">
          Your Bag ({itemCount})
        </h2>
        <span className="font-bold">{formatPrice(grandTotal)}</span>
      </div>

      <ul className="divide-y divide-gray-100">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 py-4">
            <div className="relative h-20 w-16 shrink-0 bg-gray-50">
              <CoverImage
                src={item.coverUrl}
                alt={item.title}
                sizes="64px"
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{item.title}</p>
              <p className="mt-0.5 text-gray-600">{formatPrice(item.unitPrice)}</p>
              <p className="mt-1 text-xs text-gray-500 capitalize">
                {item.format.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <div className="shrink-0 text-sm font-medium">
              {formatPrice(item.unitPrice * item.quantity)}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">
          Redeem your promo code
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="Enter code"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={onApplyCoupon}
            disabled={applyingCoupon || !couponCode.trim()}
          >
            {applyingCoupon ? "..." : "Apply"}
          </Button>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
          Order summary
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>Discount</dt>
              <dd>-{formatPrice(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-600">Shipping</dt>
            <dd>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Tax</dt>
            <dd>{formatPrice(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatPrice(grandTotal)}</dd>
          </div>
        </dl>
      </div>

      <Button
        type="button"
        className="mt-6 w-full"
        onClick={onCta}
        disabled={ctaDisabled || ctaLoading}
      >
        {ctaLoading ? "Processing..." : ctaLabel}
      </Button>
    </aside>
  );
}
