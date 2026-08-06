"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createHomepageSectionAction,
  deleteHomepageSectionAction,
  reorderHomepageSectionsAction,
  updateHomepageSectionAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomepageSection } from "@/lib/types";

const SECTION_TYPES = [
  "book_row",
  "carousel",
  "category_tiles",
  "category_shelves",
  "editorial",
];

export function AdminHomepageManager({ sections }: { sections: HomepageSection[] }) {
  const [items, setItems] = useState(sections);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<HomepageSection | null>(null);

  function handleReorder(index: number, direction: "up" | "down") {
    const newItems = [...items];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= newItems.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    setItems(newItems);
    startTransition(async () => {
      await reorderHomepageSectionsAction(newItems.map((s) => s.id));
      toast.success("Order updated");
    });
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const config = {
        filter: formData.get("filter") as string || undefined,
        limit: Number(formData.get("limit")) || 12,
        see_more_href: formData.get("see_more_href") as string || undefined,
      };
      formData.set("config", JSON.stringify(config));
      await createHomepageSectionAction(formData);
      toast.success("Section created");
      window.location.reload();
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editing) return;
    startTransition(async () => {
      const config = {
        filter: formData.get("filter") as string || undefined,
        limit: Number(formData.get("limit")) || 12,
        see_more_href: formData.get("see_more_href") as string || undefined,
        source: formData.get("source") as string || undefined,
        cta: formData.get("cta_label")
          ? { label: formData.get("cta_label") as string, href: formData.get("cta_href") as string }
          : undefined,
      };
      await updateHomepageSectionAction(editing.id, {
        title: formData.get("title") as string,
        subtitle: formData.get("subtitle") as string,
        section_type: formData.get("section_type") as string,
        config,
        is_active: formData.get("is_active") === "on",
      });
      toast.success("Section updated");
      setEditing(null);
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this section?")) return;
    startTransition(async () => {
      await deleteHomepageSectionAction(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
      toast.success("Section deleted");
    });
  }

  function handleToggleActive(section: HomepageSection) {
    startTransition(async () => {
      await updateHomepageSectionAction(section.id, { is_active: !section.is_active });
      setItems((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, is_active: !s.is_active } : s))
      );
      toast.success("Section updated");
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Homepage Sections</h2>
        <a href="/" target="_blank" className="text-sm text-link hover:underline">
          Preview home →
        </a>
      </div>

      <div className="mb-6 space-y-2">
        {items.map((section, index) => (
          <div key={section.id} className="rounded border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{section.title || section.section_type}</p>
                <p className="text-sm text-gray-500">
                  {section.section_type} · Order {section.sort_order} ·{" "}
                  {section.is_active ? "Active" : "Hidden"}
                </p>
                <pre className="mt-1 max-w-xl overflow-auto text-xs text-gray-600">
                  {JSON.stringify(section.config)}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleReorder(index, "up")} disabled={pending || index === 0}>
                  ↑
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleReorder(index, "down")} disabled={pending || index === items.length - 1}>
                  ↓
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(section)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleToggleActive(section)} disabled={pending}>
                  {section.is_active ? "Hide" : "Show"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(section.id)} disabled={pending}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <form action={handleUpdate} className="mb-6 rounded border bg-gray-50 p-4">
          <h3 className="mb-3 font-bold">Edit Section</h3>
          <SectionFields section={editing} />
          <div className="mt-3 flex gap-2">
            <Button type="submit" disabled={pending}>Save</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      )}

      <form action={handleCreate} className="rounded border bg-white p-4">
        <h3 className="mb-3 font-bold">Add Section</h3>
        <SectionFields />
        <Button type="submit" className="mt-3" disabled={pending}>Add Section</Button>
      </form>
    </div>
  );
}

function SectionFields({ section }: { section?: HomepageSection }) {
  const config = section?.config || {};
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <Label>Title</Label>
        <Input name="title" defaultValue={section?.title || ""} />
      </div>
      <div>
        <Label>Subtitle</Label>
        <Input name="subtitle" defaultValue={section?.subtitle || ""} />
      </div>
      <div>
        <Label>Type</Label>
        <select name="section_type" className="w-full rounded border px-3 py-2" defaultValue={section?.section_type || "book_row"}>
          {SECTION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          category_shelves auto-includes every active category or subcategory with at least Limit books. category_tiles is disabled.
        </p>
      </div>
      <div>
        <Label>Filter</Label>
        <select name="filter" className="w-full rounded border px-3 py-2" defaultValue={config.filter || ""}>
          <option value="">—</option>
          <option value="bestseller">bestseller</option>
          <option value="new_release">new_release</option>
          <option value="featured">featured</option>
          <option value="deals">deals</option>
        </select>
      </div>
      <div>
        <Label>Limit</Label>
        <Input name="limit" type="number" defaultValue={config.limit || 12} />
      </div>
      <div>
        <Label>See more href</Label>
        <Input name="see_more_href" defaultValue={config.see_more_href || ""} />
      </div>
      <div>
        <Label>Source (carousel)</Label>
        <Input name="source" defaultValue={config.source || ""} placeholder="deals" />
      </div>
      {section && (
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={section.is_active} />
          <Label>Active</Label>
        </div>
      )}
      <div>
        <Label>CTA label (editorial)</Label>
        <Input name="cta_label" defaultValue={config.cta?.label || ""} />
      </div>
      <div>
        <Label>CTA href</Label>
        <Input name="cta_href" defaultValue={config.cta?.href || ""} />
      </div>
    </div>
  );
}
