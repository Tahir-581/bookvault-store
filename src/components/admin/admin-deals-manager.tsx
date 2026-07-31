"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  createDealAction,
  deleteDealAction,
  updateDealAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import type { BookWithFormats } from "@/lib/types";

type DealRow = {
  id: string;
  book_id: string;
  format_id: string | null;
  deal_price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  store_books: { title: string } | null;
};

export function AdminDealsManager({
  deals,
  books,
}: {
  deals: DealRow[];
  books: BookWithFormats[];
}) {
  const [pending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createDealAction(formData);
      toast.success("Deal created");
      window.location.reload();
    });
  }

  function toggleActive(deal: DealRow) {
    startTransition(async () => {
      await updateDealAction(deal.id, { is_active: !deal.is_active });
      toast.success("Deal updated");
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete deal?")) return;
    startTransition(async () => {
      await deleteDealAction(id);
      toast.success("Deal deleted");
      window.location.reload();
    });
  }

  const defaultStart = new Date().toISOString().slice(0, 16);
  const defaultEnd = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div>
      <form action={handleCreate} className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold">Create Lightning Deal</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Book</Label>
            <select name="book_id" required className="w-full rounded border px-3 py-2">
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Format</Label>
            <select name="format_id" className="w-full rounded border px-3 py-2">
              <option value="">Any</option>
              {books.flatMap((b) =>
                b.formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {b.title} — {f.format}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <Label>Deal price (£)</Label>
            <Input name="deal_price" type="number" step="0.01" required />
          </div>
          <div>
            <Label>Starts</Label>
            <Input name="starts_at" type="datetime-local" defaultValue={defaultStart} required />
          </div>
          <div>
            <Label>Ends</Label>
            <Input name="ends_at" type="datetime-local" defaultValue={defaultEnd} required />
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={pending}>Create Deal</Button>
      </form>

      <table className="w-full rounded-lg bg-white text-sm shadow-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="p-3">Book</th>
            <th className="p-3">Deal Price</th>
            <th className="p-3">Starts</th>
            <th className="p-3">Ends</th>
            <th className="p-3">Active</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-b">
              <td className="p-3">{deal.store_books?.title}</td>
              <td className="p-3">{formatPrice(deal.deal_price)}</td>
              <td className="p-3">{new Date(deal.starts_at).toLocaleString()}</td>
              <td className="p-3">{new Date(deal.ends_at).toLocaleString()}</td>
              <td className="p-3">{deal.is_active ? "Yes" : "No"}</td>
              <td className="p-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleActive(deal)} disabled={pending}>
                  Toggle
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(deal.id)} disabled={pending}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
