import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SITE_CONFIG } from "@/lib/constants";
import type { FooterConfig, NavMenuItem, SiteConfig } from "@/lib/types";

export async function getSiteConfig(): Promise<SiteConfig> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return DEFAULT_SITE_CONFIG;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "site")
      .maybeSingle();
    return { ...DEFAULT_SITE_CONFIG, ...(data?.value as Partial<SiteConfig>) };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function getAnnouncement() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { text: "Free delivery on orders over £25", isActive: true };
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle();
    return (data?.value as { text?: string; isActive?: boolean }) || {
      text: "",
      isActive: false,
    };
  } catch {
    return { text: "", isActive: false };
  }
}

export async function getFooterConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return undefined;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "footer")
      .maybeSingle();
    return data?.value as FooterConfig;
  } catch {
    return undefined;
  }
}

export async function getBooksSubNav() {
  const defaults: NavMenuItem[] = [
    { label: "Kindle eBooks", href: "/books?format=ebook" },
    {
      label: "Categories",
      href: "/categories",
      children: [
        { label: "Fiction", href: "/books/fiction" },
        { label: "Non-Fiction", href: "/books/non-fiction" },
        { label: "Mystery", href: "/books/mystery" },
      ],
    },
    { label: "New & Trending", href: "/books?sort=newest" },
    { label: "Deals", href: "/deals" },
    { label: "Best Sellers & More", href: "/books?sort=bestseller" },
    { label: "Memberships", href: "/account/membership" },
    { label: "More", href: "/books" },
  ];
  return getNavMenu("books_subnav", defaults);
}

async function getNavMenuWithDefaults(menuKey: string, defaults: NavMenuItem[]) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return defaults;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_navigation_menus")
      .select("items")
      .eq("menu_key", menuKey)
      .maybeSingle();
    return (data?.items as NavMenuItem[]) || defaults;
  } catch {
    return defaults;
  }
}

export async function getNavMenu(menuKey: string, overrideDefaults?: NavMenuItem[]) {
  const defaults: Record<string, NavMenuItem[]> = {
    secondary: [
      { label: "Books", href: "/books" },
      { label: "Deals", href: "/deals" },
      { label: "Categories", href: "/categories" },
    ],
    mega_menu: [
      { label: "Fiction", href: "/books/fiction" },
      { label: "Non-Fiction", href: "/books/non-fiction" },
    ],
  };
  const fallback = overrideDefaults || defaults[menuKey] || [];
  return getNavMenuWithDefaults(menuKey, fallback);
}

export async function getHomepageSections() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_homepage_sections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data || [];
}
