import Link from "next/link";
import { BooksSubNav } from "@/components/store/books-sub-nav";
import { getCategories } from "@/lib/data/books";
import { getBooksSubNav } from "@/lib/data/settings";

export default async function CategoriesPage() {
  const [categories, booksSubNav] = await Promise.all([
    getCategories(),
    getBooksSubNav(),
  ]);

  return (
    <>
      <BooksSubNav items={booksSubNav} deptLabel="books" />
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4">
        <h1 className="mb-3 text-xl font-bold text-foreground">Explore categories</h1>
        <ul className="divide-y divide-border border-y border-border">
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/categories/${cat.slug}`}
                className="flex items-center justify-between py-3.5 text-base text-link hover:underline"
              >
                {cat.name}
                <span aria-hidden>›</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
