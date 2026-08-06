"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Home, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { NavMenuItem } from "@/lib/types";

export function MobileNavDrawer({
  open,
  onClose,
  siteName,
  megaMenu,
  secondaryNav,
  userDisplayName = null,
}: {
  open: boolean;
  onClose: () => void;
  siteName: string;
  megaMenu: NavMenuItem[];
  secondaryNav: NavMenuItem[];
  userDisplayName?: string | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Main menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close menu"
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-[101] flex h-10 w-10 items-center justify-center text-white"
        aria-label="Close"
      >
        <X className="h-7 w-7" />
      </button>

      <aside className="absolute left-0 top-0 flex h-full w-[min(85vw,360px)] flex-col bg-card shadow-xl">
        <div className="bg-header px-4 pb-3 pt-4 text-white">
          <Link
            href="/account"
            onClick={onClose}
            className="mb-3 flex items-center justify-end gap-2 text-sm text-white hover:text-white"
          >
            <span>
              {userDisplayName ? `Hello, ${userDisplayName}` : "Sign in"}
            </span>
            <User className="h-5 w-5" />
          </Link>
          <p className="text-lg">
            Browse <span className="text-2xl font-bold">{siteName}</span>
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-base font-medium text-foreground hover:bg-muted"
          >
            <Home className="h-5 w-5" />
            {siteName} Home
          </Link>

          <div className="border-b border-border py-2">
            <p className="px-4 py-2 text-base font-bold text-foreground">Trending</p>
            <Link
              href="/books?sort=trending"
              onClick={onClose}
              className="block px-4 py-2.5 text-base text-foreground hover:bg-muted"
            >
              Trending Now
            </Link>
            <Link
              href="/books?sort=bestseller"
              onClick={onClose}
              className="block px-4 py-2.5 text-base text-foreground hover:bg-muted"
            >
              Best Sellers
            </Link>
            <Link
              href="/books?sort=newest"
              onClick={onClose}
              className="block px-4 py-2.5 text-base text-foreground hover:bg-muted"
            >
              New Releases
            </Link>
          </div>

          <div className="border-b border-border py-2">
            <p className="px-4 py-2 text-base font-bold text-foreground">Top Departments</p>
            {megaMenu.map((item) => {
              const key = item.href + item.label;
              const hasChildren = Boolean(item.children?.length);
              if (!hasChildren) {
                return (
                  <Link
                    key={key}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-muted"
                  >
                    {item.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              }
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === key ? null : key)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-base text-foreground hover:bg-muted"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition ${
                        expanded === key ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expanded === key &&
                    item.children!.map((child) => (
                      <Link
                        key={child.href + child.label}
                        href={child.href}
                        onClick={onClose}
                        className="block bg-highlight px-8 py-2.5 text-sm text-foreground hover:bg-muted"
                      >
                        {child.label}
                      </Link>
                    ))}
                </div>
              );
            })}
            <Link
              href="/categories"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-muted"
            >
              See all
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>

          <div className="border-b border-border py-2">
            <p className="px-4 py-2 text-base font-bold text-foreground">Programs & Features</p>
            <Link
              href="/deals"
              onClick={onClose}
              className="block px-4 py-2.5 text-base text-foreground hover:bg-muted"
            >
              Today&apos;s Deals
            </Link>
            {secondaryNav.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onClose}
                className="block px-4 py-2.5 text-base text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
}
