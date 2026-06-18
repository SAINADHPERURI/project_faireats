create extension if not exists pgcrypto;

with seed_users as (
  select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid as id,
         'customer' || n || '@faireats.test' as email,
         'Customer ' || n as full_name,
         'CUSTOMER'::public.user_role as role
  from generate_series(1001, 1030) n
  union all
  select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
         'restaurant-owner' || (n - 2000) || '@faireats.test',
         'Restaurant Owner ' || (n - 2000),
         'RESTAURANT'::public.user_role
  from generate_series(2001, 2020) n
  union all
  select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
         'courier' || (n - 3000) || '@faireats.test',
         'Delivery Partner ' || (n - 3000),
         'DELIVERY'::public.user_role
  from generate_series(3001, 3020) n
  union all
  select '00000000-0000-0000-0000-000000009999'::uuid,
         'admin@faireats.test',
         'FairEats Admin',
         'ADMIN'::public.user_role
)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select id,
       '00000000-0000-0000-0000-000000000000'::uuid,
       'authenticated',
       'authenticated',
       email,
       crypt('Password123!', gen_salt('bf')),
       now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', full_name, 'role', role, 'email_verified', true),
       now(),
       now()
from seed_users
on conflict (id) do update
set email = excluded.email,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

with seed_users as (
  select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid as id,
         'customer' || n || '@faireats.test' as email,
         'Customer ' || n as full_name,
         'CUSTOMER'::public.user_role as role,
         n as seq
  from generate_series(1001, 1030) n
  union all
  select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
         'restaurant-owner' || (n - 2000) || '@faireats.test',
         'Restaurant Owner ' || (n - 2000),
         'RESTAURANT'::public.user_role,
         n
  from generate_series(2001, 2020) n
  union all
  select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
         'courier' || (n - 3000) || '@faireats.test',
         'Delivery Partner ' || (n - 3000),
         'DELIVERY'::public.user_role,
         n
  from generate_series(3001, 3020) n
  union all
  select '00000000-0000-0000-0000-000000009999'::uuid,
         'admin@faireats.test',
         'FairEats Admin',
         'ADMIN'::public.user_role,
         9999
)
insert into public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  city,
  state,
  postal_code,
  country,
  metadata
)
select id,
       email,
       full_name,
       role,
       'ACTIVE'::public.user_status,
       '+1-555-' || lpad((seq % 10000)::text, 4, '0'),
       'Fair City',
       'CA',
       '940' || lpad((seq % 100)::text, 2, '0'),
       'US',
       jsonb_build_object('seeded', true)
from seed_users
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

with names as (
  select *
  from unnest(array[
    'Green Curry House',
    'Urban Tandoor',
    'Pasta Junction',
    'Sushi Harbor',
    'Taco Vista',
    'Burger Foundry',
    'Noodle Street',
    'Mediterranean Table',
    'Pizza Orchard',
    'Dosa District',
    'Pho Lantern',
    'Salad Society',
    'BBQ Yard',
    'Ramen Theory',
    'Biryani Bureau',
    'Falafel Works',
    'Wok Avenue',
    'Breakfast Barn',
    'Kebab Corner',
    'Vegan Valley'
  ]) with ordinality as t(name, n)
)
insert into public.restaurants (
  id,
  owner_id,
  name,
  slug,
  legal_name,
  description,
  cuisine_type,
  phone,
  email,
  address_line1,
  city,
  state,
  postal_code,
  country,
  latitude,
  longitude,
  opening_hours,
  commission_rate_bps,
  min_order_cents,
  delivery_fee_cents,
  average_prep_time_minutes,
  rating_avg,
  rating_count,
  is_active,
  is_verified,
  metadata
)
select ('00000000-0000-0000-0000-' || lpad((4000 + n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((2000 + n)::text, 12, '0'))::uuid,
       name,
       lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')),
       name || ' LLC',
       'Seeded FairEats restaurant serving ' || name || ' favorites.',
       (array['Indian','Italian','Japanese','Mexican','American','Thai','Mediterranean','Vietnamese','Healthy','Middle Eastern'])[((n - 1) % 10) + 1],
       '+1-555-20' || lpad(n::text, 2, '0'),
       'restaurant' || n || '@faireats.test',
       n || ' Market Street',
       'Fair City',
       'CA',
       '941' || lpad(n::text, 2, '0'),
       'US',
       37.700000 + (n * 0.003),
       -122.400000 - (n * 0.003),
       '{"mon":"09:00-22:00","tue":"09:00-22:00","wed":"09:00-22:00","thu":"09:00-22:00","fri":"09:00-23:00","sat":"10:00-23:00","sun":"10:00-21:00"}'::jsonb,
       1500,
       1000 + (n * 50),
       199 + (n * 10),
       20 + (n % 15),
       round((4.0 + (n % 10) * 0.08)::numeric, 2),
       20 + n,
       true,
       true,
       jsonb_build_object('seeded', true)
from names
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    description = excluded.description,
    cuisine_type = excluded.cuisine_type,
    is_active = true,
    is_verified = true,
    updated_at = now();

with item_names as (
  select *
  from unnest(array[
    'Signature Bowl','Spiced Flatbread','Crispy Starter','House Noodles','Garden Salad',
    'Classic Burger','Paneer Wrap','Margherita Pizza','Salmon Roll','Chicken Tacos',
    'Masala Dosa','Pho Special','Falafel Plate','BBQ Platter','Ramen Bowl',
    'Biryani Box','Veggie Wok','Breakfast Stack','Kebab Plate','Vegan Curry',
    'Thai Basil Rice','Pesto Pasta','California Roll','Loaded Nachos','Smash Burger',
    'Miso Soup','Greek Gyro','Quinoa Bowl','Pulled Pork Bun','Udon Stir Fry',
    'Butter Chicken','Hummus Trio','Schezwan Noodles','Avocado Toast','Tofu Skewers',
    'Mango Lassi','Tiramisu Cup','Matcha Cheesecake','Churros','Brownie Sundae',
    'Lemonade','Cold Brew','Iced Tea','Coconut Water','Sparkling Lime',
    'Kids Pasta','Mini Burger','Fruit Bowl','Soup Combo','Chef Special'
  ]) with ordinality as t(name, n)
)
insert into public.menu_items (
  id,
  restaurant_id,
  name,
  slug,
  description,
  category,
  price_cents,
  currency,
  calories,
  dietary_tags,
  sort_order,
  is_available,
  metadata
)
select ('00000000-0000-0000-0000-' || lpad((5000 + n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((4000 + (((n - 1) % 20) + 1))::text, 12, '0'))::uuid,
       name,
       lower(regexp_replace(name || '-' || n, '[^a-zA-Z0-9]+', '-', 'g')),
       'Seeded menu item for FairEats testing.',
       (array['Appetizers','Mains','Bowls','Desserts','Drinks'])[((n - 1) % 5) + 1],
       699 + (n * 37),
       'USD',
       250 + (n * 8),
       case when n % 4 = 0 then array['vegetarian']::text[] when n % 5 = 0 then array['gluten-free']::text[] else '{}'::text[] end,
       n,
       true,
       jsonb_build_object('seeded', true)
from item_names
on conflict (id) do update
set name = excluded.name,
    restaurant_id = excluded.restaurant_id,
    price_cents = excluded.price_cents,
    is_available = true,
    updated_at = now();

insert into public.delivery_partners (
  id,
  user_id,
  status,
  vehicle_type,
  vehicle_number,
  license_number,
  current_latitude,
  current_longitude,
  rating_avg,
  rating_count,
  completed_deliveries,
  metadata
)
select ('00000000-0000-0000-0000-' || lpad((6000 + n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((3000 + n)::text, 12, '0'))::uuid,
       (array['AVAILABLE','BUSY','OFFLINE'])[((n - 1) % 3) + 1]::public.delivery_partner_status,
       (array['Bike','Scooter','Car'])[((n - 1) % 3) + 1],
       'FE-' || lpad(n::text, 4, '0'),
       'DL-' || lpad((7000 + n)::text, 6, '0'),
       37.710000 + (n * 0.002),
       -122.410000 - (n * 0.002),
       round((4.1 + (n % 8) * 0.08)::numeric, 2),
       10 + n,
       50 + (n * 3),
       jsonb_build_object('seeded', true)
from generate_series(1, 20) n
on conflict (id) do update
set status = excluded.status,
    vehicle_type = excluded.vehicle_type,
    completed_deliveries = excluded.completed_deliveries,
    updated_at = now();

insert into public.orders (
  id,
  order_number,
  customer_id,
  restaurant_id,
  delivery_partner_id,
  status,
  payment_status,
  payment_method,
  subtotal_cents,
  tax_cents,
  delivery_fee_cents,
  discount_cents,
  tip_cents,
  total_cents,
  delivery_address_line1,
  delivery_city,
  delivery_state,
  delivery_postal_code,
  delivery_country,
  placed_at,
  accepted_at,
  delivered_at,
  metadata,
  created_at
)
select ('00000000-0000-0000-0000-' || lpad((7000 + n)::text, 12, '0'))::uuid,
       'FE-SEED-' || lpad(n::text, 5, '0'),
       ('00000000-0000-0000-0000-' || lpad((1000 + (((n - 1) % 30) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((4000 + (((n - 1) % 20) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((6000 + (((n - 1) % 20) + 1))::text, 12, '0'))::uuid,
       (array['PENDING','ACCEPTED','PREPARING','READY','PICKED_UP','DELIVERED','CANCELLED'])[((n - 1) % 7) + 1]::public.order_status,
       (case when n % 11 = 0 then 'FAILED' else 'PAID' end)::public.payment_status,
       (array['card','wallet','cash'])[((n - 1) % 3) + 1],
       0,
       0,
       299,
       case when n % 10 = 0 then 250 else 0 end,
       case when n % 3 = 0 then 200 else 0 end,
       0,
       n || ' Customer Lane',
       'Fair City',
       'CA',
       '940' || lpad((n % 99)::text, 2, '0'),
       'US',
       now() - (n || ' hours')::interval,
       now() - ((n - 1) || ' hours')::interval,
       case when n % 7 = 6 then now() - ((n - 2) || ' hours')::interval else null end,
       jsonb_build_object('seeded', true),
       now() - (n || ' hours')::interval
from generate_series(1, 100) n
on conflict (id) do update
set status = excluded.status,
    payment_status = excluded.payment_status,
    updated_at = now();

insert into public.order_items (
  id,
  order_id,
  menu_item_id,
  restaurant_id,
  item_name,
  unit_price_cents,
  quantity,
  line_total_cents,
  metadata
)
select ('00000000-0000-0000-0000-' || lpad((8000 + ((order_n - 1) * 2) + item_n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((7000 + order_n)::text, 12, '0'))::uuid,
       mi.id,
       mi.restaurant_id,
       mi.name,
       mi.price_cents,
       1 + ((order_n + item_n) % 3),
       mi.price_cents * (1 + ((order_n + item_n) % 3)),
       jsonb_build_object('seeded', true)
from generate_series(1, 100) order_n
cross join generate_series(1, 2) item_n
join lateral (
  select *
  from public.menu_items
  where restaurant_id = ('00000000-0000-0000-0000-' || lpad((4000 + (((order_n - 1) % 20) + 1))::text, 12, '0'))::uuid
  order by sort_order, id
  offset (item_n - 1)
  limit 1
) mi on true
on conflict (id) do update
set quantity = excluded.quantity,
    line_total_cents = excluded.line_total_cents;

with totals as (
  select order_id, sum(line_total_cents)::integer as subtotal_cents
  from public.order_items
  group by order_id
)
update public.orders o
set subtotal_cents = t.subtotal_cents,
    tax_cents = round(t.subtotal_cents * 0.0825)::integer,
    total_cents = greatest(t.subtotal_cents + round(t.subtotal_cents * 0.0825)::integer + o.delivery_fee_cents + o.tip_cents - o.discount_cents, 0),
    updated_at = now()
from totals t
where t.order_id = o.id;

insert into public.reviews (
  id,
  order_id,
  customer_id,
  restaurant_id,
  delivery_partner_id,
  rating,
  delivery_rating,
  comment,
  status,
  metadata
)
select ('00000000-0000-0000-0000-' || lpad((9000 + n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((7000 + n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((1000 + (((n - 1) % 30) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((4000 + (((n - 1) % 20) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((6000 + (((n - 1) % 20) + 1))::text, 12, '0'))::uuid,
       4 + (n % 2),
       4 + ((n + 1) % 2),
       'Seeded review ' || n,
       'APPROVED'::public.review_status,
       jsonb_build_object('seeded', true)
from generate_series(1, 30) n
on conflict (id) do update
set rating = excluded.rating,
    comment = excluded.comment,
    status = excluded.status,
    updated_at = now();

insert into public.notifications (
  id,
  user_id,
  type,
  title,
  body,
  payload,
  read_at
)
select ('00000000-0000-0000-0000-' || lpad((10000 + n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((1000 + (((n - 1) % 30) + 1))::text, 12, '0'))::uuid,
       (array['ORDER','DELIVERY','PAYMENT','SYSTEM'])[((n - 1) % 4) + 1]::public.notification_type,
       'FairEats update ' || n,
       'Seeded notification for testing.',
       jsonb_build_object('seeded', true, 'sequence', n),
       case when n % 3 = 0 then now() else null end
from generate_series(1, 60) n
on conflict (id) do update
set title = excluded.title,
    body = excluded.body,
    read_at = excluded.read_at;

insert into public.favorites (
  id,
  customer_id,
  restaurant_id
)
select ('00000000-0000-0000-0000-' || lpad((11000 + n)::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((1000 + (((n - 1) % 30) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((4000 + (((n * 7 - 1) % 20) + 1))::text, 12, '0'))::uuid
from generate_series(1, 60) n
on conflict (customer_id, restaurant_id) do nothing;

insert into public.analytics (
  id,
  entity_type,
  event_name,
  actor_id,
  restaurant_id,
  order_id,
  delivery_partner_id,
  metric_value,
  properties,
  occurred_at
)
select ('00000000-0000-0000-0000-' || lpad((12000 + n)::text, 12, '0'))::uuid,
       (array['ORDER','RESTAURANT','DELIVERY_PARTNER','PLATFORM'])[((n - 1) % 4) + 1]::public.analytics_entity_type,
       (array['order_created','order_delivered','restaurant_viewed','courier_assigned'])[((n - 1) % 4) + 1],
       ('00000000-0000-0000-0000-' || lpad((1000 + (((n - 1) % 30) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((4000 + (((n - 1) % 20) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((7000 + (((n - 1) % 100) + 1))::text, 12, '0'))::uuid,
       ('00000000-0000-0000-0000-' || lpad((6000 + (((n - 1) % 20) + 1))::text, 12, '0'))::uuid,
       round((10 + n * 1.25)::numeric, 2),
       jsonb_build_object('seeded', true, 'sequence', n),
       now() - (n || ' minutes')::interval
from generate_series(1, 120) n
on conflict (id) do update
set event_name = excluded.event_name,
    metric_value = excluded.metric_value,
    properties = excluded.properties;
