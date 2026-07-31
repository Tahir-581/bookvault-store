import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminCustomersPage() {
  const supabase = await createServiceClient();
  const { data: orders } = await supabase
    .from("store_orders")
    .select("email, grand_total, created_at")
    .order("created_at", { ascending: false });

  const customers = new Map<string, { email: string; orders: number; total: number }>();
  for (const order of orders || []) {
    const existing = customers.get(order.email) || { email: order.email, orders: 0, total: 0 };
    existing.orders += 1;
    existing.total += Number(order.grand_total);
    customers.set(order.email, existing);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Customers</h1>
      <table className="w-full rounded-lg bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="p-3">Email</th>
            <th className="p-3">Orders</th>
            <th className="p-3">Total Spent</th>
          </tr>
        </thead>
        <tbody>
          {[...customers.values()].map((c) => (
            <tr key={c.email} className="border-b">
              <td className="p-3">{c.email}</td>
              <td className="p-3">{c.orders}</td>
              <td className="p-3">£{c.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
