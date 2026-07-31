"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createBookAction, deleteBookAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import type { BookWithFormats } from "@/lib/types";

export function AdminBooksManager({ books }: { books: BookWithFormats[] }) {
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createBookAction(formData);
      if (result.error) toast.error(result.error);
      else toast.success("Book created");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this book?")) return;
    startTransition(async () => {
      await deleteBookAction(id);
      toast.success("Book deleted");
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catalog Management</h1>

      <form action={handleCreate} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold">Add New Book</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input name="title" required />
          </div>
          <div>
            <Label>Author</Label>
            <Input name="author_name" required />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Input name="description" />
          </div>
          <div>
            <Label>Cover URL</Label>
            <Input name="cover_url" type="url" />
          </div>
          <div>
            <Label>Paperback Price (£)</Label>
            <Input name="paperback_price" type="number" step="0.01" />
          </div>
          <div>
            <Label>Hardcover Price (£)</Label>
            <Input name="hardcover_price" type="number" step="0.01" />
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={pending}>
          Add Book
        </Button>
      </form>

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Title</th>
              <th className="p-3">Author</th>
              <th className="p-3">Price</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => {
              const minPrice = book.formats.length
                ? Math.min(...book.formats.map((f) => f.price))
                : 0;
              return (
                <tr key={book.id} className="border-b">
                  <td className="p-3 font-medium">{book.title}</td>
                  <td className="p-3">{book.author_name}</td>
                  <td className="p-3">{formatPrice(minPrice)}</td>
                  <td className="p-3">{book.avg_rating} ({book.review_count})</td>
                  <td className="p-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(book.id)}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
