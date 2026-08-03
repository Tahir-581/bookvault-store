export const SITE_NAME = "BookVault";
export const SITE_TAGLINE = "Your favourite books, delivered fast";

export const BOOK_FORMATS = ["paperback", "hardcover", "ebook", "audiobook"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const FORMAT_LABELS: Record<BookFormat, string> = {
  paperback: "Paperback",
  hardcover: "Hardcover",
  ebook: "Kindle Edition",
  audiobook: "Audible Audiobook",
};

export const STOREFRONT_FORMAT_LABELS: Record<BookFormat, string> = {
  paperback: "Paperback",
  hardcover: "Hardcover",
  ebook: "Kindle Edition",
  audiobook: "Audible Audiobook",
};

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const DEFAULT_SITE_CONFIG = {
  name: SITE_NAME,
  tagline: SITE_TAGLINE,
  currency: "GBP",
  locale: "en-GB",
  primaryColor: "#FEBD69",
  secondaryColor: "#131921",
  membershipName: "BookPass",
  freeShippingThreshold: 25,
  taxRate: 0.2,
  standardShipping: 3.99,
  expressShipping: 7.99,
  guestCheckout: true,
  reviewsEnabled: true,
  wishlistsEnabled: true,
  membershipEnabled: true,
  ebooksEnabled: true,
};

export const COVER_BUCKET = "books-site-media";

export const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${COVER_BUCKET}`
  : `https://wksvadcdqgbaadokiaji.supabase.co/storage/v1/object/public/${COVER_BUCKET}`;
