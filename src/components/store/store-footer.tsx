"use client";

import Link from "next/link";
import type { FooterConfig } from "@/lib/types";

export function StoreFooter({
  siteName,
  footer,
  currency = "GBP",
  locale = "en-GB",
}: {
  siteName: string;
  footer?: FooterConfig;
  currency?: string;
  locale?: string;
}) {
  const defaultColumns = [
    {
      title: "Get to Know Us",
      links: [
        { label: "About Us", href: "/pages/about" },
        { label: "Careers", href: "/pages/careers" },
      ],
    },
    {
      title: "Let Us Help You",
      links: [
        { label: "Help", href: "/pages/help" },
        { label: "Returns", href: "/pages/returns" },
        { label: "Your Orders", href: "/account/orders" },
        { label: "Your Account", href: "/account" },
      ],
    },
  ];

  const cols = footer?.columns?.length ? footer.columns : defaultColumns;
  const flatLinks = cols.flatMap((col) => col.links);
  const mid = Math.ceil(flatLinks.length / 2);
  const leftLinks = flatLinks.slice(0, mid);
  const rightLinks = flatLinks.slice(mid);

  const subsidiaries = footer?.subsidiaries || [];
  const legalLinks = footer?.legalLinks || [
    { label: "Conditions of Use", href: "/pages/terms" },
    { label: "Privacy Notice", href: "/pages/privacy" },
    { label: "Cookies Notice", href: "/pages/cookies" },
  ];
  const copyright =
    footer?.copyright ||
    `© ${new Date().getFullYear()}, ${siteName} or its affiliates.`;

  const currencyLabel =
    currency === "GBP" ? "£ GBP - British Pound" : currency;
  const regionLabel = locale === "en-GB" ? "United Kingdom" : locale;

  return (
    <footer className="mt-auto text-white">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex w-full flex-col items-center bg-footer-top py-3 text-center text-xs font-medium uppercase tracking-wide text-white hover:brightness-110"
      >
        <span className="mb-0.5 text-[10px] leading-none">▲</span>
        Top of page
      </button>

      {/* Mobile: two-column flat links (Amazon style) */}
      <div className="bg-secondary px-6 py-8 md:hidden">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <ul className="space-y-3">
            {leftLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="space-y-3">
            {rightLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link href={link.href} className="text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="rounded border border-gray-500 px-3 py-1 text-gray-200">
            {currencyLabel}
          </span>
          <span className="rounded border border-gray-500 px-3 py-1 text-gray-200">
            {regionLabel}
          </span>
        </div>

        <p className="mt-6 text-center text-sm text-white">
          Already a customer?{" "}
          <Link href="/account" className="font-bold text-white underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Desktop: titled columns */}
      <div className="hidden bg-secondary md:block">
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 font-bold text-white">{col.title}</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-gray-300 hover:underline hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-600 py-6">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-center gap-6 px-4">
            <Link href="/" className="text-xl font-bold text-white hover:text-white">
              {siteName}
            </Link>
            <div className="flex gap-3 text-sm">
              <span className="rounded border border-gray-500 px-3 py-1 text-gray-300">
                {currencyLabel}
              </span>
              <span className="rounded border border-gray-500 px-3 py-1 text-gray-300">
                {regionLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {subsidiaries.length > 0 && (
        <div className="border-t border-gray-700 bg-secondary py-8">
          <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-6 px-4 md:grid-cols-3 lg:grid-cols-6">
            {subsidiaries.map((sub) => (
              <Link
                key={sub.href + sub.label}
                href={sub.href}
                className="text-center hover:underline"
              >
                <p className="text-sm font-medium text-white">{sub.label}</p>
                <p className="text-xs text-gray-400">{sub.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-footer-legal py-6 text-center text-xs text-gray-400">
        {legalLinks.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-400 hover:underline hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
        <p>{copyright}</p>
      </div>
    </footer>
  );
}
