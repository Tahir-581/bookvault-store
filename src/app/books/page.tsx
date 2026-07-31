import Link from "next/link";
import { Suspense } from "react";
import { FilterSidebar } from "@/components/store/filter-sidebar";
import { ProductCard } from "@/components/store/product-card";
import { getBooks, getCategories } from "@/lib/data/books";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [categories, { books, total, page, pageSize }] = await Promise.all([
    getCategories(),
    getBooks({
      q: params.q,
      category: params.category,
      format: params.format,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      minRating: params.minRating ? Number(params.minRating) : undefined,
      sort: params.sort,
      page: params.page ? Number(params.page) : 1,
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <div className="mb-4 text-sm text-gray-600">
        <Link href="/">Home</Link> › Books
        {params.q && <> › Results for &quot;{params.q}&quot;</>}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Suspense>
          <FilterSidebar categories={categories} currentFilters={params} />
        </Suspense>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between rounded bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">
              {total} result{total !== 1 ? "s" : ""}
            </p>
            <select
              defaultValue={params.sort || ""}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            >
              <option value="">Featured</option>
              <option value="bestseller">Best Sellers</option>
              <option value="newest">Newest Arrivals</option>
              <option value="rating">Avg. Customer Review</option>
            </select>
          </div>

          {books.length === 0 ? (
            <div className="rounded bg-white p-12 text-center shadow-sm">
              <p className="text-lg text-gray-600">No books found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {books.map((book) => (
                <ProductCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?${new URLSearchParams({ ...params, page: String(p) }).toString()}`}
                  className={`rounded px-3 py-1 text-sm ${
                    p === page
                      ? "bg-[#FF9900] font-bold text-black"
                      : "bg-white text-[#007185] hover:bg-gray-100"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
