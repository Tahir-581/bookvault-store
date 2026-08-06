import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";
import { getUser } from "@/lib/auth";
import { SITE_TAB_TITLE } from "@/lib/constants";
import {
  getAnnouncement,
  getFooterConfig,
  getNavMenu,
  getSiteConfig,
} from "@/lib/data/settings";
import "./globals.css";

function accountDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata || {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";
  if (fromMeta) return fromMeta.split(" ")[0]!;
  const email = user.email || "";
  return email.includes("@") ? email.split("@")[0]! : email || "there";
}

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
  const [config, announcement, megaMenu, secondaryNav, footer, user] =
    await Promise.all([
      getSiteConfig(),
      getAnnouncement(),
      getNavMenu("mega_menu"),
      getNavMenu("secondary"),
      getFooterConfig(),
      getUser(),
    ]);

  const userDisplayName = user ? accountDisplayName(user) : null;

  return (
    <html lang="en" className="h-full overflow-x-clip">
      <body className="flex min-h-full flex-col overflow-x-clip antialiased">
        <StoreHeader
          siteName={config.name}
          megaMenu={megaMenu}
          secondaryNav={secondaryNav}
          announcement={announcement}
          userDisplayName={userDisplayName}
        />
        <main className="min-w-0 max-w-full flex-1 overflow-x-clip">{children}</main>
        <StoreFooter siteName={config.name} footer={footer} />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
