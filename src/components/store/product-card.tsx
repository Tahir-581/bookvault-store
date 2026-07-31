import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/store/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { BookWithFormats } from "@/lib/types";

export function ProductCard({ book }: { book: BookWithFormats }) {
  const lowestPrice = book.formats.length
    ? Math.min(...book.formats.map((f) => f.price))
    : 0;
  const comparePrice = book.formats.find((f) => f.compare_at_price)?.compare_at_price;
  const cover = book.cover_url || "/placeholder-book.svg";

  return (
    <Link
      href={`/dp/${book.slug}`}
      className="group flex h-full flex-col rounded bg-white p-3 transition hover:shadow-md"
    >
      <div className="relative mb-3 aspect-[2/3] overflow-hidden bg-gray-50">
        <Image
          src={cover}
          alt={book.title}
          fill
          className="object-contain p-2 transition group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 20vw"
        />
        {book.is_bestseller && (
          <Badge variant="deal" className="absolute left-2 top-2">
            Best Seller
          </Badge>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm text-[#0F1111] group-hover:text-[#C7511F]">
        {book.title}
      </h3>
      <p className="mt-1 text-xs text-gray-600">{book.author_name}</p>
      <div className="mt-2">
        <StarRating rating={Number(book.avg_rating)} count={book.review_count} />
      </div>
      <div className="mt-auto pt-2">
        {comparePrice && comparePrice > lowestPrice && (
          <span className="mr-2 text-xs text-gray-500 line-through">
            {formatPrice(comparePrice)}
          </span>
        )}
        <span className="text-lg font-medium text-[#0F1111]">
          {formatPrice(lowestPrice)}
        </span>
      </div>
      {book.is_new_release && (
        <p className="mt-1 text-xs text-[#007600]">New Release</p>
      )}
    </Link>
  );
}
