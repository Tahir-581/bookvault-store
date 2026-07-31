import { redirect } from "next/navigation";
import { getCategoryBySlug } from "@/lib/data/books";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) redirect("/books");

  const sp = await searchParams;
  const query = new URLSearchParams({ ...sp, category: slug });
  redirect(`/books?${query.toString()}`);
}
