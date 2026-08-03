import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = "sm",
  showCount = true,
  showNumericFirst = false,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  showCount?: boolean;
  showNumericFirst?: boolean;
}) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    const half = !filled && rating >= i + 0.5;
    return (
      <Star
        key={i}
        className={cn(
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          filled || half ? "fill-star text-star" : "fill-muted text-muted"
        )}
      />
    );
  });

  if (showNumericFirst) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm text-foreground">{rating.toFixed(1)}</span>
        <div className="flex">{stars}</div>
        {showCount && count !== undefined && (
          <span className="text-xs text-link hover:text-link-hover">
            {count.toLocaleString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {showCount && count !== undefined && (
        <span className="text-xs text-link hover:text-link-hover">
          {count.toLocaleString()}
        </span>
      )}
    </div>
  );
}
