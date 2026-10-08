-- Profiles are created automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Creates a workspace owned by the calling user, with a unique booking slug.
create or replace function public.create_business(business_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  base_slug text;
  final_slug text;
  suffix int := 0;
  new_id uuid;
  owner_name text;
  owner_email text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(business_name), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then
    base_slug := 'studio';
  end if;
  final_slug := base_slug;
  while exists (select 1 from public.businesses where slug = final_slug) loop
    suffix := suffix + 1;
    final_slug := base_slug || '-' || suffix;
  end loop;

  insert into public.businesses (name, slug) values (business_name, final_slug) returning id into new_id;
  insert into public.memberships (business_id, user_id, role) values (new_id, uid, 'owner');

  select p.full_name into owner_name from public.profiles p where p.id = uid;
  select u.email into owner_email from auth.users u where u.id = uid;
  insert into public.staff (business_id, user_id, name, email, title, role)
  values (new_id, uid, coalesce(owner_name, 'Owner'), coalesce(owner_email, ''), 'Owner', 'owner');

  return new_id;
end;
$$;

-- Public booking page payload: business, active services and active staff, without private fields.
create or replace function public.get_booking_page(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug, 'industry', b.industry, 'email', b.email,
      'phone', b.phone, 'address', b.address, 'description', b.description, 'timezone', b.timezone,
      'currency', b.currency, 'accentHue', b.accent_hue, 'workingHours', b.working_hours
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'description', s.description, 'category', s.category,
        'durationMin', s.duration_min, 'price', s.price, 'color', s.color
      ) order by s.category, s.name)
      from public.services s where s.business_id = b.id and s.active
    ), '[]'::jsonb),
    'staff', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'name', m.name, 'title', m.title, 'color', m.color, 'serviceIds', m.service_ids
      ) order by m.created_at)
      from public.staff m where m.business_id = b.id and m.active
    ), '[]'::jsonb)
  )
  from public.businesses b
  where b.slug = p_slug;
$$;

-- Busy intervals for the booking page, exposing no client information.
create or replace function public.get_busy_slots(p_slug text, p_from timestamptz, p_to timestamptz)
returns table (staff_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.staff_id, a.starts_at, a.ends_at
  from public.appointments a
  join public.businesses b on b.id = a.business_id
  where b.slug = p_slug
    and a.status not in ('cancelled', 'no_show')
    and a.starts_at < p_to
    and a.ends_at > p_from;
$$;

-- Creates a booking from the public page after validating the slot.
create or replace function public.create_public_booking(
  p_slug text,
  p_service_id uuid,
  p_staff_id uuid,
  p_starts_at timestamptz,
  p_name text,
  p_email text,
  p_phone text default '',
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business public.businesses%rowtype;
  v_service public.services%rowtype;
  v_client_id uuid;
  v_appointment_id uuid;
  v_ends_at timestamptz;
begin
  if char_length(coalesce(p_name, '')) < 2 or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please provide a valid name and email';
  end if;
  if p_starts_at < now() then
    raise exception 'That time is in the past';
  end if;

  select * into v_business from public.businesses where slug = p_slug;
  if not found then raise exception 'Business not found'; end if;

  select * into v_service from public.services where id = p_service_id and business_id = v_business.id and active;
  if not found then raise exception 'Service not available'; end if;

  if not exists (
    select 1 from public.staff
    where id = p_staff_id and business_id = v_business.id and active and p_service_id = any (service_ids)
  ) then
    raise exception 'Staff member not available for this service';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_min);

  if exists (
    select 1 from public.appointments
    where staff_id = p_staff_id
      and status not in ('cancelled', 'no_show')
      and starts_at < v_ends_at
      and ends_at > p_starts_at
  ) then
    raise exception 'That slot was just taken, please pick another time';
  end if;

  select id into v_client_id from public.clients
  where business_id = v_business.id and lower(email) = lower(p_email)
  limit 1;

  if v_client_id is null then
    insert into public.clients (business_id, name, email, phone, status)
    values (v_business.id, p_name, lower(p_email), coalesce(p_phone, ''), 'new')
    returning id into v_client_id;
    insert into public.activity_log (business_id, type, message)
    values (v_business.id, 'client_created', 'New client ' || p_name || ' joined via booking page');
  end if;

  insert into public.appointments (
    business_id, client_id, staff_id, service_id, starts_at, ends_at, status, price, notes, source
  ) values (
    v_business.id, v_client_id, p_staff_id, p_service_id, p_starts_at, v_ends_at, 'confirmed',
    v_service.price, left(coalesce(p_notes, ''), 1000), 'online'
  ) returning id into v_appointment_id;

  insert into public.activity_log (business_id, type, message)
  values (v_business.id, 'booking_created', p_name || ' booked ' || v_service.name);

  return v_appointment_id;
end;
$$;

revoke all on function public.create_business(text) from public, anon;
grant execute on function public.create_business(text) to authenticated;
grant execute on function public.get_booking_page(text) to anon, authenticated;
grant execute on function public.get_busy_slots(text, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.create_public_booking(text, uuid, uuid, timestamptz, text, text, text, text) to anon, authenticated;
