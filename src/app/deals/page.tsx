import { ProductCard } from "@/components/store/product-card";
import { getDeals } from "@/lib/data/books";
import type { BookWithFormats } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const deals = await getDeals();

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <h1 className="mb-6 text-2xl font-bold">Today&apos;s Deals</h1>
      {deals.length === 0 ? (
        <p className="text-gray-600">No active deals right now. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {deals.map((deal) => {
            const book = deal.store_books as {
              id: string;
              title: string;
              slug: string;
              author_name: string;
              cover_url: string | null;
              avg_rating: number;
              review_count: number;
              is_bestseller: boolean;
              is_new_release: boolean;
              store_book_formats: { id: string; format: string; price: number; compare_at_price: number | null; stock: number; is_active: boolean }[];
            };
            if (!book) return null;
            return (
              <div key={deal.id} className="relative">
                <ProductCard
                  book={{
                    ...book,
                    formats: book.store_book_formats?.filter((f) => f.is_active) || [],
                  } as unknown as BookWithFormats}
                />
                <div className="absolute right-3 top-3 rounded bg-[#CC0C39] px-2 py-1 text-xs font-bold text-white">
                  Deal: {formatPrice(deal.deal_price)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
