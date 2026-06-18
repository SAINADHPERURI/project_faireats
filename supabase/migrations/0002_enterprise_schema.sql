create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('CUSTOMER', 'RESTAURANT', 'DELIVERY', 'ADMIN');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_status as enum ('ACTIVE', 'SUSPENDED', 'DELETED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum (
    'PENDING',
    'PLACED',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'READY_FOR_PICKUP',
    'ASSIGNED',
    'PICKED_UP',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.order_status add value if not exists 'PLACED';
alter type public.order_status add value if not exists 'READY_FOR_PICKUP';
alter type public.order_status add value if not exists 'ASSIGNED';
alter type public.order_status add value if not exists 'REFUNDED';

do $$
begin
  create type public.payment_status as enum ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.delivery_partner_status as enum ('AVAILABLE', 'BUSY', 'OFFLINE', 'SUSPENDED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.review_status as enum ('PENDING', 'APPROVED', 'REJECTED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum ('ORDER', 'DELIVERY', 'PAYMENT', 'PROMOTION', 'SYSTEM');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.analytics_entity_type as enum ('USER', 'RESTAURANT', 'MENU_ITEM', 'ORDER', 'DELIVERY_PARTNER', 'PLATFORM');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if to_regclass('public.users') is null and to_regclass('public.profiles') is not null then
    alter table public.profiles rename to users;
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'CUSTOMER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if to_regclass('public.profiles') is null then
    execute 'create view public.profiles with (security_invoker = true) as select id, email, full_name, role, created_at, updated_at from public.users';
  end if;
end $$;

alter table public.users
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists status public.user_status not null default 'ACTIVE',
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text not null default 'US',
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  alter table public.users add constraint users_email_format_chk check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.users add constraint users_geo_latitude_chk check (latitude is null or latitude between -90 and 90);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.users add constraint users_geo_longitude_chk check (longitude is null or longitude between -180 and 180);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.restaurants
  add column if not exists slug text,
  add column if not exists legal_name text,
  add column if not exists cuisine_type text not null default 'Multi-cuisine',
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text not null default 'US',
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists opening_hours jsonb not null default '{}'::jsonb,
  add column if not exists commission_rate_bps integer not null default 1500,
  add column if not exists min_order_cents integer not null default 0,
  add column if not exists delivery_fee_cents integer not null default 0,
  add column if not exists average_prep_time_minutes integer not null default 30,
  add column if not exists rating_avg numeric(3, 2) not null default 0,
  add column if not exists rating_count integer not null default 0,
  add column if not exists is_verified boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

update public.restaurants
set slug = lower(regexp_replace(coalesce(slug, name), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

do $$
begin
  alter table public.restaurants alter column slug set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.restaurants add constraint restaurants_slug_unique unique (slug);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.restaurants add constraint restaurants_commission_rate_chk check (commission_rate_bps between 0 and 10000);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.restaurants add constraint restaurants_money_chk check (min_order_cents >= 0 and delivery_fee_cents >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.restaurants add constraint restaurants_rating_chk check (rating_avg between 0 and 5 and rating_count >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.restaurants add constraint restaurants_geo_latitude_chk check (latitude is null or latitude between -90 and 90);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.restaurants add constraint restaurants_geo_longitude_chk check (longitude is null or longitude between -180 and 180);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.menu_items
  add column if not exists slug text,
  add column if not exists category text not null default 'Featured',
  add column if not exists currency char(3) not null default 'USD',
  add column if not exists image_url text,
  add column if not exists calories integer,
  add column if not exists dietary_tags text[] not null default '{}'::text[],
  add column if not exists sort_order integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

update public.menu_items
set slug = lower(regexp_replace(coalesce(slug, name), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

do $$
begin
  alter table public.menu_items alter column slug set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.menu_items add constraint menu_items_restaurant_slug_unique unique (restaurant_id, slug);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.menu_items add constraint menu_items_price_chk check (price_cents >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.menu_items add constraint menu_items_calories_chk check (calories is null or calories >= 0);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  status public.delivery_partner_status not null default 'OFFLINE',
  vehicle_type text not null,
  vehicle_number text,
  license_number text,
  current_latitude numeric(9, 6),
  current_longitude numeric(9, 6),
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  completed_deliveries integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.delivery_partners add constraint delivery_partners_rating_chk check (rating_avg between 0 and 5 and rating_count >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.delivery_partners add constraint delivery_partners_completed_deliveries_chk check (completed_deliveries >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.delivery_partners add constraint delivery_partners_geo_latitude_chk check (current_latitude is null or current_latitude between -90 and 90);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.delivery_partners add constraint delivery_partners_geo_longitude_chk check (current_longitude is null or current_longitude between -180 and 180);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id) on delete restrict,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  status public.order_status not null default 'PENDING',
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists order_number text,
  add column if not exists delivery_partner_id uuid references public.delivery_partners(id) on delete set null,
  add column if not exists payment_status public.payment_status not null default 'PENDING',
  add column if not exists payment_method text,
  add column if not exists subtotal_cents integer not null default 0,
  add column if not exists tax_cents integer not null default 0,
  add column if not exists delivery_fee_cents integer not null default 0,
  add column if not exists discount_cents integer not null default 0,
  add column if not exists tip_cents integer not null default 0,
  add column if not exists currency char(3) not null default 'USD',
  add column if not exists delivery_address_line1 text,
  add column if not exists delivery_address_line2 text,
  add column if not exists delivery_city text,
  add column if not exists delivery_state text,
  add column if not exists delivery_postal_code text,
  add column if not exists delivery_country text not null default 'US',
  add column if not exists delivery_latitude numeric(9, 6),
  add column if not exists delivery_longitude numeric(9, 6),
  add column if not exists customer_notes text,
  add column if not exists restaurant_notes text,
  add column if not exists placed_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists picked_up_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

update public.orders
set order_number = 'FE-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where order_number is null;

do $$
begin
  alter table public.orders alter column order_number set not null;
exception
  when others then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_order_number_unique unique (order_number);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_money_chk check (
    subtotal_cents >= 0 and tax_cents >= 0 and delivery_fee_cents >= 0 and discount_cents >= 0 and tip_cents >= 0 and total_cents >= 0
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_geo_latitude_chk check (delivery_latitude is null or delivery_latitude between -90 and 90);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.orders add constraint orders_geo_longitude_chk check (delivery_longitude is null or delivery_longitude between -180 and 180);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  item_name text not null,
  unit_price_cents integer not null,
  quantity integer not null,
  line_total_cents integer not null,
  special_instructions text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.order_items add constraint order_items_quantity_chk check (quantity > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.order_items add constraint order_items_money_chk check (unit_price_cents >= 0 and line_total_cents >= 0);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references public.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  delivery_partner_id uuid references public.delivery_partners(id) on delete set null,
  rating smallint not null,
  delivery_rating smallint,
  comment text,
  status public.review_status not null default 'PENDING',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.reviews add constraint reviews_order_unique unique (order_id);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reviews add constraint reviews_rating_chk check (rating between 1 and 5 and (delivery_rating is null or delivery_rating between 1 and 5));
exception
  when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.notification_type not null default 'SYSTEM',
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.favorites add constraint favorites_customer_restaurant_unique unique (customer_id, restaurant_id);
exception
  when duplicate_object then null;
end $$;

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  entity_type public.analytics_entity_type not null default 'PLATFORM',
  event_name text not null,
  actor_id uuid references public.users(id) on delete set null,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  delivery_partner_id uuid references public.delivery_partners(id) on delete set null,
  metric_value numeric(14, 2),
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();

drop trigger if exists set_restaurants_updated_at on public.restaurants;
create trigger set_restaurants_updated_at before update on public.restaurants for each row execute function public.set_updated_at();

drop trigger if exists set_menu_items_updated_at on public.menu_items;
create trigger set_menu_items_updated_at before update on public.menu_items for each row execute function public.set_updated_at();

drop trigger if exists set_delivery_partners_updated_at on public.delivery_partners;
create trigger set_delivery_partners_updated_at before update on public.delivery_partners for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  safe_role public.user_role := 'CUSTOMER';
begin
  if requested_role in ('CUSTOMER', 'RESTAURANT', 'DELIVERY') then
    safe_role := requested_role::public.user_role;
  end if;

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    safe_role
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.favorites enable row level security;
alter table public.analytics enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.users;
drop policy if exists "profiles_update_own_basic_fields" on public.users;
drop policy if exists "users_select_own_or_admin" on public.users;
drop policy if exists "users_update_own_basic_fields" on public.users;
create policy "users_select_own_or_admin" on public.users for select using (auth.uid() = id or public.current_user_role() = 'ADMIN');
create policy "users_update_own_basic_fields" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "restaurants_public_read_active" on public.restaurants;
drop policy if exists "restaurants_owner_all" on public.restaurants;
drop policy if exists "restaurants_admin_all" on public.restaurants;
create policy "restaurants_public_read_active" on public.restaurants for select using (is_active = true and is_verified = true);
create policy "restaurants_owner_all" on public.restaurants for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id and public.current_user_role() = 'RESTAURANT');
create policy "restaurants_admin_all" on public.restaurants for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "menu_items_public_read_available" on public.menu_items;
drop policy if exists "menu_items_restaurant_owner_all" on public.menu_items;
drop policy if exists "menu_items_admin_all" on public.menu_items;
create policy "menu_items_public_read_available" on public.menu_items for select using (
  is_available = true and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.is_active = true and r.is_verified = true)
);
create policy "menu_items_restaurant_owner_all" on public.menu_items for all using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);
create policy "menu_items_admin_all" on public.menu_items for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "delivery_partners_own_read_update" on public.delivery_partners;
drop policy if exists "delivery_partners_admin_all" on public.delivery_partners;
create policy "delivery_partners_own_read_update" on public.delivery_partners for all using (auth.uid() = user_id) with check (auth.uid() = user_id and public.current_user_role() = 'DELIVERY');
create policy "delivery_partners_admin_all" on public.delivery_partners for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "orders_customer_insert" on public.orders;
drop policy if exists "orders_customer_read" on public.orders;
drop policy if exists "orders_restaurant_read" on public.orders;
drop policy if exists "orders_restaurant_update" on public.orders;
drop policy if exists "orders_delivery_partner_read_update" on public.orders;
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_customer_insert" on public.orders for insert with check (auth.uid() = customer_id and public.current_user_role() = 'CUSTOMER');
create policy "orders_customer_read" on public.orders for select using (auth.uid() = customer_id);
create policy "orders_restaurant_read_update" on public.orders for all using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);
create policy "orders_delivery_partner_read_update" on public.orders for all using (
  exists (select 1 from public.delivery_partners d where d.id = delivery_partner_id and d.user_id = auth.uid())
) with check (
  exists (select 1 from public.delivery_partners d where d.id = delivery_partner_id and d.user_id = auth.uid())
);
create policy "orders_admin_all" on public.orders for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "order_items_customer_read" on public.order_items;
drop policy if exists "order_items_restaurant_read" on public.order_items;
drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_customer_read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid())
);
create policy "order_items_restaurant_read" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
    where o.id = order_id and r.owner_id = auth.uid()
  )
);
create policy "order_items_admin_all" on public.order_items for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "reviews_public_read_approved" on public.reviews;
drop policy if exists "reviews_customer_insert" on public.reviews;
drop policy if exists "reviews_customer_update_own_pending" on public.reviews;
drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_public_read_approved" on public.reviews for select using (status = 'APPROVED');
create policy "reviews_customer_insert" on public.reviews for insert with check (auth.uid() = customer_id and public.current_user_role() = 'CUSTOMER');
create policy "reviews_customer_update_own_pending" on public.reviews for update using (auth.uid() = customer_id and status = 'PENDING') with check (auth.uid() = customer_id);
create policy "reviews_admin_all" on public.reviews for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "notifications_user_own" on public.notifications;
drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_user_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_admin_all" on public.notifications for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "favorites_customer_own" on public.favorites;
drop policy if exists "favorites_admin_all" on public.favorites;
create policy "favorites_customer_own" on public.favorites for all using (auth.uid() = customer_id) with check (auth.uid() = customer_id and public.current_user_role() = 'CUSTOMER');
create policy "favorites_admin_all" on public.favorites for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

drop policy if exists "analytics_restaurant_owner_read" on public.analytics;
drop policy if exists "analytics_admin_all" on public.analytics;
create policy "analytics_restaurant_owner_read" on public.analytics for select using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);
create policy "analytics_admin_all" on public.analytics for all using (public.current_user_role() = 'ADMIN') with check (public.current_user_role() = 'ADMIN');

revoke update (role, status) on public.users from anon, authenticated;
grant update (
  full_name,
  phone,
  avatar_url,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  country,
  latitude,
  longitude,
  metadata,
  updated_at
) on public.users to authenticated;

create index if not exists users_role_idx on public.users(role);
create index if not exists users_status_idx on public.users(status);
create index if not exists restaurants_owner_id_idx on public.restaurants(owner_id);
create index if not exists restaurants_active_verified_idx on public.restaurants(is_active, is_verified);
create index if not exists restaurants_cuisine_type_idx on public.restaurants(cuisine_type);
create index if not exists menu_items_restaurant_id_idx on public.menu_items(restaurant_id);
create index if not exists menu_items_available_idx on public.menu_items(is_available);
create index if not exists menu_items_category_idx on public.menu_items(category);
create index if not exists delivery_partners_user_id_idx on public.delivery_partners(user_id);
create index if not exists delivery_partners_status_idx on public.delivery_partners(status);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_restaurant_id_idx on public.orders(restaurant_id);
create index if not exists orders_delivery_partner_id_idx on public.orders(delivery_partner_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_menu_item_id_idx on public.order_items(menu_item_id);
create index if not exists reviews_restaurant_id_idx on public.reviews(restaurant_id);
create index if not exists reviews_customer_id_idx on public.reviews(customer_id);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at) where read_at is null;
create index if not exists favorites_customer_id_idx on public.favorites(customer_id);
create index if not exists favorites_restaurant_id_idx on public.favorites(restaurant_id);
create index if not exists analytics_entity_idx on public.analytics(entity_type, event_name);
create index if not exists analytics_occurred_at_idx on public.analytics(occurred_at desc);
create index if not exists analytics_restaurant_id_idx on public.analytics(restaurant_id);
