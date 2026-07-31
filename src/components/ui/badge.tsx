import { cn } from "@/lib/utils";

const variants = {
  default: "bg-gray-100 text-gray-800",
  deal: "bg-[#CC0C39] text-white",
  prime: "bg-[#232F3E] text-white",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
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
