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
      ],
    },
    {
      title: "Payment",
      links: [{ label: "Payment Methods", href: "/pages/payment" }],
    },
  ];

  const cols = footer?.columns?.length ? footer.columns : defaultColumns;
  const subsidiaries = footer?.subsidiaries || [];
  const legalLinks = footer?.legalLinks || [];
  const copyright = footer?.copyright || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  const currencyLabel =
    currency === "GBP" ? "£ GBP - Pounds" : currency;
  const regionLabel = locale === "en-GB" ? "United Kingdom" : locale;

  return (
    <footer className="mt-auto bg-[#232F3E] text-white">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-full bg-[#37475A] py-3 text-center text-sm hover:bg-[#485769]"
      >
        Back to top
      </button>

      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 font-bold">{col.title}</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="hover:underline hover:text-white">
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
          <Link href="/" className="text-xl font-bold text-white">
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

      {subsidiaries.length > 0 && (
        <div className="border-t border-gray-600 py-8">
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

      <div className="border-t border-gray-600 py-6 text-center text-sm text-gray-400">
        {legalLinks.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-4">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline hover:text-white">
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
