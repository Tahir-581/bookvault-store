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

Customer login and signup include **Continue with Google** via Supabase Auth. Google Client ID/Secret stay in the Supabase Dashboard only — never in Next.js env.

Supabase project: **Website-1** (`wksvadcdqgbaadokiaji`).

### 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create/select a project.
2. Configure [Google Auth Platform](https://console.cloud.google.com/auth/overview):
   - **Audience**: External (public store).
   - **Branding**: app name `ilfaaz`.
   - **Scopes**: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
3. Create an **OAuth client ID** (Web application).
4. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://bookvault-store.vercel.app`
   - `https://www.ilfaaz.com`
5. **Authorized redirect URIs** (Supabase callback, not the Next.js app):
   - `https://wksvadcdqgbaadokiaji.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret.

If the consent screen is in Testing mode, add your Google account as a test user.

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

**Automatic identity linking** is the default in Supabase Auth: a Google sign-in with the same verified email as an existing password account links into one user ([docs](https://supabase.com/docs/guides/auth/auth-identity-linking)). No extra toggle is required for that behavior. Manual linking (`linkIdentity`) is optional and only needed if you want users to attach a different email’s Google identity while logged in.

App callback route: `/auth/callback` (exchanges the OAuth `code` for a session).

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4
- **Backend:** Supabase (Auth, Postgres, Storage)
- **Payments:** Stripe Checkout + webhooks
- **Deploy:** Vercel
