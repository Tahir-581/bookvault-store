"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logAdminAction } from "@/actions/checkout";
import { sendOrderStatusEmail } from "@/lib/email";
import { parseWholeRupee, slugify } from "@/lib/utils";
import {
  COVER_BUCKET,
  buildCoverObjectPath,
  deleteStoredCover,
  getCoverPublicUrl,
  parseCoverStoragePath,
  validateCoverFile,
  validateCoverUrl,
} from "@/lib/storage/covers";

async function resolveCoverUrl(
  formData: FormData,
  pathBase: string
): Promise<{ url: string | null; error?: string }> {
  const file = formData.get("cover_file");
  const rawUrl = ((formData.get("cover_url") as string) || "").trim();

  if (file instanceof File && file.size > 0) {
    const fileError = validateCoverFile(file);
    if (fileError) return { url: null, error: fileError };

    const supabase = await createServiceClient();
    const path = buildCoverObjectPath(pathBase, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError.message || "Cover upload failed" };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return { url: null, error: "Missing NEXT_PUBLIC_SUPABASE_URL" };
    }

    return { url: getCoverPublicUrl(supabaseUrl, path) };
  }

  if (rawUrl) {
    const urlError = validateCoverUrl(rawUrl);
    if (urlError) return { url: null, error: urlError };
    return { url: rawUrl };
  }

  return { url: null };
}

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

  const price = parseWholeRupee(formData.get("price"), {
    field: "Price",
  });
  if (price.error) return { error: price.error };

  const compareAt = parseWholeRupee(formData.get("compare_at_price"), {
    optional: true,
    field: "Compare-at price",
  });
  if (compareAt.error) return { error: compareAt.error };

  const cover = await resolveCoverUrl(formData, slug);
  if (cover.error) return { error: cover.error };

  const tags = formData.getAll("tags").map(String).filter(Boolean);

  const { data: book, error } = await supabase
    .from("store_books")
    .insert({
      title,
      slug,
      author_name: authorName,
      description,
      cover_url: cover.url,
      tags,
      is_active: true,
    })
    .select()
    .single();

  if (error || !book) return { error: error?.message || "Failed" };

  await supabase.from("store_book_formats").insert({
    book_id: book.id,
    format: "hardcover",
    price: price.value ?? 0,
    compare_at_price: compareAt.value ?? null,
    stock: 100,
  });

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

  if (key === "site") {
    for (const [field, label] of [
      ["freeShippingThreshold", "Free shipping threshold"],
      ["standardShipping", "Standard shipping"],
      ["expressShipping", "Express shipping"],
    ] as const) {
      const parsed = parseWholeRupee(value[field] as string | number | null | undefined, {
        field: label,
        allowZero: true,
      });
      if (parsed.error) return { error: parsed.error };
      value[field] = parsed.value;
    }
  }

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
  const discount = parseWholeRupee(formData.get("discount_value"), {
    field: "Discount value",
    allowZero: true,
  });
  if (discount.error) return { error: discount.error };

  const supabase = await createServiceClient();
  await supabase.from("store_coupons").insert({
    code: (formData.get("code") as string).toUpperCase(),
    description: formData.get("description") as string,
    discount_kind: formData.get("discount_kind") as string,
    discount_value: discount.value ?? 0,
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

export async function createTagAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Tag name is required" };
  const slug = slugify(name);
  const { error } = await supabase.from("store_tags").insert({ name, slug });
  if (error) return { error: error.message };
  revalidatePath("/admin/tags");
  revalidatePath("/admin/books");
  return { success: true };
}

export async function deleteTagAction(tagId: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const { data: tag } = await supabase
    .from("store_tags")
    .select("slug")
    .eq("id", tagId)
    .maybeSingle();

  if (tag?.slug) {
    const { data: books } = await supabase
      .from("store_books")
      .select("id, tags")
      .contains("tags", [tag.slug]);
    for (const book of books || []) {
      const next = (book.tags || []).filter((t: string) => t !== tag.slug);
      await supabase.from("store_books").update({ tags: next }).eq("id", book.id);
    }
  }

  await supabase.from("store_tags").delete().eq("id", tagId);
  revalidatePath("/admin/tags");
  revalidatePath("/admin/books");
  revalidatePath("/");
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

export async function createHomepageSectionAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const configRaw = formData.get("config") as string;
  const config = configRaw ? JSON.parse(configRaw) : {};

  const { data: maxOrder } = await supabase
    .from("store_homepage_sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("store_homepage_sections").insert({
    section_type: formData.get("section_type") as string,
    title: formData.get("title") as string,
    subtitle: (formData.get("subtitle") as string) || null,
    config,
    sort_order: (maxOrder?.sort_order ?? 0) + 1,
    is_active: true,
  });

  revalidatePath("/");
  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteHomepageSectionAction(id: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_homepage_sections").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { success: true };
}

export async function reorderHomepageSectionsAction(ids: string[]) {
  await requireAdmin();
  const supabase = await createServiceClient();
  for (let i = 0; i < ids.length; i++) {
    await supabase
      .from("store_homepage_sections")
      .update({ sort_order: i + 1 })
      .eq("id", ids[i]);
  }
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { success: true };
}

export async function updateNavMenuAction(menuKey: string, items: unknown[]) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase
    .from("store_navigation_menus")
    .upsert(
      {
        menu_key: menuKey,
        label: menuKey,
        items: items as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "menu_key" }
    );
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { success: true };
}

export async function updateFooterConfigAction(value: Record<string, unknown>) {
  return updateSiteSettingAction("footer", value);
}

export async function createDealAction(formData: FormData) {
  await requireAdmin();
  const dealPrice = parseWholeRupee(formData.get("deal_price"), {
    field: "Deal price",
  });
  if (dealPrice.error) return { error: dealPrice.error };

  const supabase = await createServiceClient();
  const bookId = formData.get("book_id") as string;
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;

  const { data: format } = await supabase
    .from("store_book_formats")
    .select("id")
    .eq("book_id", bookId)
    .eq("format", "hardcover")
    .maybeSingle();

  await supabase.from("store_deals").insert({
    book_id: bookId,
    format_id: format?.id || null,
    deal_price: dealPrice.value ?? 0,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    is_active: true,
  });
  revalidatePath("/admin/deals");
  revalidatePath("/deals");
  revalidatePath("/");
  return { success: true };
}

export async function updateDealAction(id: string, data: Record<string, unknown>) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_deals").update(data as never).eq("id", id);
  revalidatePath("/admin/deals");
  revalidatePath("/deals");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDealAction(id: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_deals").delete().eq("id", id);
  revalidatePath("/admin/deals");
  revalidatePath("/");
  return { success: true };
}

export async function updateBookBadgesAction(bookId: string, badges: Record<string, boolean>) {
  await requireAdmin();
  const supabase = await createServiceClient();
  await supabase.from("store_books").update(badges as never).eq("id", bookId);
  revalidatePath("/admin/books");
  revalidatePath("/");
  return { success: true };
}

export async function updateBookAction(bookId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const price = parseWholeRupee(formData.get("price"), {
    optional: true,
    field: "Price",
  });
  if (price.error) return { error: price.error };

  const compareAt = parseWholeRupee(formData.get("compare_at_price"), {
    optional: true,
    field: "Compare-at price",
  });
  if (compareAt.error) return { error: compareAt.error };

  const title = formData.get("title") as string;
  const slugBase = slugify(title) || bookId;

  const { data: currentBook } = await supabase
    .from("store_books")
    .select("cover_url")
    .eq("id", bookId)
    .maybeSingle();
  const previousCoverUrl = currentBook?.cover_url ?? null;

  const coverFile = formData.get("cover_file");
  const hasNewFile = coverFile instanceof File && coverFile.size > 0;
  const rawCoverUrl = ((formData.get("cover_url") as string) || "").trim();
  const removeCover = formData.get("remove_cover") === "on";

  let coverUpdate: { cover_url: string | null } | Record<string, never> = {};

  if (hasNewFile || (rawCoverUrl && !removeCover)) {
    const cover = await resolveCoverUrl(formData, slugBase);
    if (cover.error) return { error: cover.error };

    const newUrl = cover.url;
    const prevPath = previousCoverUrl
      ? parseCoverStoragePath(previousCoverUrl)
      : null;
    const nextPath = newUrl ? parseCoverStoragePath(newUrl) : null;
    if (prevPath && prevPath !== nextPath) {
      const deleted = await deleteStoredCover(supabase, previousCoverUrl);
      if (deleted.error) return { error: deleted.error };
    }

    coverUpdate = { cover_url: newUrl };
  } else if (removeCover) {
    const deleted = await deleteStoredCover(supabase, previousCoverUrl);
    if (deleted.error) return { error: deleted.error };
    coverUpdate = { cover_url: null };
  }

  const tags = formData.getAll("tags").map(String).filter(Boolean);

  await supabase
    .from("store_books")
    .update({
      title,
      author_name: formData.get("author_name") as string,
      ...coverUpdate,
      tags,
      is_bestseller: formData.get("is_bestseller") === "on",
      is_new_release: formData.get("is_new_release") === "on",
      is_featured: formData.get("is_featured") === "on",
    })
    .eq("id", bookId);

  if (price.value != null) {
    const { data: existing } = await supabase
      .from("store_book_formats")
      .select("id")
      .eq("book_id", bookId)
      .eq("format", "hardcover")
      .maybeSingle();

    const formatPatch = {
      price: price.value,
      ...(compareAt.value != null ? { compare_at_price: compareAt.value } : {}),
    };

    if (existing) {
      await supabase
        .from("store_book_formats")
        .update(formatPatch)
        .eq("id", existing.id);
    } else {
      await supabase.from("store_book_formats").insert({
        book_id: bookId,
        format: "hardcover",
        price: price.value,
        compare_at_price: compareAt.value ?? null,
        stock: 100,
      });
    }
  } else if (compareAt.value != null) {
    await supabase
      .from("store_book_formats")
      .update({ compare_at_price: compareAt.value })
      .eq("book_id", bookId)
      .eq("format", "hardcover");
  }

  revalidatePath("/admin/books");
  revalidatePath("/");
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
