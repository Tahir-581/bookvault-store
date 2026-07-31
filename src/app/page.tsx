import { BooksSubNav } from "@/components/store/books-sub-nav";
import { HomepageSectionRenderer } from "@/components/store/homepage-section-renderer";
import { getHomepageSections, getBooksSubNav, getSiteConfig } from "@/lib/data/settings";

export default async function HomePage() {
  const [config, sections, booksSubNav] = await Promise.all([
    getSiteConfig(),
    getHomepageSections(),
    getBooksSubNav(),
  ]);

  return (
    <>
      <BooksSubNav items={booksSubNav} deptLabel="books" />
      <div className="mx-auto max-w-[1500px] bg-white px-4 py-4">
        <HomepageSectionRenderer
          sections={sections as import("@/lib/types").HomepageSection[]}
          membershipName={config.membershipName}
        />
      </div>
    </>
  );
}
