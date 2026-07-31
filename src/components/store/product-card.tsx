import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/store/star-rating";
import { Badge } from "@/components/ui/badge";
import { DealCountdown } from "@/components/store/deal-countdown";
import { AudibleRibbon, ServiceBadges } from "@/components/store/service-badges";
import { STOREFRONT_FORMAT_LABELS } from "@/lib/constants";
import { formatAmazonPrice, formatPrice } from "@/lib/utils";
import type { BookFormatRow, BookWithFormats } from "@/lib/types";

type DealInfo = { deal_price: number; ends_at: string };

export function ProductCard({
  book,
  variant = "default",
  displayFormat,
  preferredFormat,
  deal,
}: {
  book: BookWithFormats;
  variant?: "default" | "storefront";
  displayFormat?: string;
  preferredFormat?: string;
  deal?: DealInfo;
}) {
  const formatRow = pickFormat(book, preferredFormat);
  const lowestPrice = formatRow?.price ?? (book.formats.length
    ? Math.min(...book.formats.map((f) => f.price))
    : 0);
  const comparePrice = formatRow?.compare_at_price ?? book.formats.find((f) => f.compare_at_price)?.compare_at_price;
  const price = deal ? deal.deal_price : lowestPrice;
  const cover = book.cover_url || "/placeholder-book.svg";
  const formatLabel = displayFormat || (formatRow ? STOREFRONT_FORMAT_LABELS[formatRow.format as keyof typeof STOREFRONT_FORMAT_LABELS] : undefined);

  if (variant === "storefront") {
    const amazonPrice = formatAmazonPrice(price);
    const showAudibleRibbon = book.is_audible_exclusive || formatRow?.format === "audiobook";

    return (
      <Link
        href={`/dp/${book.slug}`}
        className="group flex w-[160px] shrink-0 flex-col sm:w-[180px]"
      >
        <div className="relative mb-2 aspect-[2/3] overflow-hidden bg-white">
          <Image
            src={cover}
            alt={book.title}
            fill
            className="object-contain p-1 transition group-hover:scale-[1.02]"
            sizes="180px"
          />
          {showAudibleRibbon && <AudibleRibbon />}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-[#0F1111]">{Number(book.avg_rating).toFixed(1)}</span>
          <StarRating
            rating={Number(book.avg_rating)}
            count={book.review_count}
            size="sm"
            showNumericFirst={false}
            showCount={true}
          />
        </div>
        <ServiceBadges book={book} />
        {formatLabel && (
          <p className="mt-1 text-xs text-[#565959]">{formatLabel}</p>
        )}
        {deal && <DealCountdown endsAt={deal.ends_at} />}
        <div className="mt-1 flex items-start text-[#0F1111]">
          <span className="text-xs">{amazonPrice.symbol}</span>
          <span className="text-xl font-medium leading-none">{amazonPrice.whole}</span>
          <span className="text-xs leading-none">{amazonPrice.fraction}</span>
        </div>
      </Link>
    );
  }

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
        {comparePrice && comparePrice > price && (
          <span className="mr-2 text-xs text-gray-500 line-through">
            {formatPrice(comparePrice)}
          </span>
        )}
        <span className="text-lg font-medium text-[#0F1111]">
          {formatPrice(price)}
        </span>
      </div>
      {book.is_new_release && (
        <p className="mt-1 text-xs text-[#007600]">New Release</p>
      )}
    </Link>
  );
}

function pickFormat(book: BookWithFormats, preferred?: string): BookFormatRow | undefined {
  if (preferred === "print") {
    return book.formats.find((f) => f.format === "paperback") || book.formats.find((f) => f.format === "hardcover");
  }
  if (preferred) {
    return book.formats.find((f) => f.format === preferred);
  }
  return book.formats[0];
}
