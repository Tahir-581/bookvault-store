"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createCategoryAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminCategoriesManager({
  categories,
}: {
  categories: { id: string; name: string; slug: string; is_active: boolean }[];
}) {
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createCategoryAction(formData);
      toast.success("Category created");
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>
      <form action={handleCreate} className="mb-6 flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex-1">
          <Label>Category Name</Label>
          <Input name="name" required />
        </div>
        <Button type="submit" className="mt-6" disabled={pending}>Add</Button>
      </form>
      <ul className="rounded-lg bg-white shadow-sm">
        {categories.map((cat) => (
          <li key={cat.id} className="border-b px-4 py-3 last:border-0">
            <span className="font-medium">{cat.name}</span>
            <span className="ml-2 text-sm text-gray-500">/{cat.slug}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
