import Link from "next/link";

export function StoreFooter({
  siteName,
  columns,
}: {
  siteName: string;
  columns?: { title: string; links: { label: string; href: string }[] }[];
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

  const cols = columns?.length ? columns : defaultColumns;

  return (
    <footer className="mt-auto bg-[#232F3E] text-white">
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 font-bold">{col.title}</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-600 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  );
}
