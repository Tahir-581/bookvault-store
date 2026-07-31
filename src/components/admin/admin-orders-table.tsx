"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type Order = {
  id: string;
  order_number: string;
  email: string;
  status: string;
  grand_total: number;
  created_at: string;
};

export function AdminOrdersTable({ orders }: { orders: Order[] }) {
  const [pending, startTransition] = useTransition();

  function updateStatus(orderId: string, status: string) {
    startTransition(async () => {
      await updateOrderStatusAction(orderId, status);
      toast.success("Order updated");
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Order Management</h1>
      <div className="rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-3 font-medium">{order.order_number}</td>
                <td className="p-3">{order.email}</td>
                <td className="p-3">{formatPrice(order.grand_total)}</td>
                <td className="p-3 capitalize">{order.status}</td>
                <td className="p-3 text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <select
                    defaultValue={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={pending}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
