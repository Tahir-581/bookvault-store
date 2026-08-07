import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getUser } from "@/lib/auth";
import { getSiteConfig } from "@/lib/data/settings";

export default async function CheckoutPage() {
  const [user, config] = await Promise.all([getUser(), getSiteConfig()]);

  return (
    <CheckoutClient
      initialEmail={user?.email || ""}
      standardShipping={config.standardShipping}
      freeShippingThreshold={config.freeShippingThreshold}
      taxRate={config.taxRate}
    />
  );
}
