import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/store/product-card";
import { getFeaturedBooks, getNewReleases, getCategories } from "@/lib/data/books";
import { getSiteConfig } from "@/lib/data/settings";

export default async function HomePage() {
  const [config, featured, newReleases, categories] = await Promise.all([
    getSiteConfig(),
    getFeaturedBooks(8),
    getNewReleases(8),
    getCategories(),
  ]);

  const carouselSlides = [
    {
      title: "Spring Reading Sale",
      subtitle: "Up to 40% off bestsellers",
      image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&q=80",
      href: "/deals",
    },
    {
      title: "New Releases",
      subtitle: "Discover this week's top books",
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80",
      href: "/books?sort=newest",
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <div className="relative mb-6 h-[280px] overflow-hidden rounded-lg md:h-[350px]">
        <Image
          src={carouselSlides[0].image}
          alt={carouselSlides[0].title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-8 text-white">
          <h1 className="text-3xl font-bold md:text-4xl">{carouselSlides[0].title}</h1>
          <p className="mt-2 text-lg">{carouselSlides[0].subtitle}</p>
          <Link
            href={carouselSlides[0].href}
            className="mt-4 inline-block rounded bg-[#FFD814] px-6 py-2 font-medium text-black hover:bg-[#F7CA00]"
          >
            Shop now
          </Link>
        </div>
      </div>

      {categories.length > 0 && (
        <section className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-[#0F1111]">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/books/${cat.slug}`}
                className="rounded border border-gray-200 p-4 text-center hover:shadow-md"
              >
                <div className="mb-2 text-3xl">📚</div>
                <span className="text-sm font-medium text-[#0F1111]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0F1111]">Best Sellers in Books</h2>
          <Link href="/books?sort=bestseller" className="text-sm text-[#007185] hover:text-[#C7511F]">
            See more
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {featured.map((book) => (
            <ProductCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0F1111]">New Releases</h2>
          <Link href="/books?sort=newest" className="text-sm text-[#007185] hover:text-[#C7511F]">
            See more
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {newReleases.map((book) => (
            <ProductCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-[#232F3E] p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Join {config.membershipName}</h2>
        <p className="mt-2 text-gray-300">
          Free fast delivery on millions of books. Cancel anytime.
        </p>
        <Link
          href="/account/membership"
          className="mt-4 inline-block rounded bg-[#FF9900] px-6 py-2 font-medium text-black hover:bg-[#F08804]"
        >
          Try {config.membershipName} free for 30 days
        </Link>
      </section>
    </div>
  );
}
