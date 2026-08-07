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

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

function parseSaleFields(formData: FormData, regularPrice: number) {
  const onSale = formData.get("on_sale") === "on";
  if (!onSale) {
    return {
      onSale: false,
      salePercent: null as number | null,
      saleStartsAt: null as string | null,
      saleEndsAt: null as string | null,
      compareAt: null as number | null,
    };
  }

  const percentRaw = ((formData.get("sale_percent") as string) || "").trim();
  const percent = Number(percentRaw);
  if (!percentRaw || !Number.isInteger(percent) || percent < 1 || percent > 99) {
    return { error: "Sale percent must be a whole number from 1 to 99" };
  }

  const startsRaw = ((formData.get("sale_starts_at") as string) || "").trim();
  const endsRaw = ((formData.get("sale_ends_at") as string) || "").trim();
  const saleStartsAt = startsRaw ? new Date(startsRaw).toISOString() : null;
  const saleEndsAt = endsRaw ? new Date(endsRaw).toISOString() : null;

  if (startsRaw && Number.isNaN(new Date(startsRaw).getTime())) {
    return { error: "Sale start date is invalid" };
  }
  if (endsRaw && Number.isNaN(new Date(endsRaw).getTime())) {
    return { error: "Sale end date is invalid" };
  }
  if (saleStartsAt && saleEndsAt && new Date(saleStartsAt) >= new Date(saleEndsAt)) {
    return { error: "Sale start must be before sale end" };
  }

  return {
    onSale: true,
    salePercent: percent,
    saleStartsAt,
    saleEndsAt,
    compareAt: regularPrice,
  };
}

async function resolveTagsFromForm(
  supabase: ServiceClient,
  formData: FormData
): Promise<{ tags: string[]; error?: string }> {
  const tags = formData.getAll("tags").map(String).filter(Boolean);
  const newTagName = ((formData.get("new_tag") as string) || "").trim();
  if (!newTagName) return { tags };

  const slug = slugify(newTagName);
  if (!slug) return { tags, error: "Invalid new tag name" };

  const { data: existing } = await supabase
    .from("store_tags")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("store_tags").insert({
      name: newTagName,
      slug,
    });
    if (error) return { tags, error: error.message };
  }

  if (!tags.includes(slug)) tags.push(slug);
  return { tags };
}

async function syncBookCategories(
  supabase: ServiceClient,
  bookId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const categoryIds = formData.getAll("categories").map(String).filter(Boolean);
  const newCategoryName = ((formData.get("new_category") as string) || "").trim();

  if (newCategoryName) {
    const slug = slugify(newCategoryName);
    if (!slug) return { error: "Invalid new category name" };

    const { data: existing } = await supabase
      .from("store_categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      if (!categoryIds.includes(existing.id)) categoryIds.push(existing.id);
    } else {
      const { data: created, error } = await supabase
        .from("store_categories")
        .insert({ name: newCategoryName, slug, is_active: true })
        .select("id")
        .single();
      if (error || !created) return { error: error?.message || "Failed to create category" };
      categoryIds.push(created.id);
    }
  }

  await supabase.from("store_book_categories").delete().eq("book_id", bookId);

  if (categoryIds.length > 0) {
    const { error } = await supabase.from("store_book_categories").insert(
      categoryIds.map((category_id) => ({ book_id: bookId, category_id }))
    );
    if (error) return { error: error.message };
  }

  return {};
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
    .select(
      `
      email,
      order_number,
      payment_status,
      subtotal,
      discount_total,
      shipping_fee,
      grand_total,
      coupon_code,
      shipping_address,
      store_order_items (
        title,
        author,
        format,
        cover_url,
        unit_price,
        quantity
      )
    `
    )
    .eq("id", orderId)
    .single();

  await supabase.from("store_orders").update({ status }).eq("id", orderId);
  await supabase.from("store_order_events").insert({
    order_id: orderId,
    status,
    note: note || `Status updated to ${status}`,
  });

  if (order) {
    const shipping =
      order.shipping_address &&
      typeof order.shipping_address === "object" &&
      !Array.isArray(order.shipping_address)
        ? (order.shipping_address as Record<string, string>)
        : {};

    await sendOrderStatusEmail(
      {
        orderNumber: order.order_number,
        email: order.email,
        status,
        paymentStatus: order.payment_status,
        isCod: order.payment_status === "unpaid",
        items: (order.store_order_items || []).map((item) => ({
          title: item.title,
          author: item.author,
          format: item.format,
          coverUrl: item.cover_url,
          unitPrice: item.unit_price,
          quantity: item.quantity,
        })),
        shipping: {
          full_name: shipping.full_name,
          phone: shipping.phone,
          line1: shipping.line1,
          line2: shipping.line2,
          city: shipping.city,
          county: shipping.county,
          postcode: shipping.postcode,
          country: shipping.country,
        },
        subtotal: order.subtotal,
        discountTotal: order.discount_total,
        shippingFee: order.shipping_fee,
        grandTotal: order.grand_total,
        couponCode: order.coupon_code,
      },
      status
    );
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
  const description = ((formData.get("description") as string) || "").trim() || null;
  const language = ((formData.get("language") as string) || "").trim() || null;
  const pageCountRaw = ((formData.get("page_count") as string) || "").trim();
  const pageCount = pageCountRaw ? Number(pageCountRaw) : null;
  if (pageCountRaw && (!Number.isFinite(pageCount) || !Number.isInteger(pageCount!) || pageCount! < 1)) {
    return { error: "Page count must be a positive whole number" };
  }

  const price = parseWholeRupee(formData.get("price"), {
    field: "Price",
  });
  if (price.error) return { error: price.error };

  const sale = parseSaleFields(formData, price.value ?? 0);
  if (sale.error) return { error: sale.error };

  const cover = await resolveCoverUrl(formData, slug);
  if (cover.error) return { error: cover.error };

  const tagsResult = await resolveTagsFromForm(supabase, formData);
  if (tagsResult.error) return { error: tagsResult.error };

  const { data: book, error } = await supabase
    .from("store_books")
    .insert({
      title,
      slug,
      author_name: authorName,
      description,
      cover_url: cover.url,
      language,
      page_count: pageCount,
      tags: tagsResult.tags,
      is_bestseller: formData.get("is_bestseller") === "on",
      is_new_release: formData.get("is_new_release") === "on",
      is_featured: formData.get("is_featured") === "on",
      is_trending: formData.get("is_trending") === "on",
      is_active: formData.get("is_active") === "on",
    })
    .select()
    .single();

  if (error || !book) return { error: error?.message || "Failed" };

  await supabase.from("store_book_formats").insert({
    book_id: book.id,
    format: "hardcover",
    price: price.value ?? 0,
    compare_at_price: sale.compareAt,
    on_sale: sale.onSale,
    sale_percent: sale.salePercent,
    sale_starts_at: sale.saleStartsAt,
    sale_ends_at: sale.saleEndsAt,
    stock: 100,
  });

  const cats = await syncBookCategories(supabase, book.id, formData);
  if (cats.error) return { error: cats.error };

  await logAdminAction("create_book", "book", book.id, { title });
  revalidatePath("/admin/books");
  revalidatePath("/books");
  revalidatePath("/deals");
  revalidatePath("/");
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
  const name = ((formData.get("name") as string) || "").trim();
  if (!name) return { error: "Category name is required" };
  const { error } = await supabase.from("store_categories").insert({
    name,
    slug: slugify(name),
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  revalidatePath("/admin/books");
  revalidatePath("/categories");
  revalidatePath("/books");
  revalidatePath("/");
  return { success: true };
}

export async function updateCategoryHomepageAction(
  categoryId: string,
  showOnHomepage: boolean
) {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: category, error: fetchError } = await supabase
    .from("store_categories")
    .select("id, parent_id, show_on_homepage, homepage_sort_order")
    .eq("id", categoryId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!category) return { error: "Category not found" };
  if (category.parent_id) {
    return { error: "Only top-level categories can appear on the homepage" };
  }

  let homepageSortOrder = category.homepage_sort_order ?? 0;
  if (showOnHomepage && !category.show_on_homepage) {
    const { data: featured } = await supabase
      .from("store_categories")
      .select("homepage_sort_order")
      .eq("show_on_homepage", true)
      .is("parent_id", null)
      .order("homepage_sort_order", { ascending: false })
      .limit(1);
    homepageSortOrder = (featured?.[0]?.homepage_sort_order ?? -1) + 1;
  }

  const { error } = await supabase
    .from("store_categories")
    .update({
      show_on_homepage: showOnHomepage,
      homepage_sort_order: showOnHomepage ? homepageSortOrder : 0,
    })
    .eq("id", categoryId);

  if (error) return { error: error.message };

  await logAdminAction("update_category_homepage", "category", categoryId, {
    show_on_homepage: showOnHomepage,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/books");
  revalidatePath("/categories");
  revalidatePath("/");
  return { success: true };
}

export async function reorderHomepageCategoriesAction(orderedIds: string[]) {
  await requireAdmin();
  const supabase = await createServiceClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("store_categories")
      .update({ homepage_sort_order: i, show_on_homepage: true })
      .eq("id", orderedIds[i])
      .is("parent_id", null);
    if (error) return { error: error.message };
  }

  await logAdminAction("reorder_homepage_categories", "category", undefined, {
    orderedIds,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/books");
  revalidatePath("/categories");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdmin();
  const supabase = await createServiceClient();
  const { count } = await supabase
    .from("store_book_categories")
    .select("book_id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if ((count || 0) > 0) {
    return {
      error: `Cannot delete: ${count} book(s) are assigned to this category. Remove them first.`,
    };
  }

  const { error } = await supabase
    .from("store_categories")
    .delete()
    .eq("id", categoryId);
  if (error) return { error: error.message };

  await logAdminAction("delete_category", "category", categoryId);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/books");
  revalidatePath("/categories");
  revalidatePath("/books");
  revalidatePath("/");
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
    field: "Price",
  });
  if (price.error) return { error: price.error };

  const sale = parseSaleFields(formData, price.value ?? 0);
  if (sale.error) return { error: sale.error };

  const title = formData.get("title") as string;
  const slugBase = slugify(title) || bookId;
  const description = ((formData.get("description") as string) || "").trim() || null;
  const language = ((formData.get("language") as string) || "").trim() || null;
  const pageCountRaw = ((formData.get("page_count") as string) || "").trim();
  const pageCount = pageCountRaw ? Number(pageCountRaw) : null;
  if (pageCountRaw && (!Number.isFinite(pageCount) || !Number.isInteger(pageCount!) || pageCount! < 1)) {
    return { error: "Page count must be a positive whole number" };
  }

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

  const tagsResult = await resolveTagsFromForm(supabase, formData);
  if (tagsResult.error) return { error: tagsResult.error };

  await supabase
    .from("store_books")
    .update({
      title,
      author_name: formData.get("author_name") as string,
      description,
      language,
      page_count: pageCount,
      ...coverUpdate,
      tags: tagsResult.tags,
      is_bestseller: formData.get("is_bestseller") === "on",
      is_new_release: formData.get("is_new_release") === "on",
      is_featured: formData.get("is_featured") === "on",
      is_trending: formData.get("is_trending") === "on",
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", bookId);

  const cats = await syncBookCategories(supabase, bookId, formData);
  if (cats.error) return { error: cats.error };

  const { data: existing } = await supabase
    .from("store_book_formats")
    .select("id")
    .eq("book_id", bookId)
    .eq("format", "hardcover")
    .maybeSingle();

  const formatPatch = {
    price: price.value ?? 0,
    compare_at_price: sale.compareAt,
    on_sale: sale.onSale,
    sale_percent: sale.salePercent,
    sale_starts_at: sale.saleStartsAt,
    sale_ends_at: sale.saleEndsAt,
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
      ...formatPatch,
      stock: 100,
    });
  }

  revalidatePath("/admin/books");
  revalidatePath("/books");
  revalidatePath("/deals");
  revalidatePath(`/dp/${slugBase}`);
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
