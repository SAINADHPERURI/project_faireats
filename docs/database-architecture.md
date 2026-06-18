# FairEats Database Architecture

## Files

- `supabase/migrations/0001_initial_schema.sql` - starter schema.
- `supabase/migrations/0002_enterprise_schema.sql` - enterprise FairEats schema upgrade.
- `supabase/seed.sql` - sample seed data.
- `src/types/database.ts` - TypeScript interfaces and Supabase table map.

## Tables

- `users`
- `restaurants`
- `menu_items`
- `orders`
- `order_items`
- `delivery_partners`
- `reviews`
- `notifications`
- `favorites`
- `analytics`

## Seed Scale

- 20 restaurants
- 50 menu items
- 20 delivery partners
- 100 orders

The seed also creates supporting customers, restaurant owners, order items, reviews, notifications, favorites, and analytics events.
