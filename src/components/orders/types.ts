export type OrderItemDisplay = {
  id: string;
  title: string;
  author: string;
  format: string;
  cover_url: string | null;
  quantity: number;
  unit_price: number;
};

export type ShippingAddress = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
};

export type OrderEventDisplay = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
};
