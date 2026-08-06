import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

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
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = clamp01(rating - i);

    return (
      <span
        key={i}
        className={cn("relative inline-block", iconClass)}
        aria-hidden="true"
      >
        <Star className={cn(iconClass, "fill-muted text-muted")} />
        {fill > 0 && (
          <span
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${fill * 100}%` }}
          >
            <Star className={cn(iconClass, "fill-star text-star")} />
          </span>
        )}
      </span>
    );
  });

  if (showNumericFirst) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm text-foreground">{rating.toFixed(1)}</span>
        <div className="flex" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
          {stars}
        </div>
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
      <div className="flex" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {stars}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-link hover:text-link-hover">
          {count.toLocaleString()}
        </span>
      )}
    </div>
  );
}
