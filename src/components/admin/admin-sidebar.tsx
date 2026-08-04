"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Tags,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  Percent,
  Settings,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/books", label: "Catalog", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/coupons", label: "Coupons", icon: Percent },
  { href: "/admin/deals", label: "Deals", icon: Zap },
  { href: "/admin/content", label: "Content CMS", icon: FileText },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-svh shrink-0 flex-col overflow-hidden border-r border-border bg-secondary text-secondary-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-gray-600",
          collapsed ? "justify-center p-2" : "justify-between gap-2 p-4",
        )}
      >
        {!collapsed && (
          <Link href="/admin" className="truncate text-lg font-bold">
            Ilfaaz Admin
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded p-1.5 hover:bg-nav-hover"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center rounded py-2 text-sm hover:bg-nav-hover",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div
        className={cn(
          "border-t border-gray-600",
          collapsed ? "flex justify-center p-2" : "p-4",
        )}
      >
        <Link
          href="/"
          aria-label="Back to Store"
          title={collapsed ? "Back to Store" : undefined}
          className={cn(
            "text-sm text-gray-300 hover:text-white",
            collapsed && "rounded p-1.5 hover:bg-nav-hover",
          )}
        >
          {collapsed ? <ArrowLeft className="h-4 w-4" /> : "← Back to Store"}
        </Link>
      </div>
    </aside>
  );
}
