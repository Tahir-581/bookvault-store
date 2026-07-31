# BookVault — Amazon-Inspired Books Store

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

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4
- **Backend:** Supabase (Auth, Postgres, Storage)
- **Payments:** Stripe Checkout + webhooks
- **Deploy:** Vercel
