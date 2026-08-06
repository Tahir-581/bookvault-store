#!/usr/bin/env bash
# Prints the Google Cloud Console checklist for ilfaaz OAuth branding.
# Open each URL and confirm the settings match.

set -euo pipefail

CLIENT_CALLBACK_LEGACY="https://wksvadcdqgbaadokiaji.supabase.co/auth/v1/callback"
CLIENT_CALLBACK_CUSTOM="https://auth.ilfaaz.com/auth/v1/callback"

cat <<EOF
Google Cloud OAuth branding checklist (ilfaaz)
==============================================

1) Branding → App name must be: ilfaaz
   https://console.cloud.google.com/auth/branding

2) Audience → Publishing status: In production (not Testing)
   https://console.cloud.google.com/auth/audience

3) Clients → Web client Authorized JavaScript origins:
   - http://localhost:3000
   - https://bookvault-store.vercel.app
   - https://www.ilfaaz.com
   https://console.cloud.google.com/auth/clients

4) Clients → Authorized redirect URIs (keep legacy; add custom when ready):
   - ${CLIENT_CALLBACK_LEGACY}
   - ${CLIENT_CALLBACK_CUSTOM}   # only after Supabase Custom Domain is active

5) After publishing GIS changes, redeploy so NEXT_PUBLIC_GOOGLE_CLIENT_ID is live.
   Then private-window test: /auth/login → Continue with Google
   Expect: continue to www.ilfaaz.com / bookvault-store.vercel.app / ilfaaz
   Not: wksvadcdqgbaadokiaji.supabase.co
EOF
