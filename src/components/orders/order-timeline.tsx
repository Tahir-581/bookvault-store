import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import type { OrderEventDisplay } from "./types";

export function OrderTimeline({
  events,
  title = "Order Timeline",
}: {
  events: OrderEventDisplay[];
  title?: string;
}) {
  if (!events.length) return null;

  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-bold">{title}</h2>
      <ol className="space-y-4">
        {sorted.map((event, index) => {
          const label =
            ORDER_STATUS_LABELS[event.status as OrderStatus] || event.status;
          const isLatest = index === sorted.length - 1;

          return (
            <li key={event.id} className="flex gap-3 text-sm">
              <div className="flex flex-col items-center">
                <div
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                    isLatest ? "bg-accent" : "bg-gray-300"
                  }`}
                />
                {index < sorted.length - 1 ? (
                  <div className="mt-1 w-px flex-1 bg-gray-200" />
                ) : null}
              </div>
              <div className="pb-1">
                <p className="font-medium capitalize text-gray-900">{label}</p>
                {event.note ? (
                  <p className="text-gray-500">{event.note}</p>
                ) : null}
                <p className="text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
