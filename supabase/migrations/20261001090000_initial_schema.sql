-- FlowDesk core schema
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'staff');
create type public.appointment_status as enum ('confirmed', 'pending', 'completed', 'cancelled', 'no_show');
create type public.client_status as enum ('new', 'active', 'vip', 'inactive');
create type public.plan_id as enum ('free', 'pro', 'business');
create type public.billing_interval as enum ('monthly', 'yearly');
create type public.industry as enum ('salon', 'clinic', 'consulting');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  title text not null default 'Owner',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  industry public.industry not null default 'salon',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  description text not null default '',
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  accent_hue integer not null default 280,
  plan public.plan_id not null default 'free',
  plan_interval public.billing_interval not null default 'monthly',
  current_period_end timestamptz,
  working_hours jsonb not null default '[
    {"day":0,"open":false,"start":"10:00","end":"16:00"},
    {"day":1,"open":true,"start":"09:00","end":"18:00"},
    {"day":2,"open":true,"start":"09:00","end":"18:00"},
    {"day":3,"open":true,"start":"09:00","end":"18:00"},
    {"day":4,"open":true,"start":"09:00","end":"18:00"},
    {"day":5,"open":true,"start":"09:00","end":"18:00"},
    {"day":6,"open":false,"start":"10:00","end":"16:00"}
  ]'::jsonb,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now()
);

create table public.memberships (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null default '',
  title text not null default '',
  role public.member_role not null default 'staff',
  color text not null default '#6366f1',
  service_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text not null default '',
  category text not null default 'General',
  duration_min integer not null check (duration_min between 5 and 600),
  price numeric(10, 2) not null default 0 check (price >= 0),
  color text not null default '#6366f1',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  status public.client_status not null default 'new',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.client_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  author text not null default '',
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  staff_id uuid references public.staff (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'confirmed',
  price numeric(10, 2) not null default 0,
  notes text not null default '',
  source text not null default 'manual' check (source in ('online', 'manual')),
  created_at timestamptz not null default now(),
  constraint appointments_valid_range check (ends_at > starts_at)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  number text not null,
  amount numeric(10, 2) not null,
  status text not null default 'paid' check (status in ('paid', 'open', 'void')),
  plan public.plan_id not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  stripe_invoice_id text unique,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index memberships_user_idx on public.memberships (user_id);
create index staff_business_idx on public.staff (business_id);
create index services_business_idx on public.services (business_id);
create index clients_business_idx on public.clients (business_id);
create index clients_business_email_idx on public.clients (business_id, lower(email));
create index client_notes_client_idx on public.client_notes (client_id);
create index appointments_business_start_idx on public.appointments (business_id, starts_at);
create index appointments_staff_start_idx on public.appointments (staff_id, starts_at);
create index appointments_client_idx on public.appointments (client_id);
create index invoices_business_idx on public.invoices (business_id, created_at desc);
create index activity_business_idx on public.activity_log (business_id, created_at desc);
