"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { placeCodOrderAction, validateCouponAction } from "@/actions/checkout";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeOrderTotals } from "@/lib/coupon";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

type CheckoutClientProps = {
  initialEmail?: string;
  isSignedIn?: boolean;
  standardShipping: number;
  freeShippingThreshold: number;
  taxRate: number;
};

type Step = 1 | 2 | 3;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function CheckoutClient({
  initialEmail = "",
  isSignedIn = false,
  standardShipping,
  freeShippingThreshold,
  taxRate,
}: CheckoutClientProps) {
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponFreeShipping, setCouponFreeShipping] = useState(false);
  const [form, setForm] = useState({
    email: initialEmail,
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    county: "",
    postcode: "",
  });

  const sub = subtotal();
  const freeShipping =
    couponFreeShipping || sub >= freeShippingThreshold;
  const totals = computeOrderTotals(sub, {
    discountTotal: discount,
    shippingFee: standardShipping,
    taxRate,
    freeShipping,
  });

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openStep(next: Step) {
    if (next > 1 && !isValidEmail(form.email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (next > 2 && !shippingValid()) {
      toast.error("Please complete the required shipping fields");
      return;
    }
    setStep(next);
  }

  function shippingValid() {
    return Boolean(
      form.full_name.trim() &&
        form.phone.trim() &&
        form.line1.trim() &&
        form.city.trim() &&
        form.county.trim()
    );
  }

  async function applyCoupon() {
    if (!isValidEmail(form.email)) {
      toast.error("Enter your email before applying a promo code");
      return;
    }
    setApplyingCoupon(true);
    const result = await validateCouponAction(couponInput, sub, form.email);
    setApplyingCoupon(false);
    if ("error" in result && result.error) {
      toast.error(result.error);
      setDiscount(0);
      setCouponFreeShipping(false);
      setAppliedCoupon("");
      return;
    }
    setDiscount(result.discount || 0);
    setCouponFreeShipping(result.freeShipping || false);
    setAppliedCoupon(result.code || couponInput.trim().toUpperCase());
    toast.success("Promo code applied");
  }

  async function placeOrder() {
    if (!isValidEmail(form.email)) {
      toast.error("Please enter a valid email");
      setStep(1);
      return;
    }
    if (!shippingValid()) {
      toast.error("Please complete the required shipping fields");
      setStep(2);
      return;
    }

    setLoading(true);
    const result = await placeCodOrderAction({
      email: form.email,
      items: items.map((item) => ({
        bookId: item.bookId,
        formatId: item.formatId,
        title: item.title,
        author: item.author,
        format: item.format,
        coverUrl: item.coverUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      shipping: {
        full_name: form.full_name,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        county: form.county,
        postcode: form.postcode,
        country: "Pakistan",
      },
      couponCode: appliedCoupon || undefined,
    });
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    if (result.orderNumber) {
      clearCart();
      router.push(`/checkout/confirmation/${result.orderNumber}`);
    }
  }

  function handleCta() {
    if (step === 1) {
      if (!isValidEmail(form.email)) {
        toast.error("Please enter a valid email");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!shippingValid()) {
        toast.error("Please complete the required shipping fields");
        return;
      }
      setStep(3);
      return;
    }
    void placeOrder();
  }

  const ctaLabel =
    step === 1
      ? "Proceed to shipping"
      : step === 2
        ? "Proceed to payment"
        : "Place order";

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
    <div className="mx-auto max-w-[1500px] px-3 py-8 sm:px-4">
      <div className="grid min-w-0 gap-8 lg:grid-cols-5">
        <div className="min-w-0 space-y-3 lg:col-span-3">
          {/* Step 1: Email */}
          <section className="rounded-lg bg-white p-4 shadow-sm sm:p-5">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left"
              onClick={() => setStep(1)}
            >
              <h2 className="min-w-0 text-lg font-bold uppercase tracking-wide">
                1. Enter email
              </h2>
              {step === 1 ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />
              )}
            </button>
            {step === 1 && (
              <div className="mt-4 space-y-4">
                {isSignedIn ? (
                  <p className="text-sm text-gray-600">
                    Currently logged in as {initialEmail}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login?next=/checkout"
                      className="font-medium text-link underline hover:text-link-hover"
                    >
                      Sign in
                    </Link>
                  </p>
                )}
                <div>
                  <Label htmlFor="checkout-email">Email *</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                  />
                </div>
                <Button type="button" className="w-full lg:hidden" onClick={handleCta}>
                  Proceed to shipping
                </Button>
              </div>
            )}
            {step !== 1 && form.email && (
              <p className="mt-2 break-words text-sm text-gray-600">{form.email}</p>
            )}
          </section>

          {/* Step 2: Shipping */}
          <section
            className={cn(
              "rounded-lg bg-white p-4 shadow-sm sm:p-5",
              step < 2 && "opacity-70"
            )}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left"
              onClick={() => openStep(2)}
              disabled={!isValidEmail(form.email) && step < 2}
            >
              <h2 className="min-w-0 text-lg font-bold uppercase tracking-wide">
                2. Shipping
              </h2>
              {step === 2 ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />
              )}
            </button>
            {step === 2 && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input
                    id="full_name"
                    autoComplete="name"
                    value={form.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="line1">Address line 1 *</Label>
                  <Input
                    id="line1"
                    autoComplete="address-line1"
                    value={form.line1}
                    onChange={(e) => updateField("line1", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="line2">Address line 2</Label>
                  <Input
                    id="line2"
                    autoComplete="address-line2"
                    value={form.line2}
                    onChange={(e) => updateField("line2", e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      required
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="county">State / Province *</Label>
                    <Input
                      id="county"
                      autoComplete="address-level1"
                      value={form.county}
                      onChange={(e) => updateField("county", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <Label htmlFor="postcode">Postal code</Label>
                    <Input
                      id="postcode"
                      autoComplete="postal-code"
                      value={form.postcode}
                      onChange={(e) => updateField("postcode", e.target.value)}
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value="Pakistan" disabled readOnly />
                  </div>
                </div>
                <Button type="button" className="w-full lg:hidden" onClick={handleCta}>
                  Proceed to payment
                </Button>
              </div>
            )}
            {step > 2 && form.full_name && (
              <p className="mt-2 break-words text-sm text-gray-600">
                {form.full_name}, {form.city}, {form.county}, Pakistan
              </p>
            )}
          </section>

          {/* Step 3: Payment */}
          <section
            className={cn(
              "rounded-lg bg-white p-4 shadow-sm sm:p-5",
              step < 3 && "opacity-70"
            )}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left"
              onClick={() => openStep(3)}
            >
              <h2 className="min-w-0 text-lg font-bold uppercase tracking-wide">
                3. Payment
              </h2>
              {step === 3 ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-500" />
              )}
            </button>
            {step === 3 && (
              <div className="mt-4 space-y-4">
                <label className="flex cursor-default items-start gap-3 rounded border border-gray-200 p-3 sm:p-4">
                  <input
                    type="radio"
                    name="payment"
                    checked
                    readOnly
                    className="mt-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">Cash on Delivery (COD)</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Pay in cash when your order is delivered. No card payment
                      is required online.
                    </p>
                  </div>
                </label>
                <Button
                  type="button"
                  className="w-full lg:hidden"
                  onClick={handleCta}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Place order"}
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 max-w-full lg:col-span-2">
          <CheckoutOrderSummary
            items={items}
            itemCount={totalItems()}
            subtotal={sub}
            discount={totals.discountTotal}
            shippingFee={totals.shippingFee}
            tax={totals.tax}
            grandTotal={totals.grandTotal}
            couponCode={couponInput}
            onCouponCodeChange={setCouponInput}
            onApplyCoupon={applyCoupon}
            applyingCoupon={applyingCoupon}
            ctaLabel={ctaLabel}
            onCta={handleCta}
            ctaLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}
