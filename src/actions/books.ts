"use server";

import { getBooks, type BookFilters } from "@/lib/data/books";

export type LoadMoreBooksFilters = Omit<BookFilters, "page" | "limit">;

export async function loadMoreBooks(filters: LoadMoreBooksFilters, page: number) {
  if (!Number.isFinite(page) || page < 2) {
    return { books: [], total: 0, page: 1, pageSize: 24 };
  }
  return getBooks({ ...filters, page });
}
