import { createClient } from "@/lib/supabase/server";
import AddressesPage from "@/components/account/addresses-client";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return <AddressesPage addresses={[]} />;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: addresses } = await supabase
    .from("store_addresses")
    .select("*")
    .eq("user_id", user!.id);
  return <AddressesPage addresses={addresses || []} />;
}
