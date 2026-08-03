import { BooksSubNav } from "@/components/store/books-sub-nav";
import { ProductCard } from "@/components/store/product-card";
import { ProductShelf } from "@/components/store/product-shelf";
import { getDeals } from "@/lib/data/books";
import { getBooksSubNav } from "@/lib/data/settings";
import type { BookWithFormats } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const [deals, booksSubNav] = await Promise.all([getDeals(), getBooksSubNav()]);

  const cards = deals
    .map((deal) => {
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
        is_prime_eligible?: boolean;
        is_first_reads?: boolean;
        is_audible_exclusive?: boolean;
        store_book_formats: {
          id: string;
          format: string;
          price: number;
          compare_at_price: number | null;
          stock: number;
          is_active: boolean;
        }[];
      } | null;
      if (!book) return null;
      return {
        deal,
        book: {
          ...book,
          formats: book.store_book_formats?.filter((f) => f.is_active) || [],
        } as unknown as BookWithFormats,
      };
    })
    .filter(Boolean) as {
    deal: (typeof deals)[number];
    book: BookWithFormats;
  }[];

  return (
    <>
      <BooksSubNav items={booksSubNav} deptLabel="books" />
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4">
        <h1 className="mb-1 font-serif text-2xl font-bold text-foreground">
          Explore Deals
        </h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Limited-time offers on print books and audiobooks
        </p>

        {cards.length === 0 ? (
          <p className="text-muted-foreground">
            No active deals right now. Check back soon!
          </p>
        ) : (
          <ProductShelf
            title="Today's Deals"
            seeMoreHref="/books?sort=bestseller"
          >
            {cards.map(({ deal, book }) => (
              <ProductCard
                key={deal.id}
                book={book}
                variant="storefront"
                deal={{
                  deal_price: deal.deal_price,
                  ends_at: deal.ends_at,
                  list_price:
                    book.formats.find((f) => f.compare_at_price)?.compare_at_price ??
                    book.formats[0]?.price,
                }}
              />
            ))}
          </ProductShelf>
        )}
      </div>
    </>
  );
}
