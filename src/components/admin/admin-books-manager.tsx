"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createBookAction, deleteBookAction, updateBookAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { isGoogleDriveShareUrl } from "@/lib/storage/covers";
import type { BookWithFormats } from "@/lib/types";

const BADGE_FIELDS = [
  { name: "is_bestseller", label: "Bestseller" },
  { name: "is_new_release", label: "New Release" },
  { name: "is_featured", label: "Featured" },
  { name: "is_kindle_unlimited", label: "Kindle Unlimited" },
  { name: "is_prime_eligible", label: "Prime" },
  { name: "is_first_reads", label: "First Reads" },
  { name: "is_audible_exclusive", label: "Audible Exclusive" },
] as const;

function CoverFields({
  existingUrl,
  inputId,
}: {
  existingUrl?: string | null;
  inputId: string;
}) {
  const usableExisting =
    existingUrl && !isGoogleDriveShareUrl(existingUrl) ? existingUrl : null;
  const [preview, setPreview] = useState<string | null>(usableExisting);

  useEffect(() => {
    setPreview(usableExisting);
  }, [usableExisting]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(usableExisting);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }

  return (
    <div className="md:col-span-2 space-y-3">
      <div>
        <Label htmlFor={inputId}>Cover image</Label>
        <Input
          id={inputId}
          name="cover_file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 cursor-pointer"
          onChange={onFileChange}
        />
        <p className="mt-1 text-xs text-gray-500">
          Upload a JPG, PNG, or WebP (max 5 MB). Do not paste Google Drive links.
        </p>
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Cover preview"
          className="h-40 w-28 rounded object-cover border bg-gray-100"
        />
      ) : existingUrl && isGoogleDriveShareUrl(existingUrl) ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Current cover is a Google Drive link and will not display. Upload an image file to fix it.
        </p>
      ) : null}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-600">
          Or paste a direct image URL (Unsplash, etc.)
        </summary>
        <div className="mt-2">
          <Label>Cover URL</Label>
          <Input
            name="cover_url"
            type="url"
            placeholder="https://…"
            defaultValue={usableExisting || ""}
          />
        </div>
      </details>
    </div>
  );
}

export function AdminBooksManager({ books }: { books: BookWithFormats[] }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<BookWithFormats | null>(null);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createBookAction(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Book created");
        window.location.reload();
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this book?")) return;
    startTransition(async () => {
      await deleteBookAction(id);
      toast.success("Book deleted");
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateBookAction(editing.id, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Book updated");
      setEditing(null);
      window.location.reload();
    });
  }

  const paperback = editing?.formats.find((f) => f.format === "paperback");
  const audiobook = editing?.formats.find((f) => f.format === "audiobook");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catalog Management</h1>

      <form
        action={handleCreate}
        encType="multipart/form-data"
        className="mb-8 rounded-lg bg-white p-6 shadow-sm"
      >
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
          <CoverFields inputId="create-cover-file" />
          <div>
            <Label>Paperback Price (£)</Label>
            <Input name="paperback_price" type="number" step="0.01" />
          </div>
          <div>
            <Label>Hardcover Price (£)</Label>
            <Input name="hardcover_price" type="number" step="0.01" />
          </div>
          <div>
            <Label>Audiobook Price (£)</Label>
            <Input name="audiobook_price" type="number" step="0.01" />
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={pending}>
          Add Book
        </Button>
      </form>

      {editing && (
        <form
          action={handleUpdate}
          encType="multipart/form-data"
          className="mb-8 rounded-lg border bg-gray-50 p-6"
        >
          <h2 className="mb-4 font-bold">Edit: {editing.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input name="title" defaultValue={editing.title} required />
            </div>
            <div>
              <Label>Author</Label>
              <Input name="author_name" defaultValue={editing.author_name} required />
            </div>
            <CoverFields
              key={editing.id}
              inputId="edit-cover-file"
              existingUrl={editing.cover_url}
            />
            <div>
              <Label>Paperback Price (£)</Label>
              <Input name="paperback_price" type="number" step="0.01" defaultValue={paperback?.price || ""} />
            </div>
            <div>
              <Label>Audiobook Price (£)</Label>
              <Input name="audiobook_price" type="number" step="0.01" defaultValue={audiobook?.price || ""} />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4">
              {BADGE_FIELDS.map((field) => (
                <label key={field.name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={field.name}
                    defaultChecked={editing[field.name as keyof BookWithFormats] as boolean}
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={pending}>Save</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Cover</th>
              <th className="p-3">Title</th>
              <th className="p-3">Author</th>
              <th className="p-3">Price</th>
              <th className="p-3">Badges</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => {
              const minPrice = book.formats.length
                ? Math.min(...book.formats.map((f) => f.price))
                : 0;
              const badges = BADGE_FIELDS.filter(
                (f) => book[f.name as keyof BookWithFormats]
              ).map((f) => f.label);
              const coverOk =
                book.cover_url && !isGoogleDriveShareUrl(book.cover_url)
                  ? book.cover_url
                  : null;
              return (
                <tr key={book.id} className="border-b">
                  <td className="p-3">
                    {coverOk ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverOk}
                        alt=""
                        className="h-12 w-9 rounded object-cover border bg-gray-100"
                      />
                    ) : (
                      <div className="flex h-12 w-9 items-center justify-center rounded border bg-gray-100 text-[9px] text-gray-400 text-center leading-tight px-0.5">
                        No cover
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{book.title}</td>
                  <td className="p-3">{book.author_name}</td>
                  <td className="p-3">{formatPrice(minPrice)}</td>
                  <td className="p-3 text-xs text-gray-600">{badges.join(", ") || "—"}</td>
                  <td className="p-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(book)}>
                      Edit
                    </Button>
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
