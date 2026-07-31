import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const supabase = await createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: bookCount },
    { count: orderCount },
    { data: todayOrders },
    { count: pendingReviews },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("store_books").select("*", { count: "exact", head: true }),
    supabase.from("store_orders").select("*", { count: "exact", head: true }),
    supabase
      .from("store_orders")
      .select("grand_total")
      .gte("created_at", `${today}T00:00:00`),
    supabase
      .from("store_reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("store_orders")
      .select("order_number, email, grand_total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const revenueToday =
    todayOrders?.reduce((sum, o) => sum + Number(o.grand_total), 0) || 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Revenue Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(revenueToday)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orderCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Books in Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bookCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingReviews || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Order</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentOrders || []).map((order) => (
                <tr key={order.order_number} className="border-b border-gray-100">
                  <td className="py-2 font-medium">{order.order_number}</td>
                  <td className="py-2">{order.email}</td>
                  <td className="py-2">{formatPrice(order.grand_total)}</td>
                  <td className="py-2 capitalize">{order.status}</td>
                  <td className="py-2 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
