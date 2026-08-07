import type { ShippingAddress } from "./types";

function parseAddress(value: unknown): ShippingAddress | null {
  if (!value || typeof value !== "object") return null;
  return value as ShippingAddress;
}

export function ShippingAddressCard({
  address,
  title = "Shipping address",
}: {
  address: unknown;
  title?: string;
}) {
  const shipping = parseAddress(address);

  if (!shipping || !shipping.full_name) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="font-bold">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">No shipping address on file.</p>
      </div>
    );
  }

  const cityLine = [shipping.city, shipping.county, shipping.postcode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-3 font-bold">{title}</h2>
      <address className="not-italic text-sm leading-relaxed text-gray-700">
        <p className="font-medium text-gray-900">{shipping.full_name}</p>
        {shipping.phone ? <p className="text-gray-600">{shipping.phone}</p> : null}
        {shipping.line1 ? <p>{shipping.line1}</p> : null}
        {shipping.line2 ? <p>{shipping.line2}</p> : null}
        {cityLine ? <p>{cityLine}</p> : null}
        {shipping.country ? <p>{shipping.country}</p> : null}
      </address>
    </div>
  );
}
