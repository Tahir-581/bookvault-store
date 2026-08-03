-- One-time: round existing money amounts to whole PKR

UPDATE store_book_formats
SET
  price = ROUND(price),
  compare_at_price = CASE
    WHEN compare_at_price IS NULL THEN NULL
    ELSE ROUND(compare_at_price)
  END;

UPDATE store_deals
SET deal_price = ROUND(deal_price);

UPDATE store_memberships
SET
  price_monthly = ROUND(price_monthly),
  free_shipping_threshold = CASE
    WHEN free_shipping_threshold IS NULL THEN NULL
    ELSE ROUND(free_shipping_threshold)
  END;

UPDATE store_coupons
SET
  discount_value = ROUND(discount_value),
  min_order_amount = CASE
    WHEN min_order_amount IS NULL THEN NULL
    ELSE ROUND(min_order_amount)
  END;

UPDATE store_order_items
SET unit_price = ROUND(unit_price);

UPDATE store_orders
SET
  subtotal = ROUND(subtotal),
  discount_total = ROUND(discount_total),
  shipping_fee = ROUND(shipping_fee),
  tax = ROUND(tax),
  grand_total = ROUND(grand_total);

UPDATE store_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      value,
      '{standardShipping}',
      to_jsonb(ROUND(COALESCE((value->>'standardShipping')::numeric, 4)))
    ),
    '{expressShipping}',
    to_jsonb(ROUND(COALESCE((value->>'expressShipping')::numeric, 8)))
  ),
  '{freeShippingThreshold}',
  to_jsonb(ROUND(COALESCE((value->>'freeShippingThreshold')::numeric, 25)))
),
updated_at = now()
WHERE key = 'site';
