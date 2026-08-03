import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Amazon-style price parts for storefront cards */
export function formatAmazonPrice(amount: number, currency = "PKR") {
  const formatted = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  const symbol = formatted.replace(/[\d.,\s]/g, "").trim();
  const numeric = formatted.replace(/[^\d.,]/g, "");
  return {
    symbol,
    whole: numeric || String(amount),
    fraction: "",
    full: formatted,
  };
}

/** Accept only whole PKR amounts (no decimal input). */
export function parseWholeRupee(
  value: FormDataEntryValue | string | number | null | undefined,
  options?: { optional?: boolean; field?: string; allowZero?: boolean }
): { value: number | null; error?: string } {
  const label = options?.field || "Amount";
  const raw = value == null ? "" : String(value).trim();

  if (!raw) {
    if (options?.optional) return { value: null };
    return { value: null, error: `${label} is required` };
  }

  if (/[.,]/.test(raw)) {
    return { value: null, error: `${label} must be a whole number (no decimals)` };
  }

  const num = Number(raw);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { value: null, error: `${label} must be a whole number (no decimals)` };
  }
  if (num < 0 || (num === 0 && !options?.allowZero)) {
    return { value: null, error: `${label} must be a positive whole number` };
  }

  return { value: num };
}

export function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BV-${ts}-${rand}`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
