"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/actions/checkout";
import { sendOrderStatusEmail } from "@/lib/email";
import { slugify } from "@/lib/utils";

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  note?: string
) {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: order } = await supabase
    .from("store_orders")
    .select("email, order_number")
    .eq("id", orderId)
    .single();

  await supabase.from("store_orders").update({ status }).eq("id", orderId);
  await supabase.from("store_order_events").insert({
    order_id: orderId,
    status,
    note: note || `Status updated to ${status}`,
  });

  if (order) {
    await sendOrderStatusEmail(order.email, order.order_number, status);
  }

  await logAdminAction("update_order_status", "order", orderId, { status });
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function createBookAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createServiceClient();

  const title = formData.get("title") as string;
  const authorName = formData.get("author_name") as string;
  const slug = slugify(title);
  const description = formData.get("description") as string;
  const coverUrl = formData.get("cover_url") as string;
  const paperbackPrice = Number(formData.get("paperback_price"));
  const hardcoverPrice = Number(formData.get("hardcover_price"));

  const { data: book, error } = await supabase
    .from("store_books")
    .insert({
      title,
      slug,
      author_name: authorName,
      description,
      cover_url: coverUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error || !book) return { error: error?.message || "Failed" };

  const formats = [];
  if (paperbackPrice) {
    formats.push({
      book_id: book.id,
      format: "paperback",
      price: paperbackPrice,
      stock: 100,
    });
  }
  if (hardcoverPrice) {
    formats.push({
      book_id: book.id,
      format: "hardcover",
      price: hardcoverPrice,
      stock: 50,
    });
  }
  if (formats.length) await supabase.from("store_book_formats").insert(formats);

  await logAdminAction("create_book", "book", book.id, { title });
  revalidatePath("/admin/books");
  revalidatePath("/books");
  return { success: true };
}

export async function deleteBookAction(bookId: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_books").delete().eq("id", bookId);
  await logAdminAction("delete_book", "book", bookId);
  revalidatePath("/admin/books");
  return { success: true };
}

export async function updateSiteSettingAction(key: string, value: Record<string, unknown>) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase
    .from("store_settings")
    .upsert({ key, value: value as never, updated_at: new Date().toISOString() });
  await logAdminAction("update_setting", "setting", key, value);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function moderateReviewAction(reviewId: string, status: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_reviews").update({ status }).eq("id", reviewId);
  await logAdminAction("moderate_review", "review", reviewId, { status });
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function createCouponAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_coupons").insert({
    code: (formData.get("code") as string).toUpperCase(),
    description: formData.get("description") as string,
    discount_kind: formData.get("discount_kind") as string,
    discount_value: Number(formData.get("discount_value")),
    is_active: true,
  });
  await logAdminAction("create_coupon", "coupon", formData.get("code") as string);
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const name = formData.get("name") as string;
  await supabase.from("store_categories").insert({
    name,
    slug: slugify(name),
    is_active: true,
  });
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateHomepageSectionAction(
  id: string,
  data: Record<string, unknown>
) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_homepage_sections").update(data as never).eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { success: true };
}

export async function submitReviewAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to leave a review" };

  const bookId = formData.get("book_id") as string;
  const rating = Number(formData.get("rating"));

  const { data: purchased } = await supabase
    .from("store_order_items")
    .select("id, store_orders!inner(user_id, payment_status)")
    .eq("book_id", bookId)
    .eq("store_orders.user_id", user.id)
    .eq("store_orders.payment_status", "paid")
    .limit(1);

  await supabase.from("store_reviews").insert({
    book_id: bookId,
    user_id: user.id,
    author_name: user.email?.split("@")[0] || "Customer",
    rating,
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    is_verified_purchase: (purchased?.length || 0) > 0,
    status: "pending",
  });

  revalidatePath(`/dp/${formData.get("slug")}`);
  return { success: true };
}

export async function saveAddressAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await supabase.from("store_addresses").insert({
    user_id: user.id,
    label: formData.get("label") as string,
    full_name: formData.get("full_name") as string,
    line1: formData.get("line1") as string,
    line2: (formData.get("line2") as string) || null,
    city: formData.get("city") as string,
    county: (formData.get("county") as string) || null,
    postcode: formData.get("postcode") as string,
    country: (formData.get("country") as string) || "United Kingdom",
    phone: (formData.get("phone") as string) || null,
    is_default: formData.get("is_default") === "on",
  });

  revalidatePath("/account/addresses");
  return { success: true };
}
