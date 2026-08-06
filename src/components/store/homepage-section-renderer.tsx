import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { ProductShelf } from "@/components/store/product-shelf";
import {
  resolveSectionBooks,
  resolveSectionDeals,
  getCategoriesForHomepageShelves,
} from "@/lib/data/books";
import type { HomepageSection, HomepageSectionConfig } from "@/lib/types";

export async function HomepageSectionRenderer({
  sections,
  membershipName,
}: {
  sections: HomepageSection[];
  membershipName?: string;
}) {
  return (
    <>
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          membershipName={membershipName}
        />
      ))}
    </>
  );
}

async function SectionBlock({
  section,
  membershipName,
}: {
  section: HomepageSection;
  membershipName?: string;
}) {
  const config = section.config || {};

  switch (section.section_type) {
    case "filter_pills":
      return null;

    case "category_tiles":
      return null;

    case "category_shelves": {
      const limit = config.limit ?? 12;
      const shelves = await getCategoriesForHomepageShelves(limit);

      return (
        <>
          {shelves.map(({ category, books }) => (
            <BookRowShelf
              key={category.id}
              title={category.name}
              seeMoreHref={`/categories/${category.slug}`}
              books={books}
            />
          ))}
        </>
      );
    }

    case "editorial":
      const cta = config.cta;
      return (
        <section className="mb-6 rounded-lg bg-secondary p-8 text-center text-secondary-foreground">
          <h2 className="text-2xl font-bold">{section.title || "Why ilfaaz?"}</h2>
          {section.subtitle && (
            <p className="mt-2 text-gray-300">{section.subtitle}</p>
          )}
          {cta && (
            <Link
              href={cta.href}
              className="mt-4 inline-block rounded bg-accent px-6 py-2 font-medium text-accent-foreground hover:bg-accent-hover"
            >
              {cta.label}
            </Link>
          )}
          {membershipName && !cta && (
            <Link
              href="/account/membership"
              className="mt-4 inline-block rounded bg-accent px-6 py-2 font-medium text-accent-foreground hover:bg-accent-hover"
            >
              Try {membershipName} free for 30 days
            </Link>
          )}
        </section>
      );

    case "carousel":
      const deals = await resolveSectionDeals(config);
      if (deals.length === 0) {
        const books = await resolveSectionBooks(config);
        return (
          <BookRowShelf
            title={section.title || "Today's Deals"}
            seeMoreHref={config.see_more_href || "/deals"}
            books={books}
          />
        );
      }
      return (
        <ProductShelf
          title={section.title || "Today's Deals"}
          seeMoreHref={config.see_more_href || "/deals"}
        >
          {deals.map((deal) => (
            <ProductCard
              key={deal.id}
              book={deal.book}
              variant="storefront"
              deal={{ deal_price: deal.deal_price, ends_at: deal.ends_at }}
            />
          ))}
        </ProductShelf>
      );

    case "book_row":
    default:
      const books = await resolveSectionBooks(config);
      return (
        <BookRowShelf
          title={section.title || "Books"}
          seeMoreHref={config.see_more_href}
          books={books}
        />
      );
  }
}

function BookRowShelf({
  title,
  seeMoreHref,
  books,
}: {
  title: string;
  seeMoreHref?: string;
  books: Awaited<ReturnType<typeof resolveSectionBooks>>;
  config?: HomepageSectionConfig;
}) {
  if (books.length === 0) return null;

  return (
    <ProductShelf title={title} seeMoreHref={seeMoreHref}>
      {books.map((book) => (
        <ProductCard key={book.id} book={book} variant="storefront" />
      ))}
    </ProductShelf>
  );
}
