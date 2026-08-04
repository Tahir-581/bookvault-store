"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createBookAction,
  createCategoryAction,
  createTagAction,
  deleteBookAction,
  deleteCategoryAction,
  deleteTagAction,
  updateBookAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEffectivePrice, salePriceFromPercent } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { isGoogleDriveShareUrl } from "@/lib/storage/covers";
import type { BookWithFormats, Category, Tag } from "@/lib/types";

const BADGE_FIELDS = [
  { name: "is_bestseller", label: "Bestseller" },
  { name: "is_new_release", label: "New Release" },
  { name: "is_featured", label: "Featured" },
  { name: "is_trending", label: "Trending" },
] as const;

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

function CategoryCheckboxes({
  categories,
  selected,
}: {
  categories: Category[];
  selected?: string[];
}) {
  const selectedSet = new Set(selected || []);
  return (
    <div className="md:col-span-2 space-y-2">
      <Label>Categories</Label>
      {categories.length === 0 ? (
        <p className="text-xs text-gray-500">
          No categories yet. Create one below or in Manage Categories.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categories"
                value={cat.id}
                defaultChecked={selectedSet.has(cat.id)}
              />
              {cat.name}
            </label>
          ))}
        </div>
      )}
      <div>
        <Label htmlFor="new_category">Add new category (optional)</Label>
        <Input
          id="new_category"
          name="new_category"
          placeholder="e.g. Fiction"
          className="mt-1 max-w-sm"
        />
      </div>
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
  return (
    <div className="md:col-span-2 space-y-2">
      <Label>Tags</Label>
      {tags.length === 0 ? (
        <p className="text-xs text-gray-500">
          No tags yet. Create one below or in Manage Tags.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
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
      )}
      <div>
        <Label htmlFor="new_tag">Add new tag (optional)</Label>
        <Input
          id="new_tag"
          name="new_tag"
          placeholder="e.g. Staff Pick"
          className="mt-1 max-w-sm"
        />
      </div>
    </div>
  );
}

function SaleFields({
  defaultOnSale = false,
  defaultPercent,
  defaultStarts,
  defaultEnds,
  defaultPrice,
}: {
  defaultOnSale?: boolean;
  defaultPercent?: number | null;
  defaultStarts?: string | null;
  defaultEnds?: string | null;
  defaultPrice?: number | string;
}) {
  const [onSale, setOnSale] = useState(defaultOnSale);
  const [price, setPrice] = useState(String(defaultPrice ?? ""));
  const [percent, setPercent] = useState(
    defaultPercent != null ? String(defaultPercent) : ""
  );

  const preview = useMemo(() => {
    const p = Number(price);
    const pct = Number(percent);
    if (!onSale || !Number.isFinite(p) || p <= 0 || !Number.isInteger(pct) || pct < 1 || pct > 99) {
      return null;
    }
    const sale = salePriceFromPercent(p, pct);
    return { regular: p, sale, pct };
  }, [onSale, price, percent]);

  return (
    <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
      <div>
        <Label>Regular price (PKR)</Label>
        <Input
          name="price"
          type="number"
          step="1"
          inputMode="numeric"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="flex items-end pb-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="on_sale"
            value="on"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
          />
          On sale
        </label>
      </div>
      {onSale ? (
        <>
          <div>
            <Label>Sale percent (%)</Label>
            <Input
              name="sale_percent"
              type="number"
              min={1}
              max={99}
              step="1"
              inputMode="numeric"
              required={onSale}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="e.g. 20"
            />
          </div>
          <div className="flex items-end pb-2 text-sm text-gray-600">
            {preview ? (
              <span>
                {formatPrice(preview.regular)} →{" "}
                <span className="font-medium text-deal">
                  {formatPrice(preview.sale)}
                </span>{" "}
                ({preview.pct}% off)
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                Enter price and percent to preview sale price
              </span>
            )}
          </div>
          <div>
            <Label>Sale starts (optional)</Label>
            <Input
              name="sale_starts_at"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(defaultStarts)}
            />
          </div>
          <div>
            <Label>Sale ends (optional)</Label>
            <Input
              name="sale_ends_at"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(defaultEnds)}
            />
          </div>
          <p className="md:col-span-2 text-xs text-gray-500">
            Leave dates empty to keep the sale active while &quot;On sale&quot; is checked.
          </p>
        </>
      ) : null}
    </div>
  );
}

function BookFormFields({
  book,
  categories,
  tags,
  coverInputId,
}: {
  book?: BookWithFormats | null;
  categories: Category[];
  tags: Tag[];
  coverInputId: string;
}) {
  const hardcover = book?.formats.find((f) => f.format === "hardcover") || book?.formats[0];
  const selectedCategoryIds = (book?.categories || []).map((c) => c.id);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Basic info</h3>
      </div>
      <div>
        <Label>Title</Label>
        <Input name="title" defaultValue={book?.title || ""} required />
      </div>
      <div>
        <Label>Author</Label>
        <Input name="author_name" defaultValue={book?.author_name || ""} required />
      </div>
      <div className="md:col-span-2">
        <Label>Description</Label>
        <Input name="description" defaultValue={book?.description || ""} />
      </div>
      <CoverFields
        key={book?.id || "new"}
        inputId={coverInputId}
        existingUrl={book?.cover_url}
        allowRemove={Boolean(book)}
      />
      <div>
        <Label>Language</Label>
        <Input name="language" defaultValue={book?.language || "English"} placeholder="English" />
      </div>
      <div>
        <Label>Page count</Label>
        <Input
          name="page_count"
          type="number"
          min={1}
          step="1"
          inputMode="numeric"
          defaultValue={book?.page_count ?? ""}
        />
      </div>
      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            value="on"
            defaultChecked={book ? book.is_active : true}
          />
          Active (visible on storefront)
        </label>
      </div>

      <div className="md:col-span-2 mt-2">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Pricing &amp; sale</h3>
      </div>
      <SaleFields
        key={`sale-${book?.id || "new"}`}
        defaultOnSale={Boolean(hardcover?.on_sale)}
        defaultPercent={hardcover?.sale_percent}
        defaultStarts={hardcover?.sale_starts_at}
        defaultEnds={hardcover?.sale_ends_at}
        defaultPrice={hardcover?.price ?? ""}
      />

      <div className="md:col-span-2 mt-2">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Categories</h3>
      </div>
      <CategoryCheckboxes
        key={`cats-${book?.id || "new"}-${categories.length}`}
        categories={categories}
        selected={selectedCategoryIds}
      />

      <div className="md:col-span-2 mt-2">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Badges</h3>
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-4">
        {BADGE_FIELDS.map((field) => (
          <label key={field.name} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={field.name}
              defaultChecked={
                book ? Boolean(book[field.name as keyof BookWithFormats]) : false
              }
            />
            {field.label}
          </label>
        ))}
      </div>

      <div className="md:col-span-2 mt-2">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Tags</h3>
      </div>
      <TagCheckboxes
        key={`tags-${book?.id || "new"}-${tags.length}`}
        tags={tags}
        selected={book?.tags}
      />
    </div>
  );
}

export function AdminBooksManager({
  books,
  tags,
  categories,
}: {
  books: BookWithFormats[];
  tags: Tag[];
  categories: Category[];
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<BookWithFormats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBooks = normalizedQuery
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(normalizedQuery) ||
          book.author_name.toLowerCase().includes(normalizedQuery)
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

  function handleCreateCategory(formData: FormData) {
    startTransition(async () => {
      const result = await createCategoryAction(formData);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Category created");
      window.location.reload();
    });
  }

  function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Category deleted");
      window.location.reload();
    });
  }

  function handleCreateTag(formData: FormData) {
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

  function handleDeleteTag(id: string) {
    if (!confirm("Delete this tag? It will be removed from all books.")) return;
    startTransition(async () => {
      await deleteTagAction(id);
      toast.success("Tag deleted");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Catalog Management</h1>
      <p className="text-sm text-gray-600 -mt-6">
        Add and edit books, assign categories and tags, set sales, and manage vocabulary — all in one place.
      </p>

      {/* Section A — Add / Edit */}
      <section id="book-form">
        {editing ? (
          <form
            action={handleUpdate}
            encType="multipart/form-data"
            className="rounded-lg border bg-gray-50 p-6"
          >
            <h2 className="mb-4 font-bold">Edit: {editing.title}</h2>
            <BookFormFields
              book={editing}
              categories={categories}
              tags={tags}
              coverInputId="edit-cover-file"
            />
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={pending}>
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form
            action={handleCreate}
            encType="multipart/form-data"
            className="rounded-lg bg-white p-6 shadow-sm"
          >
            <h2 className="mb-4 font-bold">Add New Book</h2>
            <BookFormFields
              categories={categories}
              tags={tags}
              coverInputId="create-cover-file"
            />
            <Button type="submit" className="mt-4" disabled={pending}>
              Add Book
            </Button>
          </form>
        )}
      </section>

      {/* Section B — Categories */}
      <section id="categories" className="scroll-mt-4">
        <h2 className="mb-3 text-lg font-bold">Manage Categories</h2>
        <form
          action={handleCreateCategory}
          className="mb-4 flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-sm"
        >
          <div className="min-w-[200px] flex-1">
            <Label>Category Name</Label>
            <Input name="name" required placeholder="e.g. Non-fiction" />
          </div>
          <Button type="submit" className="mt-6" disabled={pending}>
            Add Category
          </Button>
        </form>
        <ul className="rounded-lg bg-white shadow-sm">
          {categories.length === 0 ? (
            <li className="px-4 py-6 text-sm text-gray-500">No categories yet.</li>
          ) : (
            categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between border-b px-4 py-3 last:border-0"
              >
                <div>
                  <span className="font-medium">{cat.name}</span>
                  <span className="ml-2 text-sm text-gray-500">/{cat.slug}</span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => handleDeleteCategory(cat.id)}
                >
                  Delete
                </Button>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Section C — Tags */}
      <section id="tags" className="scroll-mt-4">
        <h2 className="mb-3 text-lg font-bold">Manage Tags</h2>
        <form
          action={handleCreateTag}
          className="mb-4 flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-sm"
        >
          <div className="min-w-[200px] flex-1">
            <Label>Tag Name</Label>
            <Input name="name" required placeholder="e.g. Staff Pick" />
          </div>
          <Button type="submit" className="mt-6" disabled={pending}>
            Add Tag
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
                  onClick={() => handleDeleteTag(tag.id)}
                >
                  Delete
                </Button>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Section D — Catalog table */}
      <section id="catalog">
        <h2 className="mb-3 text-lg font-bold">Catalog</h2>
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

        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3">Cover</th>
                <th className="p-3">Title</th>
                <th className="p-3">Author</th>
                <th className="p-3">Price</th>
                <th className="p-3">Sale</th>
                <th className="p-3">Categories</th>
                <th className="p-3">Badges</th>
                <th className="p-3">Tags</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-500">
                    {normalizedQuery
                      ? "No matching books found. This title/author is not listed yet."
                      : "No books in the catalog yet."}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const hardcover =
                    book.formats.find((f) => f.format === "hardcover") || book.formats[0];
                  const pricing = getEffectivePrice(hardcover);
                  const badges = BADGE_FIELDS.filter(
                    (f) => book[f.name as keyof BookWithFormats]
                  ).map((f) => f.label);
                  const tagNames = (book.tags || [])
                    .map((slug) => tags.find((t) => t.slug === slug)?.name || slug)
                    .join(", ");
                  const catNames = (book.categories || []).map((c) => c.name).join(", ");
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
                      <td className="p-3">{formatPrice(pricing.displayPrice)}</td>
                      <td className="p-3 text-xs">
                        {pricing.onSale && pricing.salePercent != null ? (
                          <span className="text-deal font-medium">
                            {pricing.salePercent}% off
                          </span>
                        ) : hardcover?.on_sale ? (
                          <span className="text-amber-700">Scheduled</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-600">{catNames || "—"}</td>
                      <td className="p-3 text-xs text-gray-600">{badges.join(", ") || "—"}</td>
                      <td className="p-3 text-xs text-gray-600">{tagNames || "—"}</td>
                      <td className="p-3 text-xs">
                        {book.is_active ? (
                          <span className="text-green-700">Active</span>
                        ) : (
                          <span className="text-gray-500">Hidden</span>
                        )}
                      </td>
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
      </section>
    </div>
  );
}
