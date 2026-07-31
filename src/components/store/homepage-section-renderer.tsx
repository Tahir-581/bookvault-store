import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ProductCard } from "@/components/store/product-card";
import { ProductShelf } from "@/components/store/product-shelf";
import { FormatFilterPills } from "@/components/store/format-filter-pills";
import {
  resolveSectionBooks,
  resolveSectionDeals,
  getCategories,
} from "@/lib/data/books";
import type { HomepageSection, HomepageSectionConfig } from "@/lib/types";

const DEFAULT_PILLS = [
  { label: "Kindle eBooks", href: "/books?format=ebook" },
  { label: "Print Books", href: "/books?format=print" },
  { label: "Audible Audiobooks", href: "/books?format=audiobook" },
];

export async function HomepageSectionRenderer({
  sections,
  membershipName,
}: {
  sections: HomepageSection[];
  membershipName?: string;
}) {
  const categories = await getCategories();

  return (
    <>
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          categories={categories}
          membershipName={membershipName}
        />
      ))}
    </>
  );
}

async function SectionBlock({
  section,
  categories,
  membershipName,
}: {
  section: HomepageSection;
  categories: Awaited<ReturnType<typeof getCategories>>;
  membershipName?: string;
}) {
  const config = section.config || {};

  switch (section.section_type) {
    case "filter_pills":
      return (
        <Suspense fallback={null}>
          <FormatFilterPills
            title={section.title || "Filter by"}
            pills={config.pills || DEFAULT_PILLS}
          />
        </Suspense>
      );

    case "category_tiles":
      return (
        <section className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#0F1111]">
            {section.title || "Shop by Category"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/books/${cat.slug}`}
                className="rounded border border-gray-200 p-4 text-center hover:shadow-md"
              >
                {cat.image_url ? (
                  <div className="relative mx-auto mb-2 h-16 w-16">
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="mb-2 text-3xl">📚</div>
                )}
                <span className="text-sm font-medium text-[#0F1111]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      );

    case "editorial":
      const cta = config.cta;
      return (
        <section className="mb-8 rounded-lg bg-[#232F3E] p-8 text-center text-white">
          <h2 className="text-2xl font-bold">{section.title || "Why BookVault?"}</h2>
          {section.subtitle && (
            <p className="mt-2 text-gray-300">{section.subtitle}</p>
          )}
          {cta && (
            <Link
              href={cta.href}
              className="mt-4 inline-block rounded bg-[#FF9900] px-6 py-2 font-medium text-black hover:bg-[#F08804]"
            >
              {cta.label}
            </Link>
          )}
          {membershipName && !cta && (
            <Link
              href="/account/membership"
              className="mt-4 inline-block rounded bg-[#FF9900] px-6 py-2 font-medium text-black hover:bg-[#F08804]"
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
            config={config}
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
              preferredFormat={config.format}
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
          config={config}
        />
      );
  }
}

function BookRowShelf({
  title,
  seeMoreHref,
  books,
  config,
}: {
  title: string;
  seeMoreHref?: string;
  books: Awaited<ReturnType<typeof resolveSectionBooks>>;
  config: HomepageSectionConfig;
}) {
  if (books.length === 0) return null;

  return (
    <ProductShelf title={title} seeMoreHref={seeMoreHref}>
      {books.map((book) => (
        <ProductCard
          key={book.id}
          book={book}
          variant="storefront"
          preferredFormat={config.format}
        />
      ))}
    </ProductShelf>
  );
}
