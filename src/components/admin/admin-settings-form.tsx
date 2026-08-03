"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateSiteSettingAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteConfig } from "@/lib/types";

export function AdminSettingsForm({
  siteConfig,
  announcement,
}: {
  siteConfig: SiteConfig;
  announcement: { text?: string; isActive?: boolean };
}) {
  const [pending, startTransition] = useTransition();

  function saveSite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const freeShippingThreshold = Number(fd.get("freeShippingThreshold"));
    const standardShipping = Number(fd.get("standardShipping"));
    const expressShipping = Number(fd.get("expressShipping"));

    for (const [label, value, raw] of [
      ["Free shipping threshold", freeShippingThreshold, fd.get("freeShippingThreshold")],
      ["Standard shipping", standardShipping, fd.get("standardShipping")],
      ["Express shipping", expressShipping, fd.get("expressShipping")],
    ] as const) {
      const rawStr = String(raw ?? "").trim();
      if (!rawStr || /[.,]/.test(rawStr) || !Number.isInteger(value) || value < 0) {
        toast.error(`${label} must be a whole number (no decimals)`);
        return;
      }
    }

    const config: SiteConfig = {
      ...siteConfig,
      name: fd.get("name") as string,
      tagline: fd.get("tagline") as string,
      primaryColor: fd.get("primaryColor") as string,
      secondaryColor: fd.get("secondaryColor") as string,
      membershipName: fd.get("membershipName") as string,
      freeShippingThreshold,
      taxRate: Number(fd.get("taxRate")),
      standardShipping,
      expressShipping,
      guestCheckout: fd.get("guestCheckout") === "on",
      reviewsEnabled: fd.get("reviewsEnabled") === "on",
      wishlistsEnabled: fd.get("wishlistsEnabled") === "on",
      membershipEnabled: fd.get("membershipEnabled") === "on",
      currency: siteConfig.currency,
      locale: siteConfig.locale,
    };
    startTransition(async () => {
      const result = await updateSiteSettingAction("site", config as unknown as Record<string, unknown>);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      await updateSiteSettingAction("announcement", {
        text: fd.get("announcementText") as string,
        isActive: fd.get("announcementActive") === "on",
      });
      toast.success("Settings saved");
    });
  }

  return (
    <form onSubmit={saveSite} className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Site Settings</h1>

      <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-bold">Branding</h2>
        <div>
          <Label>Store Name</Label>
          <Input name="name" defaultValue={siteConfig.name} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input name="tagline" defaultValue={siteConfig.tagline} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Primary Color</Label>
            <Input name="primaryColor" type="color" defaultValue={siteConfig.primaryColor} />
          </div>
          <div>
            <Label>Secondary Color</Label>
            <Input name="secondaryColor" type="color" defaultValue={siteConfig.secondaryColor} />
          </div>
        </div>
        <div>
          <Label>Membership Name</Label>
          <Input name="membershipName" defaultValue={siteConfig.membershipName} />
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-bold">Commerce</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tax Rate (0.20 = 20%)</Label>
            <Input name="taxRate" type="number" step="0.01" defaultValue={siteConfig.taxRate} />
          </div>
          <div>
            <Label>Free Shipping Threshold (PKR)</Label>
            <Input
              name="freeShippingThreshold"
              type="number"
              step="1"
              inputMode="numeric"
              defaultValue={siteConfig.freeShippingThreshold}
            />
          </div>
          <div>
            <Label>Standard Shipping (PKR)</Label>
            <Input
              name="standardShipping"
              type="number"
              step="1"
              inputMode="numeric"
              defaultValue={siteConfig.standardShipping}
            />
          </div>
          <div>
            <Label>Express Shipping (PKR)</Label>
            <Input
              name="expressShipping"
              type="number"
              step="1"
              inputMode="numeric"
              defaultValue={siteConfig.expressShipping}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-bold">Feature Flags</h2>
        {[
          ["guestCheckout", "Guest Checkout", siteConfig.guestCheckout],
          ["reviewsEnabled", "Reviews", siteConfig.reviewsEnabled],
          ["wishlistsEnabled", "Wishlists", siteConfig.wishlistsEnabled],
          ["membershipEnabled", "Membership Program", siteConfig.membershipEnabled],
        ].map(([name, label, checked]) => (
          <label key={name as string} className="flex items-center gap-2">
            <input type="checkbox" name={name as string} defaultChecked={checked as boolean} />
            {label as string}
          </label>
        ))}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-bold">Announcement Bar</h2>
        <div>
          <Label>Text</Label>
          <Input name="announcementText" defaultValue={announcement.text} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="announcementActive" defaultChecked={announcement.isActive} />
          Show announcement bar
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
