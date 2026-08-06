export const SITE_NAME = "ilfaaz";
export const SITE_TAB_TITLE = "ilfaaz books store";
export const SITE_TAGLINE = "Your favourite books, delivered fast";

export const BOOK_FORMATS = ["hardcover"] as const;
export type BookFormat = (typeof BOOK_FORMATS)[number];

export const FORMAT_LABELS: Record<BookFormat, string> = {
  hardcover: "Hardcover",
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
  currency: "PKR",
  locale: "en-PK",
  primaryColor: "#FEBD69",
  secondaryColor: "#131921",
  membershipName: "BookPass",
  freeShippingThreshold: 25,
  taxRate: 0.2,
  standardShipping: 4,
  expressShipping: 8,
  guestCheckout: true,
  reviewsEnabled: true,
  wishlistsEnabled: true,
  membershipEnabled: false,
};

export const COVER_BUCKET = "books-site-media";

export const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${COVER_BUCKET}`
  : `https://wksvadcdqgbaadokiaji.supabase.co/storage/v1/object/public/${COVER_BUCKET}`;
