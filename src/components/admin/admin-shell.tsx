import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Tag,
  Users,
  FileText,
  Percent,
  Zap,
} from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Catalog", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/deals", label: "Deals", icon: Zap },
  { href: "/admin/content", label: "Content CMS", icon: FileText },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

export async function AdminSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-[#232F3E] text-white">
      <div className="border-b border-gray-600 p-4">
        <Link href="/admin" className="text-lg font-bold">
          BookVault Admin
        </Link>
      </div>
      <nav className="p-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-[#37475A]"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-gray-600 p-4">
        <Link href="/" className="text-sm text-gray-300 hover:text-white">
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
}

export async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  if (!admin) redirect("/auth/login?next=/admin");

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
