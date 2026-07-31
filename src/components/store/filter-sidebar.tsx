"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";

export function FilterSidebar({
  categories,
  currentFilters,
}: {
  categories: Category[];
  currentFilters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-56">
      <div>
        <h3 className="mb-2 font-bold text-[#0F1111]">Department</h3>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => updateFilter("category", null)}
              className="text-[#007185] hover:text-[#C7511F] hover:underline"
            >
              All Books
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => updateFilter("category", cat.slug)}
                className={`hover:text-[#C7511F] hover:underline ${
                  currentFilters.category === cat.slug
                    ? "font-bold text-[#C7511F]"
                    : "text-[#007185]"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-bold text-[#0F1111]">Format</h3>
        <div className="space-y-2 text-sm">
          {["paperback", "hardcover", "ebook"].map((fmt) => (
            <label key={fmt} className="flex items-center gap-2 capitalize">
              <input
                type="radio"
                name="format"
                checked={currentFilters.format === fmt}
                onChange={() => updateFilter("format", fmt)}
              />
              {fmt === "ebook" ? "Kindle eBook" : fmt}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-bold text-[#0F1111]">Avg. Customer Review</h3>
        <div className="space-y-2 text-sm">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => updateFilter("minRating", String(r))}
              className="block text-[#007185] hover:text-[#C7511F] hover:underline"
            >
              {r} Stars & Up
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-bold text-[#0F1111]">Price</h3>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateFilter("minPrice", (fd.get("minPrice") as string) || null);
            updateFilter("maxPrice", (fd.get("maxPrice") as string) || null);
          }}
        >
          <div>
            <Label className="text-xs">Min £</Label>
            <Input name="minPrice" type="number" defaultValue={currentFilters.minPrice} className="h-8" />
          </div>
          <div>
            <Label className="text-xs">Max £</Label>
            <Input name="maxPrice" type="number" defaultValue={currentFilters.maxPrice} className="h-8" />
          </div>
          <Button type="submit" size="sm" className="mt-5">
            Go
          </Button>
        </form>
      </div>
    </aside>
  );
}
