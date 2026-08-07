import Link from "next/link";
import { Suspense } from "react";
import { BooksMobileFilters, BooksSortSelect } from "@/components/store/books-mobile-filters";
import { BooksSubNav } from "@/components/store/books-sub-nav";
import { FilterSidebar } from "@/components/store/filter-sidebar";
import { InfiniteProductGrid } from "@/components/store/infinite-product-grid";
import { getBooks, getCategories } from "@/lib/data/books";
import { getBooksSubNav } from "@/lib/data/settings";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters = {
    q: params.q,
    category: params.category,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    sort: params.sort,
  };

  const [categories, booksSubNav, { books, total, pageSize }] = await Promise.all([
    getCategories(),
    getBooksSubNav(),
    getBooks({ ...filters, page: 1 }),
  ]);

  return (
    <>
      <BooksSubNav items={booksSubNav} deptLabel="books" />
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
        <div className="mb-3 hidden text-sm text-muted-foreground lg:block">
          <Link href="/" className="text-link hover:underline">
            Home
          </Link>{" "}
          › Books
          {params.q && <> › Results for &quot;{params.q}&quot;</>}
        </div>

        <Suspense fallback={null}>
          <BooksMobileFilters categories={categories} currentFilters={params} />
        </Suspense>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="hidden lg:block">
            <Suspense fallback={null}>
              <FilterSidebar categories={categories} currentFilters={params} />
            </Suspense>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-3 hidden items-center justify-between rounded border border-border bg-card p-3 lg:flex">
              <p className="text-sm text-muted-foreground">
                {total} result{total !== 1 ? "s" : ""}
              </p>
              <Suspense fallback={null}>
                <BooksSortSelect currentSort={params.sort} />
              </Suspense>
            </div>

            <p className="mb-2 text-sm text-muted-foreground lg:hidden">
              {total} result{total !== 1 ? "s" : ""}
            </p>

            <InfiniteProductGrid
              initialBooks={books}
              total={total}
              pageSize={pageSize}
              filters={filters}
              emptyMessage="No books found. Try adjusting your filters."
            />
          </div>
        </div>
      </div>
    </>
  );
}
