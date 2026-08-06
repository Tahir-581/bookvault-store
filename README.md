# ilfaaz — Amazon-Inspired Books Store

A full-featured single-store bookstore built with Next.js 16, Supabase, and Stripe.

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Fill in Supabase + Stripe keys
npm run dev
```

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run seed` — Seed catalog (requires `SUPABASE_SERVICE_ROLE_KEY`)
- `npm run test:smoke` — Run checkout math smoke tests

## Environment Variables

See `.env.local.example` for required keys.

## Admin Access

Promote a user to admin in Supabase SQL:

```sql
INSERT INTO admin_profiles (auth_user_id, role, status, email)
VALUES ('<user-uuid>', 'admin', 'active', 'you@example.com');
```

## Google sign-in (customers)

Customer login and signup use **Google Identity Services** (GIS) in the browser, then `signInWithIdToken` against Supabase Auth. That way Google’s “Sign in to continue to …” screen shows **your store origin / app name** (`ilfaaz` / `www.ilfaaz.com`), not `wksvadcdqgbaadokiaji.supabase.co`.

Supabase project: **Website-1** (`wksvadcdqgbaadokiaji`).

### Why the old screen showed the Supabase hostname

The classic `signInWithOAuth` flow registers Google’s redirect URI as  
`https://wksvadcdqgbaadokiaji.supabase.co/auth/v1/callback`. Google displays that hostname. GIS avoids that hop for the primary button.

### 1. Google Cloud Console (required branding)

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview).
2. **Branding**:
   - App name: `ilfaaz`
   - Application home page: `https://www.ilfaaz.com`
   - Privacy / Terms: `https://www.ilfaaz.com/pages/privacy` and `https://www.ilfaaz.com/pages/terms` (when live)
   - Authorized domains: `ilfaaz.com` (verify ownership in [Google Search Console](https://search.google.com/search-console) if prompted)
3. **Audience**: External. **Publish** the app (leave Testing only for private tests).
4. **Scopes**: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
5. **OAuth client** (Web application) — **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://bookvault-store.vercel.app`
   - `https://www.ilfaaz.com`
6. **Authorized redirect URIs** (keep for Supabase / legacy fallback):
   - `https://wksvadcdqgbaadokiaji.supabase.co/auth/v1/callback`
   - After a custom domain is active, also add: `https://auth.ilfaaz.com/auth/v1/callback`
7. Copy the **Client ID** into Next.js as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (safe to expose). Put the **Client Secret** only in the Supabase Dashboard.

See also: [Supabase — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

### 2. Supabase Dashboard

In [Authentication → Providers → Google](https://supabase.com/dashboard/project/wksvadcdqgbaadokiaji/auth/providers):

1. Enable Google; paste Client ID + Client Secret; save.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://www.ilfaaz.com`
   - **Redirect URLs** (allow-list):
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/callback?**`
     - `https://bookvault-store.vercel.app/auth/callback`
     - `https://bookvault-store.vercel.app/auth/callback?**`
     - `https://www.ilfaaz.com/auth/callback`
     - `https://www.ilfaaz.com/auth/callback?**`
3. Keep the email provider enabled (password login stays available).

**Automatic identity linking** is the default in Supabase Auth: a Google sign-in with the same verified email as an existing password account links into one user ([docs](https://supabase.com/docs/guides/auth/auth-identity-linking)).

App callback route: `/auth/callback` (still used for email/password recovery and any OAuth fallback).

### 3. Optional: Supabase Custom Domain `auth.ilfaaz.com`

Requires a **paid Supabase plan + Custom Domain add-on**. Use this if you still want OAuth redirect flows to advertise `auth.ilfaaz.com` instead of `*.supabase.co`.

1. Dashboard → Project Settings → [Custom Domains](https://supabase.com/dashboard/project/wksvadcdqgbaadokiaji/settings/addons?panel=customDomain).
2. Register `auth.ilfaaz.com`.
3. DNS (GoDaddy for `ilfaaz.com`):
   - Point `auth` **CNAME** to `wksvadcdqgbaadokiaji.supabase.co` (replace any existing Vercel CNAME on `auth`).
   - Add the TXT / ACME records Supabase shows.
4. Verify, then activate. Add `https://auth.ilfaaz.com/auth/v1/callback` in Google (step 1.6).
5. Set `NEXT_PUBLIC_SUPABASE_URL=https://auth.ilfaaz.com` in Vercel / `.env.local` when ready.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4
- **Backend:** Supabase (Auth, Postgres, Storage)
- **Payments:** Stripe Checkout + webhooks
- **Deploy:** Vercel
