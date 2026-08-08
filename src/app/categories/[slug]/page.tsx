import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BooksMobileFilters, BooksSortSelect } from "@/components/store/books-mobile-filters";
import { BooksSubNav } from "@/components/store/books-sub-nav";
import { FilterSidebar } from "@/components/store/filter-sidebar";
import { InfiniteProductGrid } from "@/components/store/infinite-product-grid";
import {
  getBooks,
  getCategories,
  getCategoryBySlug,
  getFilterFacets,
} from "@/lib/data/books";
import { parseOptionalNumber } from "@/lib/filter-params";
import { getBooksSubNav } from "@/lib/data/settings";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = {
    q: query.q,
    category: slug,
    minPrice: parseOptionalNumber(query.minPrice),
    maxPrice: parseOptionalNumber(query.maxPrice),
    minRating: parseOptionalNumber(query.minRating),
    onSale: query.onSale === "1",
    language: query.language,
    author: query.author,
    sort: query.sort,
  };

  const [categories, booksSubNav, facets, { books, total, pageSize }] =
    await Promise.all([
      getCategories(),
      getBooksSubNav(),
      getFilterFacets(),
      getBooks({ ...filters, page: 1 }),
    ]);

  const filterParams = { ...query, category: slug };

  return (
    <>
      <BooksSubNav items={booksSubNav} deptLabel="books" />
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4">
        <div className="mb-3 hidden text-sm text-muted-foreground lg:block">
          <Link href="/" className="text-link hover:underline">
            Home
          </Link>{" "}
          ›{" "}
          <Link href="/categories" className="text-link hover:underline">
            Categories
          </Link>{" "}
          › {category.name}
        </div>

        <h1 className="mb-3 text-xl font-bold text-foreground">{category.name}</h1>
        {category.description && (
          <p className="mb-4 text-sm text-muted-foreground">{category.description}</p>
        )}

        <Suspense fallback={null}>
          <BooksMobileFilters
            categories={categories}
            currentFilters={filterParams}
            facets={facets}
            lockedCategory
          />
        </Suspense>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="hidden lg:block">
            <Suspense fallback={null}>
              <FilterSidebar
                categories={categories}
                currentFilters={filterParams}
                facets={facets}
                lockedCategory
              />
            </Suspense>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 hidden items-center justify-between rounded border border-border bg-card p-3 lg:flex">
              <p className="text-sm text-muted-foreground">
                {total} result{total !== 1 ? "s" : ""}
              </p>
              <Suspense fallback={null}>
                <BooksSortSelect currentSort={query.sort} />
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
              emptyMessage="No books found in this category."
            />
          </div>
        </div>
      </div>
    </>
  );
}
