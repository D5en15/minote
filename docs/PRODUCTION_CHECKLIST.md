# Production Readiness Environment Checklist

## 1. Database & Supabase (17.10, 17.12)
- [x] Configure production Supabase instances matching migration scripts schemas.
- [x] Ensure Supabase database backup scheduler rules are turned ON under project management settings (Daily standard backups verified).
- [x] Configure production redirect URLs under Supabase Authentication settings to map only mapping Vercel domain urls (`https://minote-nu.vercel.app/auth/callback`).

## 2. Payments & Stripe (17.11)
- [x] Configure production Stripe Account and set product monthly/yearly pricing items.
- [x] Create a production webhook endpoint mapped to (`https://minote-nu.vercel.app/api/webhooks/stripe`).
- [x] Restrict active stripe event triggers to: `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- [x] Export STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars safely inside hosting workspace.

## 3. Custom Domain & Security (17.13)
- [x] Mapped production root domain to (`https://minote-nu.vercel.app/`).
- [x] SSL certificate generation is fully configured and enforcing HTTPS protocols.
