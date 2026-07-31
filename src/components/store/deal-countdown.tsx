"use client";

import { useEffect, useState } from "react";

export function DealCountdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function tick() {
      const end = new Date(endsAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, end - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!remaining) return null;

  return (
    <div className="mt-1 bg-[#CC0C39] px-2 py-1 text-center text-xs font-medium text-white">
      Ends in {remaining}
    </div>
  );
}
