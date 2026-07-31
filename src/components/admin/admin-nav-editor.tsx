"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateNavMenuAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NavMenuItem } from "@/lib/types";

type MenuRow = { menu_key: string; label: string; items: NavMenuItem[] };

export function AdminNavEditor({ menus }: { menus: MenuRow[] }) {
  const [selectedKey, setSelectedKey] = useState(menus[0]?.menu_key || "books_subnav");
  const menu = menus.find((m) => m.menu_key === selectedKey);
  const [json, setJson] = useState(JSON.stringify(menu?.items || [], null, 2));
  const [pending, startTransition] = useTransition();

  function selectMenu(key: string) {
    setSelectedKey(key);
    const m = menus.find((item) => item.menu_key === key);
    setJson(JSON.stringify(m?.items || [], null, 2));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const items = JSON.parse(json);
        await updateNavMenuAction(selectedKey, items);
        toast.success("Navigation updated");
      } catch {
        toast.error("Invalid JSON");
      }
    });
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Navigation Menus</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {["books_subnav", "secondary", "mega_menu"].map((key) => (
          <Button
            key={key}
            size="sm"
            variant={selectedKey === key ? "default" : "outline"}
            onClick={() => selectMenu(key)}
          >
            {key}
          </Button>
        ))}
      </div>
      <p className="mb-2 text-sm text-gray-600">
        Edit JSON array of menu items: {"{ label, href, children?: [] }"}
      </p>
      <Label>Items JSON</Label>
      <textarea
        className="mt-1 w-full rounded border p-3 font-mono text-sm"
        rows={16}
        value={json}
        onChange={(e) => setJson(e.target.value)}
      />
      <Button className="mt-3" onClick={handleSave} disabled={pending}>
        Save {selectedKey}
      </Button>
    </div>
  );
}
