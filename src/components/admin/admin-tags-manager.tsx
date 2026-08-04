"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createTagAction, deleteTagAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tag } from "@/lib/types";

export function AdminTagsManager({ tags }: { tags: Tag[] }) {
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createTagAction(formData);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Tag created");
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this tag? It will be removed from all books.")) return;
    startTransition(async () => {
      await deleteTagAction(id);
      toast.success("Tag deleted");
      window.location.reload();
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Tags</h1>
      <p className="mb-4 text-sm text-gray-600">
        Create tags here, then assign them to books in Catalog. Tags appear on product listings.
      </p>
      <form action={handleCreate} className="mb-6 flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="flex-1">
          <Label>Tag Name</Label>
          <Input name="name" required placeholder="e.g. Staff Pick" />
        </div>
        <Button type="submit" className="mt-6" disabled={pending}>
          Add
        </Button>
      </form>
      <ul className="rounded-lg bg-white shadow-sm">
        {tags.length === 0 ? (
          <li className="px-4 py-6 text-sm text-gray-500">No tags yet.</li>
        ) : (
          tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between border-b px-4 py-3 last:border-0"
            >
              <div>
                <span className="font-medium">{tag.name}</span>
                <span className="ml-2 text-sm text-gray-500">/{tag.slug}</span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => handleDelete(tag.id)}
              >
                Delete
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
