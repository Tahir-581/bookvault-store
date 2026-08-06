import Link from "next/link";
import { StarRating } from "@/components/store/star-rating";
import { Badge } from "@/components/ui/badge";
import { CoverImage } from "@/components/store/cover-image";
import { DealCountdown } from "@/components/store/deal-countdown";
import { getEffectivePrice } from "@/lib/pricing";
import { cn, formatAmazonPrice, formatPrice } from "@/lib/utils";
import type { BookFormatRow, BookWithFormats } from "@/lib/types";

type DealInfo = { deal_price: number; ends_at: string; list_price?: number };

export function ProductCard({
  book,
  variant = "default",
  deal,
  className,
}: {
  book: BookWithFormats;
  variant?: "default" | "storefront";
  deal?: DealInfo;
  className?: string;
}) {
  const formatRow = book.formats[0] as BookFormatRow | undefined;
  const effective = getEffectivePrice(formatRow);
  const comparePrice =
    deal?.list_price ??
    (deal ? formatRow?.price : null) ??
    effective.compareAt;
  const price = deal ? deal.deal_price : effective.displayPrice;
  const cover = book.cover_url || "/placeholder-book.svg";
  const tagLabels = book.tag_labels?.length
    ? book.tag_labels
    : book.tags || [];
  const showCountdown =
    Boolean(deal?.ends_at) || (effective.onSale && Boolean(effective.saleEndsAt));

  if (variant === "storefront") {
    const amazonPrice = formatAmazonPrice(price);
    const discountPct =
      comparePrice && comparePrice > price
        ? Math.round(((comparePrice - price) / comparePrice) * 100)
        : null;

    return (
      <Link
        href={`/dp/${book.slug}`}
        className={cn(
          "group flex w-[178px] shrink-0 flex-col transition-transform duration-300 hover:scale-105 sm:w-[204px]",
          className
        )}
      >
        <div className="relative mb-2 aspect-[2/3] w-full overflow-hidden bg-muted">
          <CoverImage
            src={cover}
            alt={book.title}
            className="object-contain p-0.5 transition-transform duration-300 group-hover:scale-110"
            sizes="204px"
          />
        </div>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug text-foreground group-hover:text-link-hover">
          {book.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {book.author_name}
        </p>
        <div className="mt-1 flex h-5 items-center gap-1">
          <span className="text-sm text-foreground">{Number(book.avg_rating).toFixed(1)}</span>
          <StarRating
            rating={Number(book.avg_rating)}
            count={book.review_count}
            size="sm"
            showNumericFirst={false}
            showCount={true}
          />
        </div>
        {tagLabels.length > 0 && (
          <p className="mt-0.5 line-clamp-1 hidden text-xs text-muted-foreground">
            {tagLabels.join(" · ")}
          </p>
        )}
        {showCountdown ? (
          <DealCountdown endsAt={(deal?.ends_at || effective.saleEndsAt)!} />
        ) : null}
        {discountPct !== null && discountPct > 0 && (
          <p className="mt-0.5 text-sm font-medium text-deal">-{discountPct}%</p>
        )}
        <div className="mt-0.5 flex items-start text-foreground">
          <span className="text-xs">{amazonPrice.symbol}</span>
          <span className="text-xl font-medium leading-none">{amazonPrice.whole}</span>
          {amazonPrice.fraction ? (
            <span className="text-xs leading-none">{amazonPrice.fraction}</span>
          ) : null}
        </div>
        {comparePrice && comparePrice > price && (
          <p className="mt-0.5 text-xs text-muted-foreground line-through">
            {formatPrice(comparePrice)}
          </p>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/dp/${book.slug}`}
      className={cn(
        "group flex h-full flex-col rounded bg-card p-3 transition-transform duration-300 hover:scale-105 hover:shadow-md",
        className
      )}
    >
      <div className="relative mb-3 aspect-[2/3] overflow-hidden bg-muted">
        <CoverImage
          src={cover}
          alt={book.title}
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 20vw"
        />
        {book.is_bestseller && (
          <Badge variant="deal" className="absolute left-2 top-2">
            Best Seller
          </Badge>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm text-foreground group-hover:text-link-hover">
        {book.title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{book.author_name}</p>
      <div className="mt-2">
        <StarRating rating={Number(book.avg_rating)} count={book.review_count} />
      </div>
      <div className="mt-auto pt-2">
        {comparePrice && comparePrice > price && (
          <span className="mr-2 text-xs text-muted-foreground line-through">
            {formatPrice(comparePrice)}
          </span>
        )}
        <span className="text-lg font-medium text-foreground">
          {formatPrice(price)}
        </span>
      </div>
      {book.is_new_release && (
        <p className="mt-1 text-xs text-success">New Release</p>
      )}
    </Link>
  );
}
