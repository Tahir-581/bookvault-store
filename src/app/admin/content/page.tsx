import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminContentPage() {
  const supabase = await createServiceClient();
  const [{ data: sections }, { data: menus }, { data: pages }] = await Promise.all([
    supabase.from("store_homepage_sections").select("*").order("sort_order"),
    supabase.from("store_navigation_menus").select("*"),
    supabase.from("store_content_pages").select("*").order("slug"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Content Management</h1>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Homepage Sections</h2>
        <div className="space-y-2">
          {(sections || []).map((s) => (
            <div key={s.id} className="rounded bg-white p-4 shadow-sm">
              <p className="font-medium">{s.title || s.section_type}</p>
              <p className="text-sm text-gray-500">Type: {s.section_type} | Active: {s.is_active ? "Yes" : "No"}</p>
            </div>
          ))}
          {(!sections || sections.length === 0) && (
            <p className="text-gray-500">No homepage sections configured.</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Navigation Menus</h2>
        {(menus || []).map((menu) => (
          <div key={menu.id} className="mb-4 rounded bg-white p-4 shadow-sm">
            <p className="font-medium">{menu.label} ({menu.menu_key})</p>
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(menu.items, null, 2)}
            </pre>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">Static Pages</h2>
        <ul className="rounded bg-white shadow-sm">
          {(pages || []).map((page) => (
            <li key={page.id} className="border-b px-4 py-3 last:border-0">
              <a href={`/pages/${page.slug}`} className="font-medium text-[#007185] hover:text-[#C7511F]">
                {page.title}
              </a>
              <span className="ml-2 text-sm text-gray-500">/pages/{page.slug}</span>
            </li>
          ))}
          {(!pages || pages.length === 0) && (
            <li className="px-4 py-3 text-gray-500">No content pages yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
