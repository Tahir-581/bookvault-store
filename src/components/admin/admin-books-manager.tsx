"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createBookAction, deleteBookAction, updateBookAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import { isGoogleDriveShareUrl } from "@/lib/storage/covers";
import type { BookWithFormats, Tag } from "@/lib/types";

const BADGE_FIELDS = [
  { name: "is_bestseller", label: "Bestseller" },
  { name: "is_new_release", label: "New Release" },
  { name: "is_featured", label: "Featured" },
] as const;

function CoverFields({
  existingUrl,
  inputId,
  allowRemove = false,
}: {
  existingUrl?: string | null;
  inputId: string;
  allowRemove?: boolean;
}) {
  const usableExisting =
    existingUrl && !isGoogleDriveShareUrl(existingUrl) ? existingUrl : null;
  const [preview, setPreview] = useState<string | null>(usableExisting);
  const [removeCover, setRemoveCover] = useState(false);
  const [coverUrlValue, setCoverUrlValue] = useState(usableExisting || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(usableExisting);
    setRemoveCover(false);
    setCoverUrlValue(usableExisting || "");
  }, [usableExisting]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(removeCover ? null : usableExisting);
      return;
    }
    setRemoveCover(false);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }

  function onRemoveChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setRemoveCover(checked);
    if (checked) {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
      setPreview(null);
      setCoverUrlValue("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setPreview(usableExisting);
      setCoverUrlValue(usableExisting || "");
    }
  }

  const showRemove = allowRemove && Boolean(existingUrl);

  return (
    <div className="md:col-span-2 space-y-3">
      <div>
        <Label htmlFor={inputId}>Cover image</Label>
        <Input
          ref={fileInputRef}
          id={inputId}
          name="cover_file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 cursor-pointer"
          onChange={onFileChange}
          disabled={removeCover}
        />
        <p className="mt-1 text-xs text-gray-500">
          Recommended size 800×1200 px (2:3). JPG, PNG, or WebP, max 5 MB. Do not
          paste Google Drive links.
        </p>
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Cover preview"
          className="h-40 w-28 rounded object-cover border bg-gray-100"
        />
      ) : existingUrl && isGoogleDriveShareUrl(existingUrl) && !removeCover ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Current cover is a Google Drive link and will not display. Upload an image file to fix it.
        </p>
      ) : null}
      {showRemove ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="remove_cover"
            value="on"
            checked={removeCover}
            onChange={onRemoveChange}
            className="mt-0.5"
          />
          <span>
            Remove cover
            {removeCover ? (
              <span className="block text-xs text-amber-700 mt-0.5">
                Cover will be deleted from storage and cleared when you save.
              </span>
            ) : null}
          </span>
        </label>
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
            value={coverUrlValue}
            onChange={(e) => {
              setRemoveCover(false);
              setCoverUrlValue(e.target.value);
            }}
            disabled={removeCover}
          />
        </div>
      </details>
    </div>
  );
}

function TagCheckboxes({
  tags,
  selected,
}: {
  tags: Tag[];
  selected?: string[] | null;
}) {
  const selectedSet = new Set(selected || []);
  if (tags.length === 0) {
    return (
      <p className="text-xs text-gray-500 md:col-span-2">
        No tags yet. Create some under{" "}
        <a href="/admin/tags" className="text-link underline">
          Tags
        </a>
        .
      </p>
    );
  }
  return (
    <div className="md:col-span-2">
      <Label>Tags</Label>
      <div className="mt-2 flex flex-wrap gap-3">
        {tags.map((tag) => (
          <label key={tag.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="tags"
              value={tag.slug}
              defaultChecked={selectedSet.has(tag.slug)}
            />
            {tag.name}
          </label>
        ))}
      </div>
    </div>
  );
}

export function AdminBooksManager({
  books,
  tags,
}: {
  books: BookWithFormats[];
  tags: Tag[];
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<BookWithFormats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBooks = normalizedQuery
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(normalizedQuery) ||
          book.author_name.toLowerCase().includes(normalizedQuery),
      )
    : books;

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

  const hardcover = editing?.formats.find((f) => f.format === "hardcover") || editing?.formats[0];

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
            <Label>Price (PKR)</Label>
            <Input name="price" type="number" step="1" inputMode="numeric" required />
          </div>
          <div>
            <Label>Compare-at price (PKR)</Label>
            <Input name="compare_at_price" type="number" step="1" inputMode="numeric" />
          </div>
          <TagCheckboxes tags={tags} />
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
              allowRemove
            />
            <div>
              <Label>Price (PKR)</Label>
              <Input
                name="price"
                type="number"
                step="1"
                inputMode="numeric"
                defaultValue={hardcover?.price || ""}
                required
              />
            </div>
            <div>
              <Label>Compare-at price (PKR)</Label>
              <Input
                name="compare_at_price"
                type="number"
                step="1"
                inputMode="numeric"
                defaultValue={hardcover?.compare_at_price || ""}
              />
            </div>
            <TagCheckboxes key={`tags-${editing.id}`} tags={tags} selected={editing.tags} />
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

      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <Label htmlFor="catalog-search">Search catalog</Label>
        <Input
          id="catalog-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or author to check if a book is already listed…"
          className="mt-1 max-w-xl"
        />
        {normalizedQuery ? (
          <p className="mt-2 text-sm text-gray-600">
            {filteredBooks.length > 0 ? (
              <>
                <span className="font-medium text-green-700">
                  {filteredBooks.length} listed
                </span>
                {` — matching "${searchQuery.trim()}"`}
              </>
            ) : (
              <>
                <span className="font-medium text-amber-700">Not listed</span>
                {` — no book matches "${searchQuery.trim()}"`}
              </>
            )}
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            {books.length} book{books.length === 1 ? "" : "s"} in catalog
          </p>
        )}
      </div>

      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Cover</th>
              <th className="p-3">Title</th>
              <th className="p-3">Author</th>
              <th className="p-3">Price</th>
              <th className="p-3">Badges</th>
              <th className="p-3">Tags</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  {normalizedQuery
                    ? "No matching books found. This title/author is not listed yet."
                    : "No books in the catalog yet."}
                </td>
              </tr>
            ) : (
              filteredBooks.map((book) => {
                const minPrice = book.formats.length
                  ? Math.min(...book.formats.map((f) => f.price))
                  : 0;
                const badges = BADGE_FIELDS.filter(
                  (f) => book[f.name as keyof BookWithFormats]
                ).map((f) => f.label);
                const tagNames = (book.tags || [])
                  .map((slug) => tags.find((t) => t.slug === slug)?.name || slug)
                  .join(", ");
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
                    <td className="p-3 text-xs text-gray-600">{tagNames || "—"}</td>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
