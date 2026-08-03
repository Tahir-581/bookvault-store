"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getUser, requireAdmin } from "@/lib/auth";
import {
  computeCouponDiscount,
  computeOrderTotals,
  isCouponInWindow,
  normalizeCouponCode,
  normalizeEmail,
} from "@/lib/coupon";
import { getSiteConfig } from "@/lib/data/settings";
import { formatPrice, generateOrderNumber } from "@/lib/utils";
import { stripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function validateCouponAction(code: string, subtotal: number, email: string) {
  const supabase = await createClient();
  const normalized = normalizeCouponCode(code);

  const { data: coupon } = await supabase
    .from("store_coupons")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) return { error: "Invalid coupon code" };
  if (!isCouponInWindow(coupon.starts_at, coupon.ends_at))
    return { error: "Coupon has expired" };
  if (coupon.max_uses && coupon.use_count >= coupon.max_uses)
    return { error: "Coupon usage limit reached" };
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount)
    return { error: `Minimum order of ${formatPrice(coupon.min_order_amount)} required` };

  const { data: used } = await supabase
    .from("store_coupon_redemptions")
    .select("id")
    .eq("coupon_id", coupon.id)
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (used) return { error: "Coupon already used with this email" };

  const discount = computeCouponDiscount(
    subtotal,
    coupon.discount_kind,
    coupon.discount_value
  );

  return {
    success: true,
    code: coupon.code,
    discount,
    freeShipping: coupon.discount_kind === "free_shipping",
  };
}

export async function createCheckoutSessionAction(formData: {
  email: string;
  items: {
    bookId: string;
    formatId: string;
    title: string;
    author: string;
    format: string;
    coverUrl: string;
    unitPrice: number;
    quantity: number;
  }[];
  shipping: Record<string, string>;
  couponCode?: string;
  deliverySpeed?: string;
  giftMessage?: string;
  giftWrap?: boolean;
}) {
  const config = await getSiteConfig();
  const user = await getUser();
  const subtotal = formData.items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  let discountTotal = 0;
  let freeShipping = false;
  let couponCode: string | null = null;

  if (formData.couponCode) {
    const result = await validateCouponAction(
      formData.couponCode,
      subtotal,
      formData.email
    );
    if ("error" in result && result.error) {
      return { error: result.error };
    }
    if ("discount" in result) {
      discountTotal = result.discount || 0;
      freeShipping = result.freeShipping || false;
      couponCode = result.code || null;
    }
  }

  const shippingFee =
    formData.deliverySpeed === "express"
      ? config.expressShipping
      : config.standardShipping;

  const totals = computeOrderTotals(subtotal, {
    discountTotal,
    shippingFee,
    taxRate: config.taxRate,
    freeShipping:
      freeShipping || subtotal >= config.freeShippingThreshold,
  });

  const orderNumber = generateOrderNumber();
  const supabase = await createServiceClient();

  const { data: order, error } = await supabase
    .from("store_orders")
    .insert({
      order_number: orderNumber,
      user_id: user?.id || null,
      email: normalizeEmail(formData.email),
      status: "pending",
      payment_status: "unpaid",
      subtotal,
      discount_total: totals.discountTotal,
      shipping_fee: totals.shippingFee,
      tax: totals.tax,
      grand_total: totals.grandTotal,
      currency: config.currency,
      coupon_code: couponCode,
      shipping_address: formData.shipping,
      gift_message: formData.giftMessage || null,
      gift_wrap: formData.giftWrap || false,
      delivery_speed: formData.deliverySpeed || "standard",
    })
    .select()
    .single();

  if (error || !order) return { error: "Failed to create order" };

  await supabase.from("store_order_items").insert(
    formData.items.map((item) => ({
      order_id: order.id,
      book_id: item.bookId,
      format_id: item.formatId,
      title: item.title,
      author: item.author,
      format: item.format,
      cover_url: item.coverUrl,
      unit_price: item.unitPrice,
      quantity: item.quantity,
    }))
  );

  await supabase.from("store_order_events").insert({
    order_id: order.id,
    status: "pending",
    note: "Order placed",
  });

  if (!stripe) {
    await supabase
      .from("store_orders")
      .update({ status: "paid", payment_status: "paid" })
      .eq("id", order.id);
    await sendOrderConfirmationEmail(formData.email, orderNumber, totals.grandTotal);
    return { orderNumber, demo: true };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: formData.email,
    line_items: formData.items.map((item) => ({
      price_data: {
        currency: config.currency.toLowerCase(),
        product_data: { name: `${item.title} (${item.format})` },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    })),
    success_url: `${getSiteUrl()}/checkout/confirmation/${orderNumber}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getSiteUrl()}/cart`,
    metadata: { orderNumber, orderId: order.id },
  });

  await supabase
    .from("store_orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  return { url: session.url, orderNumber };
}

export async function logAdminAction(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  await requireAdmin();
  const user = await getUser();
  const supabase = await createServiceClient();
  await supabase.from("store_admin_audit_logs").insert({
    admin_user_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: (details || {}) as never,
  });
  revalidatePath("/admin");
}
