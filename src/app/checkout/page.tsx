"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCheckoutSessionAction, validateCouponAction } from "@/actions/checkout";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    line1: "",
    line2: "",
    city: "",
    county: "",
    postcode: "",
    country: "United Kingdom",
    phone: "",
    deliverySpeed: "standard",
    giftMessage: "",
    giftWrap: false,
  });

  const sub = subtotal();

  async function applyCoupon() {
    const result = await validateCouponAction(couponCode, sub, form.email);
    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }
    setDiscount(result.discount || 0);
    toast.success("Coupon applied");
  }

  async function handleSubmit() {
    setLoading(true);
    const result = await createCheckoutSessionAction({
      email: form.email,
      items,
      shipping: {
        full_name: form.full_name,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        county: form.county,
        postcode: form.postcode,
        country: form.country,
        phone: form.phone,
      },
      couponCode: couponCode || undefined,
      deliverySpeed: form.deliverySpeed,
      giftMessage: form.giftMessage,
      giftWrap: form.giftWrap,
    });

    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    if (result.url) {
      window.location.href = result.url;
      return;
    }

    if (result.demo) {
      clearCart();
      router.push(`/checkout/confirmation/${result.orderNumber}`);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p>Your cart is empty.</p>
        <Button className="mt-4" onClick={() => router.push("/books")}>
          Shop Books
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex gap-4 text-sm">
        {["Shipping", "Delivery", "Payment"].map((label, i) => (
          <span
            key={label}
            className={step >= i + 1 ? "font-bold text-[#C7511F]" : "text-gray-500"}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Shipping Address</h2>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Address Line 1</Label>
              <Input
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Address Line 2</Label>
              <Input
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">
              Continue to Delivery
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Delivery Options</h2>
            <label className="flex items-center gap-3 rounded border p-4">
              <input
                type="radio"
                name="delivery"
                checked={form.deliverySpeed === "standard"}
                onChange={() => setForm({ ...form, deliverySpeed: "standard" })}
              />
              <div>
                <p className="font-medium">Standard Delivery</p>
                <p className="text-sm text-gray-600">3-5 business days — £3.99</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded border p-4">
              <input
                type="radio"
                name="delivery"
                checked={form.deliverySpeed === "express"}
                onChange={() => setForm({ ...form, deliverySpeed: "express" })}
              />
              <div>
                <p className="font-medium">Express Delivery</p>
                <p className="text-sm text-gray-600">1-2 business days — £7.99</p>
              </div>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Review & Pay</h2>
            <div className="rounded bg-gray-50 p-4 text-sm">
              <p>Subtotal: {formatPrice(sub)}</p>
              {discount > 0 && <p>Discount: -{formatPrice(discount)}</p>}
              <p className="font-bold">Items: {items.length}</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
