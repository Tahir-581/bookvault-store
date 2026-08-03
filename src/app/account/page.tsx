import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = await isAdmin();

  const [{ count: orderCount }, { count: wishlistCount }] = await Promise.all([
    supabase.from("store_orders").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("store_wishlists").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Your Account</h1>
      <p className="mb-6 text-gray-600">{user?.email}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{orderCount || 0}</p>
            <Link href="/account/orders"><Button variant="link" className="mt-2 p-0">View all orders</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Wishlists</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{wishlistCount || 0}</p>
            <Link href="/account/wishlist"><Button variant="link" className="mt-2 p-0">View wishlist</Button></Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-2 md:grid-cols-2">
        <Link href="/account/addresses" className="rounded border bg-white p-4 hover:shadow-sm">Your Addresses</Link>
        <Link href="/account/reviews" className="rounded border bg-white p-4 hover:shadow-sm">Your Reviews</Link>
        <Link href="/account/membership" className="rounded border bg-white p-4 hover:shadow-sm">BookPass Membership</Link>
        {admin && (
          <Link href="/admin" className="rounded border bg-secondary p-4 text-secondary-foreground hover:bg-nav-hover">Admin Dashboard</Link>
        )}
      </div>
    </div>
  );
}
