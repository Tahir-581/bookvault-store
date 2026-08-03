"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookFormat } from "@/lib/constants";

export type WishlistItem = {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string;
  format: BookFormat;
  addedAt: string;
};

type WishlistState = {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (bookId: string) => void;
  hasItem: (bookId: string) => boolean;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().hasItem(item.bookId)) return;
        set({
          items: [
            ...get().items,
            { ...item, addedAt: new Date().toISOString() },
          ],
        });
      },
      removeItem: (bookId) =>
        set((state) => ({
          items: state.items.filter((i) => i.bookId !== bookId),
        })),
      hasItem: (bookId) => get().items.some((i) => i.bookId === bookId),
      clear: () => set({ items: [] }),
    }),
    { name: "ilfaaz-wishlist" }
  )
);
