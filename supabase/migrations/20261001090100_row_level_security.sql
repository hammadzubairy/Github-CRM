-- Every business only sees its own data. Membership is the single source of truth.

create or replace function public.is_member(target_business uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.business_id = target_business and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_role(target_business uuid, allowed public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.business_id = target_business
      and m.user_id = (select auth.uid())
      and m.role = any (allowed)
  );
$$;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.memberships enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.client_notes enable row level security;
alter table public.appointments enable row level security;
alter table public.invoices enable row level security;
alter table public.activity_log enable row level security;

-- Profiles: users manage only their own profile.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Businesses: members read, owners and admins edit. Creation goes through create_business().
create policy "businesses_select_members" on public.businesses
  for select to authenticated using (public.is_member(id));
create policy "businesses_update_admins" on public.businesses
  for update to authenticated
  using (public.has_role(id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_role(id, array['owner', 'admin']::public.member_role[]));
create policy "businesses_delete_owner" on public.businesses
  for delete to authenticated using (public.has_role(id, array['owner']::public.member_role[]));

-- Memberships: members see the team, owners and admins manage it.
create policy "memberships_select_members" on public.memberships
  for select to authenticated using (public.is_member(business_id));
create policy "memberships_manage_admins" on public.memberships
  for all to authenticated
  using (public.has_role(business_id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_role(business_id, array['owner', 'admin']::public.member_role[]));

-- Staff and services: everyone in the business reads, owners and admins write.
create policy "staff_select_members" on public.staff
  for select to authenticated using (public.is_member(business_id));
create policy "staff_write_admins" on public.staff
  for all to authenticated
  using (public.has_role(business_id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_role(business_id, array['owner', 'admin']::public.member_role[]));

create policy "services_select_members" on public.services
  for select to authenticated using (public.is_member(business_id));
create policy "services_write_admins" on public.services
  for all to authenticated
  using (public.has_role(business_id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_role(business_id, array['owner', 'admin']::public.member_role[]));

-- Day-to-day data: any member of the business can read and write.
create policy "clients_members" on public.clients
  for all to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy "client_notes_members" on public.client_notes
  for all to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy "appointments_members" on public.appointments
  for all to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy "activity_members" on public.activity_log
  for all to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id));

-- Invoices are written by the Stripe webhook (service role) and read by members.
create policy "invoices_select_members" on public.invoices
  for select to authenticated using (public.is_member(business_id));
