"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadMoreBooks,
  type LoadMoreBooksFilters,
} from "@/actions/books";
import { ProductCard } from "@/components/store/product-card";
import type { BookWithFormats } from "@/lib/types";

export function InfiniteProductGrid({
  initialBooks,
  total,
  pageSize,
  filters,
  emptyMessage = "No books found. Try adjusting your filters.",
}: {
  initialBooks: BookWithFormats[];
  total: number;
  pageSize: number;
  filters: LoadMoreBooksFilters;
  emptyMessage?: string;
}) {
  const [books, setBooks] = useState(initialBooks);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialBooks.length < total);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Reset when the server sends a new first page (filter/sort change)
  useEffect(() => {
    setBooks(initialBooks);
    setPage(1);
    setHasMore(initialBooks.length < total);
    setLoading(false);
    loadingRef.current = false;
  }, [initialBooks, total]);

  const loadNext = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const result = await loadMoreBooks(filters, nextPage);
      if (result.books.length === 0) {
        setHasMore(false);
        return;
      }
      let nextLength = 0;
      let appendedCount = 0;
      setBooks((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        const appended = result.books.filter((b) => !seen.has(b.id));
        appendedCount = appended.length;
        const next = [...prev, ...appended];
        nextLength = next.length;
        return next;
      });
      setPage(nextPage);
      setHasMore(nextLength < result.total && appendedCount > 0);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [filters, hasMore, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadNext();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadNext]);

  if (books.length === 0) {
    return (
      <div className="rounded border border-border bg-card p-12 text-center">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
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

      {hasMore && (
        <div
          ref={sentinelRef}
          className="mt-6 flex justify-center py-4"
          aria-hidden={!loading}
        >
          {loading && (
            <p className="text-sm text-muted-foreground">Loading more…</p>
          )}
        </div>
      )}
    </div>
  );
}
