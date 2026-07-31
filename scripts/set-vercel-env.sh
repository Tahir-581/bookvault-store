#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
source .env.local
set +a

SITE_URL="https://bookvault-store.vercel.app"

add_or_update() {
  local name="$1"
  local value="$2"
  local env="$3"
  if npx vercel env ls "$env" 2>/dev/null | grep -q "^ ${name} "; then
    printf '%s' "$value" | npx vercel env update "$name" "$env" --yes
  else
    printf '%s' "$value" | npx vercel env add "$name" "$env" --yes
  fi
}

for env in production preview development; do
  add_or_update "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "$env"
  add_or_update "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$env"
  add_or_update "NEXT_PUBLIC_SITE_URL" "$SITE_URL" "$env"
  add_or_update "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$env"
  add_or_update "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$env"
done

echo "Vercel env vars configured."
