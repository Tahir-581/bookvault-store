import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  if (!admin) redirect("/auth/login?next=/admin");

  return (
    <div className="flex min-h-screen items-start bg-gray-100">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
