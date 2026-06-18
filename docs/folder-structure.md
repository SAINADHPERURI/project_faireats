# FairEats Folder Structure

```text
src/
  app/
    (auth)/
      sign-in/
      sign-up/
    (customer)/
      customer/
    (restaurant)/
      restaurant/
    (delivery)/
      delivery/
    (admin)/
      admin/
    api/
      auth/
        callback/
  components/
    layouts/
    providers/
    ui/
  config/
  features/
    auth/
    customer/
    restaurant/
    delivery/
    admin/
  lib/
    react-query/
    supabase/
    utils/
  server/
    auth/
    db/
  types/
supabase/
  migrations/
```

## Clean Architecture Boundaries

- `app` owns routing, route groups, layouts, and server entry points.
- `features` owns role-specific UI and use-case entry components.
- `components` owns reusable primitives and layout shells.
- `server` owns server-only authorization and persistence services.
- `lib` owns framework adapters such as Supabase clients and React Query setup.
- `types` owns shared domain contracts generated or curated from the database schema.
