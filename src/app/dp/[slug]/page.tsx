import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookDetailClient } from "@/components/store/book-detail-client";
import { SITE_TAB_TITLE } from "@/lib/constants";
import {
  getBookBySlug,
  getBookReviews,
  getRelatedBooks,
} from "@/lib/data/books";
import type { BookWithFormats } from "@/lib/types";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const categoryIds = book.categories?.map((c) => c.id) || [];
  const [reviews, related] = await Promise.all([
    getBookReviews(book.id),
    getRelatedBooks(book.id, categoryIds),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author_name },
    image: book.cover_url,
    description: book.description,
    isbn: book.isbn,
    aggregateRating: book.review_count > 0 ? {
      "@type": "AggregateRating",
      ratingValue: book.avg_rating,
      reviewCount: book.review_count,
    } : undefined,
    offers: book.formats.map((f) => ({
      "@type": "Offer",
      price: f.price,
      priceCurrency: "PKR",
      availability: f.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookDetailClient
        book={book as unknown as BookWithFormats & { images?: { url: string; alt: string | null }[]; categories?: { id: string; name: string; slug: string }[] }}
        reviews={reviews}
        related={related}
      />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: { absolute: SITE_TAB_TITLE } };
  return {
    title: { absolute: SITE_TAB_TITLE },
    description: book.seo_description || book.description?.slice(0, 160),
    openGraph: {
      title: book.title,
      description: book.description?.slice(0, 160) || undefined,
      images: book.cover_url ? [book.cover_url] : undefined,
    },
  };
}
