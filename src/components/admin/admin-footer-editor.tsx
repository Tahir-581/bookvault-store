"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateFooterConfigAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FooterConfig } from "@/lib/types";

export function AdminFooterEditor({ footer }: { footer?: FooterConfig }) {
  const [json, setJson] = useState(JSON.stringify(footer || {}, null, 2));
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        const value = JSON.parse(json);
        await updateFooterConfigAction(value);
        toast.success("Footer updated");
      } catch {
        toast.error("Invalid JSON");
      }
    });
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Footer Configuration</h2>
      <p className="mb-2 text-sm text-gray-600">
        JSON with columns, subsidiaries, legalLinks, copyright
      </p>
      <textarea
        className="w-full rounded border p-3 font-mono text-sm"
        rows={20}
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <Label>Quick: copyright text</Label>
          <Input
            defaultValue={footer?.copyright || ""}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(json);
                parsed.copyright = e.target.value;
                setJson(JSON.stringify(parsed, null, 2));
              } catch { /* ignore */ }
            }}
          />
        </div>
      </div>
      <Button className="mt-3" onClick={handleSave} disabled={pending}>
        Save Footer
      </Button>
    </div>
  );
}
