"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createCouponAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_kind: string;
  discount_value: number;
  use_count: number;
  is_active: boolean;
};

export function AdminCouponsManager({ coupons }: { coupons: Coupon[] }) {
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createCouponAction(formData);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Coupon created");
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Coupons & Promotions</h1>
      <form action={handleCreate} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Code</Label>
            <Input name="code" required placeholder="SAVE10" />
          </div>
          <div>
            <Label>Description</Label>
            <Input name="description" />
          </div>
          <div>
            <Label>Discount Type</Label>
            <select name="discount_kind" className="w-full rounded border px-3 py-2">
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div>
            <Label>Value</Label>
            <Input name="discount_value" type="number" step="1" inputMode="numeric" defaultValue="10" />
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={pending}>Create Coupon</Button>
      </form>
      <table className="w-full rounded-lg bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="p-3">Code</th>
            <th className="p-3">Type</th>
            <th className="p-3">Value</th>
            <th className="p-3">Uses</th>
            <th className="p-3">Active</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-3 font-mono font-bold">{c.code}</td>
              <td className="p-3 capitalize">{c.discount_kind}</td>
              <td className="p-3">{c.discount_value}</td>
              <td className="p-3">{c.use_count}</td>
              <td className="p-3">{c.is_active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
