create table products (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  price numeric,
  image_url text,
  created_at timestamp default now()
);
