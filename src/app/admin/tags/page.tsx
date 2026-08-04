import { AdminTagsManager } from "@/components/admin/admin-tags-manager";
import { getTags } from "@/lib/data/books";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminTagsPage() {
  // Prefer service client so admins see tags even if RLS changes
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("store_tags")
    .select("id, name, slug, created_at")
    .order("name");

  const tags = data?.length ? data : await getTags();
  return <AdminTagsManager tags={tags} />;
}
