"use client";

import { AdminHomepageManager } from "@/components/admin/admin-homepage-manager";
import { AdminNavEditor } from "@/components/admin/admin-nav-editor";
import { AdminFooterEditor } from "@/components/admin/admin-footer-editor";
import type { FooterConfig, HomepageSection, NavMenuItem } from "@/lib/types";

export function AdminContentPageClient({
  sections,
  menus,
  pages,
  footer,
}: {
  sections: HomepageSection[];
  menus: { menu_key: string; label: string; items: NavMenuItem[] }[];
  pages: { id: string; slug: string; title: string }[];
  footer?: FooterConfig;
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Content Management</h1>

      <section className="mb-10">
        <AdminHomepageManager sections={sections} />
      </section>

      <section className="mb-10 rounded bg-white p-6 shadow-sm">
        <AdminNavEditor menus={menus} />
      </section>

      <section className="mb-10 rounded bg-white p-6 shadow-sm">
        <AdminFooterEditor footer={footer} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">Static Pages</h2>
        <ul className="rounded bg-white shadow-sm">
          {pages.map((page) => (
            <li key={page.id} className="border-b px-4 py-3 last:border-0">
              <a href={`/pages/${page.slug}`} className="font-medium text-[#007185] hover:text-[#C7511F]">
                {page.title}
              </a>
              <span className="ml-2 text-sm text-gray-500">/pages/{page.slug}</span>
            </li>
          ))}
          {pages.length === 0 && (
            <li className="px-4 py-3 text-gray-500">No content pages yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
