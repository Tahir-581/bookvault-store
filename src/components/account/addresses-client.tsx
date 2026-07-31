"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { saveAddressAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddressesPage({
  addresses,
}: {
  addresses: {
    id: string;
    label: string | null;
    full_name: string;
    line1: string;
    city: string;
    postcode: string;
    is_default: boolean;
  }[];
}) {
  const [pending, startTransition] = useTransition();

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await saveAddressAction(formData);
      if (result.error) toast.error(result.error);
      else toast.success("Address saved");
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Your Addresses</h1>

      {addresses.map((addr) => (
        <div key={addr.id} className="mb-4 rounded-lg border bg-white p-4">
          <p className="font-medium">{addr.label || "Address"} {addr.is_default && "(Default)"}</p>
          <p className="text-sm text-gray-600">
            {addr.full_name}<br />
            {addr.line1}<br />
            {addr.city}, {addr.postcode}
          </p>
        </div>
      ))}

      <form action={handleSave} className="mt-6 space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold">Add New Address</h2>
        <div><Label>Label</Label><Input name="label" defaultValue="Home" /></div>
        <div><Label>Full Name</Label><Input name="full_name" required /></div>
        <div><Label>Address</Label><Input name="line1" required /></div>
        <div><Label>City</Label><Input name="city" required /></div>
        <div><Label>Postcode</Label><Input name="postcode" required /></div>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_default" /> Set as default</label>
        <Button type="submit" disabled={pending}>Save Address</Button>
      </form>
    </div>
  );
}
