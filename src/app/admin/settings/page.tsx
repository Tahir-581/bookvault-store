import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { getAnnouncement, getSiteConfig } from "@/lib/data/settings";

export default async function AdminSettingsPage() {
  const [siteConfig, announcement] = await Promise.all([
    getSiteConfig(),
    getAnnouncement(),
  ]);

  return <AdminSettingsForm siteConfig={siteConfig} announcement={announcement} />;
}
