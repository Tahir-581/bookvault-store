import { BooksSubNav } from "@/components/store/books-sub-nav";
import { ProductCard } from "@/components/store/product-card";
import { ProductShelf } from "@/components/store/product-shelf";
import { getActiveDealsWithBooks } from "@/lib/data/books";
import { getBooksSubNav } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const [deals, booksSubNav] = await Promise.all([
    getActiveDealsWithBooks(48),
    getBooksSubNav(),
  ]);

  return (
    <>
      <BooksSubNav items={booksSubNav} deptLabel="books" />
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4">
        <h1 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Explore Deals
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Limited-time offers on books
        </p>

        {deals.length === 0 ? (
          <p className="text-muted-foreground">
            No active deals right now. Check back soon!
          </p>
        ) : (
          <ProductShelf
            title="Today's Deals"
            seeMoreHref="/books?sort=bestseller"
          >
            {deals.map((deal) => (
              <ProductCard
                key={deal.id}
                book={deal.book}
                variant="storefront"
                deal={{
                  deal_price: deal.deal_price,
                  ends_at: deal.ends_at,
                  list_price:
                    deal.book.formats.find((f) => f.id === deal.format_id)?.price ??
                    deal.book.formats[0]?.price,
                }}
              />
            ))}
          </ProductShelf>
        )}
      </div>
    </>
  );
}
