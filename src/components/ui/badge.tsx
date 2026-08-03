import { cn } from "@/lib/utils";

const variants = {
  default: "bg-muted text-foreground",
  deal: "bg-deal text-white",
  prime: "bg-secondary text-secondary-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-accent/20 text-accent-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
