"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/store/cart";
import type { NavMenuItem } from "@/lib/types";

export function StoreHeader({
  siteName,
  megaMenu,
  secondaryNav,
  announcement,
}: {
  siteName: string;
  megaMenu: NavMenuItem[];
  secondaryNav: NavMenuItem[];
  announcement?: { text?: string; isActive?: boolean };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deptOpen, setDeptOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-50">
      {announcement?.isActive && announcement.text && (
        <div className="bg-[#232F3E] px-4 py-1.5 text-center text-xs text-white">
          {announcement.text}
        </div>
      )}

      <div className="bg-[#131921] text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-2">
          <Link href="/" className="shrink-0 text-xl font-bold text-white">
            {siteName}
          </Link>

          <button className="hidden items-center gap-1 text-xs hover:outline hover:outline-1 hover:outline-white sm:flex">
            <MapPin className="h-4 w-4" />
            <div className="text-left">
              <div className="text-gray-300">Deliver to</div>
              <div className="font-bold">United Kingdom</div>
            </div>
          </button>

          <form onSubmit={handleSearch} className="flex flex-1">
            <select className="hidden rounded-l-md bg-gray-100 px-2 text-sm text-gray-800 sm:block">
              <option>Books</option>
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search BookVault"
              className="w-full rounded-l-md px-4 py-2 text-sm text-black sm:rounded-none"
            />
            <button
              type="submit"
              className="rounded-r-md bg-[#FF9900] px-4 py-2 hover:bg-[#F08804]"
            >
              <Search className="h-5 w-5 text-black" />
            </button>
          </form>

          <Link
            href="/account"
            className="hidden items-center gap-1 px-2 py-1 text-xs hover:outline hover:outline-1 hover:outline-white sm:flex"
          >
            <User className="h-5 w-5" />
            <div>
              <div className="text-gray-300">Hello, sign in</div>
              <div className="font-bold">Account & Lists</div>
            </div>
          </Link>

          <Link
            href="/account/orders"
            className="hidden px-2 py-1 text-xs hover:outline hover:outline-1 hover:outline-white md:block"
          >
            <div className="text-gray-300">Returns</div>
            <div className="font-bold">& Orders</div>
          </Link>

          <Link
            href="/cart"
            className="relative flex items-end gap-1 px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
          >
            <ShoppingCart className="h-8 w-8" />
            <span className="absolute left-5 top-0 rounded-full bg-[#FF9900] px-1.5 text-xs font-bold text-black">
              {totalItems}
            </span>
            <span className="hidden font-bold sm:inline">Cart</span>
          </Link>
        </div>

        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 pb-2 text-sm">
          <div className="relative">
            <button
              onClick={() => setDeptOpen(!deptOpen)}
              className="flex items-center gap-1 px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
            >
              <Menu className="h-5 w-5" />
              All
              <ChevronDown className="h-4 w-4" />
            </button>
            {deptOpen && (
              <div className="absolute left-0 top-full z-50 min-w-[280px] rounded border bg-white py-2 text-black shadow-lg">
                {megaMenu.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-4 py-2 font-medium hover:bg-gray-100"
                      onClick={() => setDeptOpen(false)}
                    >
                      {item.label}
                    </Link>
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-8 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                        onClick={() => setDeptOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
