import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Amazon-style price parts for storefront cards */
export function formatAmazonPrice(amount: number, currency = "GBP") {
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
  const symbol = formatted.replace(/[\d.,\s]/g, "").trim();
  const numeric = formatted.replace(/[^\d.,]/g, "");
  const parts = numeric.split(".");
  return {
    symbol,
    whole: parts[0] || numeric,
    fraction: parts[1] || "00",
    full: formatted,
  };
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
