import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import {
  getAnnouncement,
  getFooterConfig,
  getNavMenu,
  getSiteConfig,
} from "@/lib/data/settings";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: {
      default: `${config.name} — ${config.tagline}`,
      template: `%s | ${config.name}`,
    },
    description: config.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [config, announcement, megaMenu, secondaryNav, footer] =
    await Promise.all([
      getSiteConfig(),
      getAnnouncement(),
      getNavMenu("mega_menu"),
      getNavMenu("secondary"),
      getFooterConfig(),
    ]);

  return (
    <html lang="en" className="h-full overflow-x-clip">
      <body className="flex min-h-full flex-col overflow-x-clip antialiased">
        <StoreHeader
          siteName={config.name}
          megaMenu={megaMenu}
          secondaryNav={secondaryNav}
          announcement={announcement}
        />
        <main className="min-w-0 max-w-full flex-1 overflow-x-clip">{children}</main>
        <StoreFooter
          siteName={config.name}
          footer={footer}
          currency={config.currency}
          locale={config.locale}
        />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
