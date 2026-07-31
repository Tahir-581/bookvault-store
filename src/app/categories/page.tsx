import Link from "next/link";
import { getCategories } from "@/lib/data/books";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-4">
      <h1 className="mb-6 text-2xl font-bold">Browse Categories</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/books/${cat.slug}`}
            className="rounded-lg bg-white p-6 text-center shadow-sm hover:shadow-md"
          >
            <div className="mb-3 text-4xl">📚</div>
            <h2 className="font-medium">{cat.name}</h2>
            {cat.description && (
              <p className="mt-1 text-sm text-gray-500">{cat.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
