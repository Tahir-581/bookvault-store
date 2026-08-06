import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BooksMobileFilters, BooksSortSelect } from "@/components/store/books-mobile-filters";
import { BooksSubNav } from "@/components/store/books-sub-nav";
import { FilterSidebar } from "@/components/store/filter-sidebar";
import { ProductCard } from "@/components/store/product-card";
import { getBooks, getCategories, getCategoryBySlug } from "@/lib/data/books";
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

  const [categories, booksSubNav, { books, total, page, pageSize }] = await Promise.all([
    getCategories(),
    getBooksSubNav(),
    getBooks({
      q: query.q,
      category: slug,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      minRating: query.minRating ? Number(query.minRating) : undefined,
      sort: query.sort,
      page: query.page ? Number(query.page) : 1,
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
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
          <BooksMobileFilters categories={categories} currentFilters={filterParams} />
        </Suspense>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="hidden lg:block">
            <Suspense fallback={null}>
              <FilterSidebar categories={categories} currentFilters={filterParams} />
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

            {books.length === 0 ? (
              <div className="rounded border border-border bg-card p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  No books found in this category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                {books.map((book) => (
                  <ProductCard
                    key={book.id}
                    book={book}
                    variant="storefront"
                    className="!w-full"
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`?${new URLSearchParams({
                      ...Object.fromEntries(
                        Object.entries(query).filter(([, v]) => v != null)
                      ),
                      page: String(p),
                    }).toString()}`}
                    className={`rounded px-3 py-1 text-sm ${
                      p === page
                        ? "bg-secondary font-bold text-secondary-foreground"
                        : "bg-card text-link hover:bg-muted"
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
    </>
  );
}
