import type { BookWithFormats } from "@/lib/types";

export function ServiceBadges({ book }: { book: BookWithFormats }) {
  const badges: { label: string; className: string }[] = [];

  if (book.is_kindle_unlimited) {
    badges.push({
      label: "kindle unlimited",
      className: "text-[10px] font-bold text-[#0F1111]",
    });
  }
  if (book.is_prime_eligible) {
    badges.push({
      label: "prime",
      className: "text-[10px] font-bold text-[#007185]",
    });
  }
  if (book.is_first_reads) {
    badges.push({
      label: "first reads",
      className: "text-[10px] text-[#0F1111]",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {badges.map((b) => (
        <span key={b.label} className={b.className}>{b.label}</span>
      ))}
    </div>
  );
}

export function AudibleRibbon() {
  return (
    <div className="absolute bottom-0 right-0 bg-[#F7CA00] px-1 py-0.5 text-[8px] font-bold leading-tight text-[#0F1111]">
      ONLY FROM
      <br />
      audible
    </div>
  );
}
