import { AdminCategoriesManager } from "@/components/admin/admin-categories-manager";
import { getCategories } from "@/lib/data/books";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  return <AdminCategoriesManager categories={categories} />;
}
