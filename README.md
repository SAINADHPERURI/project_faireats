# FairEats

FairEats is a production-ready food delivery platform scaffolded with Next.js 15 App Router, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Supabase, and React Query.

## Architecture

The app uses route groups and feature modules to keep UI, auth, data access, and domain types separated:

- `src/app/(customer)/customer` - customer ordering experience
- `src/app/(restaurant)/restaurant` - restaurant operations dashboard
- `src/app/(delivery)/delivery` - delivery partner workflow
- `src/app/(admin)/admin` - platform administration
- `src/features/*` - feature-specific UI and business entry points
- `src/lib/*` - framework/client adapters
- `src/server/*` - server-only application services
- `src/types/*` - shared domain contracts

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in Supabase values.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.

## Supabase

Run migrations in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_enterprise_schema.sql`

The enterprise schema contains users, restaurants, menu items, delivery partners, orders, order items, reviews, notifications, favorites, analytics, indexes, constraints, relationships, and row-level security policies.

Sample development data is available at `supabase/seed.sql`.

### Google sign-in

1. Create OAuth credentials in Google Cloud and add
   `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized
   redirect URI.
2. In Supabase, open **Authentication → Providers → Google**, enable Google,
   and add the client ID and client secret.
3. In Supabase **Authentication → URL Configuration**, add
   `http://localhost:3000/api/auth/callback` as an allowed redirect URL. Add
   the equivalent production callback URL before deploying.

New Google accounts are created as customer accounts. Existing Google-linked
accounts are redirected to the workspace assigned to their saved profile role.

### Apple sign-in

Apple sign-in uses the same `/api/auth/callback` application route and defaults
new accounts to the customer workspace.

1. Use an Apple Developer account to create an App ID with Sign in with Apple,
   a Services ID for the website, and a Sign in with Apple key.
2. Configure the Services ID with the Supabase project domain and its callback:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Generate the Apple OAuth client secret from the downloaded `.p8` key, then
   enable Apple under **Supabase Authentication → Providers** using the
   Services ID and generated secret.
4. Store the `.p8` key securely and rotate the Apple client secret before its
   six-month expiration.
