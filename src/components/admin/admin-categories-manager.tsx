"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  createCategoryAction,
  reorderHomepageCategoriesAction,
  updateCategoryHomepageAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";

export function AdminCategoriesManager({
  categories,
}: {
  categories: Category[];
}) {
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createCategoryAction(formData);
      toast.success("Category created");
    });
  }

  function handleToggleHomepage(cat: Category) {
    if (cat.parent_id) {
      toast.error("Only top-level categories can appear on the homepage");
      return;
    }
    startTransition(async () => {
      const result = await updateCategoryHomepageAction(cat.id, !cat.show_on_homepage);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        cat.show_on_homepage ? "Removed from homepage" : "Added to homepage"
      );
      window.location.reload();
    });
  }

  function handleReorderHomepage(categoryId: string, direction: "up" | "down") {
    const featured = categories
      .filter((c) => c.show_on_homepage && !c.parent_id)
      .sort(
        (a, b) =>
          a.homepage_sort_order - b.homepage_sort_order ||
          a.sort_order - b.sort_order ||
          a.name.localeCompare(b.name)
      );
    const index = featured.findIndex((c) => c.id === categoryId);
    if (index < 0) return;
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= featured.length) return;
    const next = [...featured];
    [next[index], next[swap]] = [next[swap], next[index]];
    startTransition(async () => {
      const result = await reorderHomepageCategoriesAction(next.map((c) => c.id));
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Homepage order updated");
      window.location.reload();
    });
  }

  const featuredIds = categories
    .filter((c) => c.show_on_homepage && !c.parent_id)
    .sort(
      (a, b) =>
        a.homepage_sort_order - b.homepage_sort_order ||
        a.sort_order - b.sort_order ||
        a.name.localeCompare(b.name)
    )
    .map((c) => c.id);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Categories</h1>
      <p className="mb-6 text-sm text-gray-600">
        Only top-level categories can be featured on the homepage.
      </p>
      <form action={handleCreate} className="mb-6 flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex-1">
          <Label>Category Name</Label>
          <Input name="name" required />
        </div>
        <Button type="submit" className="mt-6" disabled={pending}>
          Add
        </Button>
      </form>
      <ul className="rounded-lg bg-white shadow-sm">
        {categories.map((cat) => {
          const isTopLevel = !cat.parent_id;
          const featuredIndex = featuredIds.indexOf(cat.id);
          return (
            <li
              key={cat.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-0"
            >
              <div>
                <span className="font-medium">{cat.name}</span>
                <span className="ml-2 text-sm text-gray-500">/{cat.slug}</span>
                {cat.show_on_homepage && isTopLevel && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                    Homepage #{featuredIndex + 1}
                  </span>
                )}
              </div>
              {isTopLevel && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!cat.show_on_homepage}
                      disabled={pending}
                      onChange={() => handleToggleHomepage(cat)}
                    />
                    Show on homepage
                  </label>
                  {cat.show_on_homepage && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || featuredIndex <= 0}
                        onClick={() => handleReorderHomepage(cat.id, "up")}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          pending ||
                          featuredIndex < 0 ||
                          featuredIndex >= featuredIds.length - 1
                        }
                        onClick={() => handleReorderHomepage(cat.id, "down")}
                      >
                        ↓
                      </Button>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
