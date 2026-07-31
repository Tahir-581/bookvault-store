"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookFormat } from "@/lib/constants";

export type CartItem = {
  id: string;
  bookId: string;
  formatId: string;
  title: string;
  author: string;
  coverUrl: string;
  format: BookFormat;
  unitPrice: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateFormat: (
    id: string,
    format: BookFormat,
    formatId: string,
    unitPrice: number
  ) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.bookId === item.bookId && i.format === item.format
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === existing.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
          return;
        }
        set({
          items: [...get().items, { ...item, id: crypto.randomUUID() }],
        });
      },
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      updateFormat: (id, format, formatId, unitPrice) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, format, formatId, unitPrice } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    { name: "bookvault-cart" }
  )
);
