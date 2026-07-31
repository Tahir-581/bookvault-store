"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FORMAT_LABELS } from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1500px] px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Your BookVault Cart is empty</h1>
        <p className="mt-2 text-gray-600">
          Check out our bestsellers or search for your next read.
        </p>
        <Link href="/books">
          <Button className="mt-6">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const sub = subtotal();

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-3xl font-medium">Shopping Cart</h1>
        <span className="text-sm text-gray-600">Price</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b border-gray-100 py-4 last:border-0"
              >
                <div className="relative h-32 w-24 shrink-0 bg-gray-50">
                  <Image
                    src={item.coverUrl}
                    alt={item.title}
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex-1">
                  <Link
                    href={`/dp/${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    className="font-medium text-[#007185] hover:text-[#C7511F]"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-[#007600]">In Stock</p>
                  <p className="text-xs text-gray-500">
                    {FORMAT_LABELS[item.format]}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded border border-gray-300">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1 text-sm text-[#007185] hover:text-[#C7511F]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-right font-medium">
                  {formatPrice(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <p className="text-lg">
              Subtotal ({totalItems()} item{totalItems() !== 1 ? "s" : ""}):{" "}
              <span className="font-bold">{formatPrice(sub)}</span>
            </p>
            <Link href="/checkout">
              <Button size="lg" className="mt-4 w-full">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
