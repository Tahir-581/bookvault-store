import { createServiceClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export default async function AdminDealsPage() {
  const supabase = await createServiceClient();
  const { data: deals } = await supabase
    .from("store_deals")
    .select("*, store_books(title)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Lightning Deals</h1>
      <table className="w-full rounded-lg bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="p-3">Book</th>
            <th className="p-3">Deal Price</th>
            <th className="p-3">Starts</th>
            <th className="p-3">Ends</th>
            <th className="p-3">Active</th>
          </tr>
        </thead>
        <tbody>
          {(deals || []).map((deal) => (
            <tr key={deal.id} className="border-b">
              <td className="p-3">{(deal.store_books as { title: string })?.title}</td>
              <td className="p-3">{formatPrice(deal.deal_price)}</td>
              <td className="p-3">{new Date(deal.starts_at).toLocaleDateString()}</td>
              <td className="p-3">{new Date(deal.ends_at).toLocaleDateString()}</td>
              <td className="p-3">{deal.is_active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
