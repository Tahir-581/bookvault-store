import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import { SITE_TAB_TITLE } from "@/lib/constants";
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
      default: SITE_TAB_TITLE,
      template: `%s | ${SITE_TAB_TITLE}`,
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
        <StoreFooter siteName={config.name} footer={footer} />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
