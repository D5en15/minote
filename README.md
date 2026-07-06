# Minote - Modern Workspace for Notes

Minote is a calm, private space for writing modern notes, bootstrapped with Next.js 16 (App Router), Tailwind CSS v4, Stripe Billing, and Supabase.

---

## 1. Local Development Setup (19.1)
Follow these steps to set up the project locally:
1. Clone the repository:
   ```bash
   git clone https://github.com/D5en15/minote.git
   cd minote
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template and configure the keys:
   ```bash
   cp .env.example .env
   ```
4. Build the application and run the development server:
   ```bash
   npm run build
   npm run dev
   ```

---

## 2. Environment Variables Checklist (19.2)
Configure the following inside your `.env` file:
* `NEXT_PUBLIC_SUPABASE_URL`: The API URL of your Supabase project.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous API key for client operations.
* `SUPABASE_SERVICE_ROLE_KEY`: The service role secret key (keep private, server-only).
* `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe API publishable key.
* `STRIPE_SECRET_KEY`: Stripe API private secret key.
* `STRIPE_WEBHOOK_SECRET`: Webhook secret key for verifying hook signatures locally.

---

## 3. Database & Supabase Configuration (19.3 - 19.4)
### Run Migrations
Run the SQL migration script located in the database migrations directory using the Supabase Dashboard SQL Editor or Supabase CLI:
```bash
# SQL Script path
supabase/migrations/20260706000100_initial_schema.sql
```

### Configure Supabase Auth
1. Go to **Authentication > Providers** in the Supabase Dashboard.
2. Enable **Email OTP** and disable "Confirm email" for testing purposes.
3. Configure the callback redirect URL under **Authentication > Redirect URLs** to match:
   `http://localhost:3000/auth/callback` (Local) and `https://minote-nu.vercel.app/auth/callback` (Production).

---

## 4. Stripe Subscriptions Integration (19.5 - 19.6)
1. Go to the Stripe Dashboard and toggle **Test Mode**.
2. Create subscription Products (e.g. Pro Plan, Enterprise Plan).
3. Copy the Price IDs and update the values in your database schema (`plans` table).
4. Run Stripe CLI locally to forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
5. Copy the generated CLI webhook secret and save it in `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 5. Deployment Setup (19.7)
Deploy the application to Vercel:
1. Connect your GitHub repository to Vercel.
2. Configure environment variables inside Vercel project settings.
3. Vercel automatically detects Next.js build parameters and provisions production environments.

---

## 6. Operational Runbooks (19.8 - 19.9)
### Failed Stripe Webhooks
If Stripe fails to process webhook events:
1. Verify the `STRIPE_WEBHOOK_SECRET` configuration inside environment variables.
2. Go to **Stripe Dashboard > Webhooks > Failed attempts** to review API statuses and inspect request payloads.
3. Re-trigger failed hooks manually from the Stripe Console.

### Purge Trashed Notes Job
* Route endpoint: `POST /api/jobs/purge-trashed-notes`
* Cron scheduler: Call this endpoint daily using Cron services (e.g. Vercel Cron or GitHub Actions) to permanently purge notes past the 30-day retention period.
