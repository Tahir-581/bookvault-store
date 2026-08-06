"use client";

import Link from "next/link";
import { Heart, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { CoverImage } from "@/components/store/cover-image";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/store/wishlist";

function bookHref(title: string) {
  return `/dp/${title.toLowerCase().replace(/\s+/g, "-")}`;
}

export function WishlistDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem } = useWishlistStore();

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close wishlist"
        onClick={closeDrawer}
      />

      <aside className="absolute right-0 top-0 flex h-full w-[min(90vw,380px)] flex-col bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Wishlist</h2>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                Your wishlist is empty.
              </p>
              <Link href="/books" onClick={closeDrawer}>
                <Button className="mt-4">Browse Books</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.bookId} className="flex gap-3 px-4 py-3">
                  <Link
                    href={bookHref(item.title)}
                    onClick={closeDrawer}
                    className="relative h-20 w-14 shrink-0 bg-muted"
                  >
                    <CoverImage
                      src={item.coverUrl}
                      alt={item.title}
                      sizes="56px"
                      className="object-contain"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={bookHref(item.title)}
                      onClick={closeDrawer}
                      className="line-clamp-2 text-sm font-medium text-link hover:text-link-hover"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.author}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.bookId)}
                    className="shrink-0 self-start p-1 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${item.title} from wishlist`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <Link href="/account/wishlist" onClick={closeDrawer}>
              <Button variant="outline" className="w-full">
                View full wishlist
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
