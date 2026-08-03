import { getSiteConfig } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function MembershipPage() {
  const config = await getSiteConfig();
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("store_memberships")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  const benefits = (membership?.benefits as string[]) || [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{config.membershipName} Membership</h1>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-3xl font-bold">
          {formatPrice(membership?.price_monthly || 8)}/month
        </p>
        <p className="mt-2 text-gray-600">{membership?.description}</p>
        <ul className="mt-4 space-y-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <span className="text-accent">✓</span> {b}
            </li>
          ))}
        </ul>
        <button className="mt-6 w-full rounded bg-accent py-3 font-medium text-accent-foreground hover:bg-accent-hover">
          Start your 30-day free trial
        </button>
      </div>
    </div>
  );
}
