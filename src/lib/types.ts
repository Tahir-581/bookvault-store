import type { BookFormat, OrderStatus } from "./constants";

export type SiteConfig = {
  name: string;
  tagline: string;
  currency: string;
  locale: string;
  primaryColor: string;
  secondaryColor: string;
  membershipName: string;
  freeShippingThreshold: number;
  taxRate: number;
  standardShipping: number;
  expressShipping: number;
  guestCheckout: boolean;
  reviewsEnabled: boolean;
  wishlistsEnabled: boolean;
  membershipEnabled: boolean;
  ebooksEnabled: boolean;
};

export type Book = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isbn: string | null;
  publisher: string | null;
  publication_date: string | null;
  language: string | null;
  page_count: number | null;
  cover_url: string | null;
  author_id: string | null;
  author_name: string;
  avg_rating: number;
  review_count: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_release: boolean;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
};

export type BookFormatRow = {
  id: string;
  book_id: string;
  format: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  is_active: boolean;
};

export type BookWithFormats = Book & {
  formats: BookFormatRow[];
  categories?: { id: string; name: string; slug: string }[];
};

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Review = {
  id: string;
  book_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified_purchase: boolean;
  status: string;
  helpful_count: number;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  payment_status: string;
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  tax: number;
  grand_total: number;
  currency: string;
  coupon_code: string | null;
  shipping_address: Record<string, string>;
  gift_message: string | null;
  gift_wrap: boolean;
  delivery_speed: string;
  created_at: string;
};

export type NavMenuItem = {
  label: string;
  href: string;
  children?: NavMenuItem[];
};

export type HomepageSection = {
  id: string;
  section_type: "carousel" | "category_tiles" | "book_row" | "editorial";
  title: string | null;
  subtitle: string | null;
  config: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
};
