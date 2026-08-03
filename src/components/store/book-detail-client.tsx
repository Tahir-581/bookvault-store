"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CoverZoom } from "@/components/store/cover-zoom";
import { ReviewForm } from "@/components/store/review-form";
import { StarRating } from "@/components/store/star-rating";
import { ProductCard } from "@/components/store/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FORMAT_LABELS, type BookFormat } from "@/lib/constants";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { formatPrice } from "@/lib/utils";
import type { BookWithFormats } from "@/lib/types";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified_purchase: boolean;
  created_at: string;
};

export function BookDetailClient({
  book,
  reviews,
  related,
}: {
  book: BookWithFormats & {
    images?: { url: string; alt: string | null }[];
    categories?: { id: string; name: string; slug: string }[];
  };
  reviews: Review[];
  related: BookWithFormats[];
}) {
  const [selectedFormat, setSelectedFormat] = useState(
    book.formats[0] || null
  );
  const addToCart = useCartStore((s) => s.addItem);
  const { addItem: addToWishlist, hasItem, removeItem } = useWishlistStore();
  const inWishlist = hasItem(book.id);

  const cover = book.cover_url || "/placeholder-book.svg";

  function handleAddToCart() {
    if (!selectedFormat) return;
    addToCart({
      bookId: book.id,
      formatId: selectedFormat.id,
      title: book.title,
      author: book.author_name,
      coverUrl: cover,
      format: selectedFormat.format as BookFormat,
      unitPrice: selectedFormat.price,
      quantity: 1,
    });
    toast.success("Added to cart");
  }

  function handleWishlist() {
    if (inWishlist) {
      removeItem(book.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        bookId: book.id,
        title: book.title,
        author: book.author_name,
        coverUrl: cover,
        format: (selectedFormat?.format as BookFormat) || "paperback",
      });
      toast.success("Added to wishlist");
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <div className="mb-4 text-sm text-gray-600">
        Books › {book.categories?.[0]?.name || "General"} › {book.title}
      </div>

      <div className="grid gap-8 rounded-lg bg-card p-6 shadow-sm lg:grid-cols-2">
        <CoverZoom
          src={cover}
          alt={book.title}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        <div>
          <h1 className="text-2xl font-medium text-foreground md:text-3xl">{book.title}</h1>
          <p className="mt-1 text-lg text-link">
            by <span className="hover:text-link-hover">{book.author_name}</span>
          </p>

          <div className="mt-3">
            <StarRating rating={Number(book.avg_rating)} count={book.review_count} size="md" />
          </div>

          {book.is_bestseller && (
            <Badge variant="deal" className="mt-3">
              #1 Best Seller
            </Badge>
          )}

          <hr className="my-4 border-border" />

          {selectedFormat && (
            <div className="mb-4">
              <span className="text-3xl font-medium text-destructive">
                {formatPrice(selectedFormat.price)}
              </span>
              {selectedFormat.compare_at_price && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  {formatPrice(selectedFormat.compare_at_price)}
                </span>
              )}
            </div>
          )}

          <div className="mb-4">
            <p className="mb-2 text-sm font-bold">Format:</p>
            <div className="flex flex-wrap gap-2">
              {book.formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`rounded border px-4 py-2 text-sm ${
                    selectedFormat?.id === fmt.id
                      ? "border-accent bg-highlight ring-2 ring-accent"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {FORMAT_LABELS[fmt.format as BookFormat]}
                  <br />
                  <span className="font-medium">{formatPrice(fmt.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedFormat && selectedFormat.stock > 0 ? (
            <p className="mb-4 text-sm text-success">In Stock</p>
          ) : (
            <p className="mb-4 text-sm text-destructive">Currently unavailable</p>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleAddToCart} size="lg" className="w-full" disabled={!selectedFormat}>
              Add to Cart
            </Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={handleAddToCart}>
              Buy Now
            </Button>
          </div>
          <Button variant="outline" className="mt-2 w-full" onClick={handleWishlist}>
            {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          </Button>

          <div className="mt-6 space-y-1 text-sm text-gray-600">
            {book.isbn && <p>ISBN: {book.isbn}</p>}
            {book.publisher && <p>Publisher: {book.publisher}</p>}
            {book.publication_date && <p>Publication date: {book.publication_date}</p>}
            {book.page_count && <p>Pages: {book.page_count}</p>}
            {book.language && <p>Language: {book.language}</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">About this item</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {book.description}
        </p>
      </div>

      <div className="mt-6 rounded-lg bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Customer reviews</h2>
        {reviews.length > 0 ? (
          <div className="mb-6 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} showCount={false} />
                  <span className="font-medium">{review.author_name}</span>
                  {review.is_verified_purchase && (
                    <Badge variant="success">Verified Purchase</Badge>
                  )}
                </div>
                {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                <p className="mt-1 text-sm text-gray-700">{review.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-gray-500">No reviews yet. Be the first to review!</p>
        )}
        <ReviewForm bookId={book.id} slug={book.slug} />
      </div>

      {related.length > 0 && (
        <div className="mt-6 rounded-lg bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Customers also bought</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {related.map((b) => (
              <ProductCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
