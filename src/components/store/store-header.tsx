"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState } from "react";
import { IlfaazMark } from "@/components/store/ilfaaz-mark";
import { MobileNavDrawer } from "@/components/store/mobile-nav-drawer";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 overflow-x-hidden">
        {announcement?.isActive && announcement.text && (
          <div className="bg-secondary px-4 py-1.5 text-center text-xs text-secondary-foreground">
            {announcement.text}
          </div>
        )}

        <div className="bg-header text-white">
          {/* Mobile top bar: hamburger | logo | sign in | cart */}
          <div className="flex items-center gap-2 px-3 py-2 sm:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-white"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center justify-center gap-2 text-white hover:text-white"
            >
              <IlfaazMark className="-ml-1.5 h-10 w-auto shrink-0" />
              <span className="truncate text-2xl font-bold">{siteName}</span>
            </Link>
            <Link
              href="/account"
              className="flex shrink-0 items-center gap-0.5 px-1 py-1 text-xs text-white hover:text-white"
              aria-label="Sign in"
            >
              <span className="whitespace-nowrap">Sign in</span>
              <User className="h-5 w-5" />
            </Link>
            <Link
              href="/cart"
              className="relative flex shrink-0 items-center px-1 py-1"
              aria-label="Cart"
            >
              <ShoppingCart className="h-7 w-7" />
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-accent px-1.5 text-[11px] font-bold leading-4 text-accent-foreground">
                {totalItems}
              </span>
            </Link>
          </div>

          {/* Mobile search row */}
          <form onSubmit={handleSearch} className="flex px-2 pb-2 sm:hidden">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Books"
              className="min-w-0 flex-1 rounded-l-sm border-0 bg-white px-3 py-2.5 text-sm text-black outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-r-sm bg-accent px-3.5 py-2.5 hover:bg-accent-hover"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-accent-foreground" />
            </button>
          </form>

          {/* Mobile deliver-to strip */}
          <div className="flex w-full items-center gap-1 bg-[#232f3e] px-3 py-2.5 text-xs text-gray-200 sm:hidden">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>Deliver to Pakistan</span>
          </div>

          {/* Desktop / tablet header */}
          <div className="mx-auto hidden min-w-0 max-w-[1500px] items-center gap-3 px-4 py-2 sm:flex">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex shrink-0 items-center gap-1 px-2 py-1 text-white hover:outline hover:outline-1 hover:outline-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/"
              className="flex max-w-[28vw] shrink-0 items-center gap-2 text-white hover:text-white sm:max-w-none"
            >
              <IlfaazMark className="-ml-1.5 h-11 w-auto shrink-0" />
              <span className="truncate text-xl font-bold">{siteName}</span>
            </Link>

            <button
              type="button"
              className="hidden shrink-0 items-center gap-1 text-xs hover:outline hover:outline-1 hover:outline-white md:flex"
            >
              <MapPin className="h-4 w-4" />
              <div className="text-left">
                <div className="text-gray-300">Deliver to</div>
                <div className="font-bold">Pakistan</div>
              </div>
            </button>

            <form onSubmit={handleSearch} className="flex min-w-0 flex-1">
              <select className="hidden shrink-0 rounded-l-md bg-gray-100 px-2 text-sm text-gray-800 md:block">
                <option>Books</option>
              </select>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 rounded-l-md px-2 py-2 text-sm text-white placeholder:text-gray-400 md:rounded-none md:px-4"
              />
              <button
                type="submit"
                className="shrink-0 rounded-r-md bg-accent px-4 py-2 hover:bg-accent-hover"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-accent-foreground" />
              </button>
            </form>

            <Link
              href="/account"
              className="hidden shrink-0 items-center gap-1 px-2 py-1 text-xs text-white hover:text-white hover:outline hover:outline-1 hover:outline-white md:flex"
            >
              <User className="h-5 w-5" />
              <div>
                <div className="text-gray-300">Hello, sign in</div>
                <div className="font-bold">Account & Lists</div>
              </div>
            </Link>

            <Link
              href="/account/orders"
              className="hidden shrink-0 px-2 py-1 text-xs text-white hover:text-white hover:outline hover:outline-1 hover:outline-white lg:block"
            >
              <div className="text-gray-300">Returns</div>
              <div className="font-bold">& Orders</div>
            </Link>

            <Link
              href="/cart"
              className="relative flex shrink-0 items-end gap-1 px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
              aria-label="Cart"
            >
              <ShoppingCart className="h-8 w-8" />
              <span className="absolute left-5 top-0 rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
                {totalItems}
              </span>
              <span className="hidden font-bold md:inline">Cart</span>
            </Link>
          </div>

          {/* Desktop secondary nav */}
          <div className="mx-auto hidden min-w-0 max-w-[1500px] items-center gap-4 overflow-x-auto bg-[#232f3e] px-4 pb-2 text-sm sm:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap px-2 py-1 text-white hover:outline hover:outline-1 hover:outline-white"
            >
              <Menu className="h-5 w-5" />
              All
            </button>
            {secondaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap px-2 py-1 text-white hover:text-white hover:outline hover:outline-1 hover:outline-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        siteName={siteName}
        megaMenu={megaMenu}
        secondaryNav={secondaryNav}
      />
    </>
  );
}
