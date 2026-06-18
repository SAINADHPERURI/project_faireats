create type public.user_role as enum ('CUSTOMER', 'RESTAURANT', 'DELIVERY', 'ADMIN');
create type public.order_status as enum ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED');
create type public.delivery_status as enum ('UNASSIGNED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'CUSTOMER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  status public.order_status not null default 'PENDING',
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  courier_id uuid references public.profiles(id) on delete set null,
  status public.delivery_status not null default 'UNASSIGNED',
  created_at timestamptz not null default now()
);

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

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    safe_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.deliveries enable row level security;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "profiles_select_own_or_admin" on public.profiles for select using (
  auth.uid() = id or public.current_user_role() = 'ADMIN'
);

create policy "profiles_update_own_basic_fields" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
revoke update(role) on public.profiles from anon, authenticated;
grant update(email, full_name, updated_at) on public.profiles to authenticated;

create policy "restaurants_public_read_active" on public.restaurants for select using (is_active = true);
create policy "restaurants_owner_all" on public.restaurants for all using (auth.uid() = owner_id) with check (
  auth.uid() = owner_id and public.current_user_role() = 'RESTAURANT'
);
create policy "restaurants_admin_all" on public.restaurants for all using (
  public.current_user_role() = 'ADMIN'
) with check (
  public.current_user_role() = 'ADMIN'
);

create policy "menu_items_public_read_available" on public.menu_items for select using (is_available = true);
create policy "menu_items_restaurant_owner_all" on public.menu_items for all using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
) with check (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);
create policy "menu_items_admin_all" on public.menu_items for all using (
  public.current_user_role() = 'ADMIN'
) with check (
  public.current_user_role() = 'ADMIN'
);

create policy "orders_customer_insert" on public.orders for insert with check (auth.uid() = customer_id and public.current_user_role() = 'CUSTOMER');
create policy "orders_customer_read" on public.orders for select using (auth.uid() = customer_id);
create policy "orders_restaurant_read" on public.orders for select using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);
create policy "orders_restaurant_update" on public.orders for update using (
  exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
);
create policy "orders_admin_all" on public.orders for all using (
  public.current_user_role() = 'ADMIN'
) with check (
  public.current_user_role() = 'ADMIN'
);

create policy "deliveries_courier_read" on public.deliveries for select using (
  public.current_user_role() = 'DELIVERY' and (auth.uid() = courier_id or courier_id is null)
);
create policy "deliveries_courier_update" on public.deliveries for update using (auth.uid() = courier_id and public.current_user_role() = 'DELIVERY') with check (
  auth.uid() = courier_id and public.current_user_role() = 'DELIVERY'
);
create policy "deliveries_admin_all" on public.deliveries for all using (
  public.current_user_role() = 'ADMIN'
) with check (
  public.current_user_role() = 'ADMIN'
);
