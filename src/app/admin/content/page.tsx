import { createServiceClient } from "@/lib/supabase/server";
import { AdminContentPageClient } from "@/components/admin/admin-content-client";
import { getFooterConfig } from "@/lib/data/settings";
import type { HomepageSection } from "@/lib/types";

export default async function AdminContentPage() {
  const supabase = await createServiceClient();
  const [{ data: sections }, { data: menus }, { data: pages }, footer] = await Promise.all([
    supabase.from("store_homepage_sections").select("*").order("sort_order"),
    supabase.from("store_navigation_menus").select("*"),
    supabase.from("store_content_pages").select("*").order("slug"),
    getFooterConfig(),
  ]);

  return (
    <AdminContentPageClient
      sections={(sections || []) as HomepageSection[]}
      menus={(menus || []).map((m) => ({
        menu_key: m.menu_key,
        label: m.label,
        items: m.items as import("@/lib/types").NavMenuItem[],
      }))}
      pages={pages || []}
      footer={footer}
    />
  );
}
