-- Plume Travel · build step 2: experiences, How to Get In, Sensory, Discover.
--
-- Additive only. Creates travel_* tables and functions. It reads (never changes)
-- public.brands, public.clinic_profiles, public.profiles and public.has_role().
-- No existing table, policy, function or route is modified.
--
-- Status values stored: draft, pending_verification, published, cancelled.
-- "Happening now" and "ended" are derived from starts_at / ends_at, never stored.

-- ─── Pre-launch gate ─────────────────────────────────────────────────────────
-- Until launched = true, only Plume admins and the accounts in travel_preview_access can
-- read or write Travel data. This enforces in the database what the /travel "coming soon"
-- screen does in the interface.

create table public.travel_settings (
  id boolean primary key default true check (id),
  launched boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.travel_settings default values;

create table public.travel_preview_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.travel_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
$$;

create or replace function public.travel_is_open()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select launched from public.travel_settings), false)
      or exists (select 1 from public.travel_preview_access where user_id = auth.uid())
      or public.travel_is_admin()
$$;

create or replace function public.travel_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

alter table public.travel_settings enable row level security;
alter table public.travel_preview_access enable row level security;
revoke all on public.travel_settings, public.travel_preview_access from anon, authenticated;
grant select on public.travel_settings to anon, authenticated;
grant select, insert, delete on public.travel_preview_access to authenticated;
create policy "anyone reads travel settings" on public.travel_settings for select using (true);
create policy "admins manage preview access" on public.travel_preview_access for all to authenticated
  using (public.travel_is_admin()) with check (public.travel_is_admin());
create policy "people see their own preview access" on public.travel_preview_access for select to authenticated
  using (user_id = auth.uid());

-- Admins launch Travel (or pause it) with this, rather than editing the table.
create or replace function public.travel_admin_set_launched(_launched boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.travel_is_admin() then raise exception 'travel_admin_only' using errcode = '42501'; end if;
  update public.travel_settings set launched = _launched, updated_at = now();
end $$;

-- ─── Hosts ───────────────────────────────────────────────────────────────────
-- A host is one business account in Travel. Existing Plume brands and clinics link their
-- current profile (brand_id / clinic_profile_id); new host types (spas, resorts, venues…)
-- start without a link. travel_plan is how a paid host plan can be switched on later;
-- the price itself lives in config (TRAVEL_HOST_PRICE_MONTHLY = 0).

create table public.travel_hosts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid unique references public.brands(id) on delete set null,
  clinic_profile_id uuid unique references public.clinic_profiles(id) on delete set null,
  name text not null check (length(btrim(name)) between 2 and 120),
  host_type text not null check (host_type in ('Beauty brand', 'Fragrance house', 'Spa', 'Esthetician studio', 'Med spa',
    'Bathhouse', 'Resort', 'Retreat organizer', 'Venue', 'Plume')),
  city text not null default '',
  country text not null default '',
  bio text not null default '' check (length(bio) <= 2000),
  palette text not null default 'dusk' check (palette in ('peach', 'rose', 'sea', 'amber', 'lilac', 'mint', 'dusk')),
  logo_path text,
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  travel_plan text not null default 'launch_free' check (travel_plan in ('launch_free', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index travel_hosts_owner_idx on public.travel_hosts (owner_id);
create trigger travel_hosts_touch before update on public.travel_hosts for each row execute function public.travel_touch();

create or replace function public.travel_owns_host(_host uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _host is not null and exists (select 1 from public.travel_hosts where id = _host and owner_id = auth.uid())
$$;

create or replace function public.travel_owns_verified_host(_host uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _host is not null and exists (select 1 from public.travel_hosts where id = _host and owner_id = auth.uid() and verified)
$$;

-- A brand or clinic link is only accepted for the account that owns that brand or clinic.
create or replace function public.travel_can_link(_brand uuid, _clinic_profile uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select (_brand is null or exists (select 1 from public.brands where id = _brand and owner_id = auth.uid()))
     and (_clinic_profile is null or exists (select 1 from public.clinic_profiles where id = _clinic_profile and clinic_id = auth.uid()))
$$;

alter table public.travel_hosts enable row level security;
revoke all on public.travel_hosts from anon, authenticated;
grant select on public.travel_hosts to anon, authenticated;
grant insert (owner_id, brand_id, clinic_profile_id, name, host_type, city, country, bio, palette, logo_path)
  on public.travel_hosts to authenticated;
grant update (brand_id, clinic_profile_id, name, host_type, city, country, bio, palette, logo_path)
  on public.travel_hosts to authenticated;

create policy "hosts are visible when Travel is open" on public.travel_hosts for select
  using (public.travel_is_open() or owner_id = auth.uid());
create policy "people create their own host profile" on public.travel_hosts for insert to authenticated
  with check (owner_id = auth.uid() and public.travel_is_open() and host_type <> 'Plume'
              and public.travel_can_link(brand_id, clinic_profile_id));
create policy "owners edit their host profile" on public.travel_hosts for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and host_type <> 'Plume' and public.travel_can_link(brand_id, clinic_profile_id));

create or replace function public.travel_admin_set_host_verified(_host uuid, _verified boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.travel_is_admin() then raise exception 'travel_admin_only' using errcode = '42501'; end if;
  update public.travel_hosts
     set verified = _verified,
         verified_at = case when _verified then now() end,
         verified_by = case when _verified then auth.uid() end
   where id = _host;
end $$;

-- ─── Experiences ─────────────────────────────────────────────────────────────

create table public.travel_experiences (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.travel_hosts(id) on delete cascade,
  co_host_id uuid references public.travel_hosts(id) on delete set null,
  collaboration_id uuid, -- references travel_collaborations, added in step 8
  title text not null default '' check (length(title) <= 140),
  category text not null default 'brand' check (category in ('brand', 'beauty', 'escape', 'retreat')),
  -- How to Get In
  access_type text not null default 'rsvp_guaranteed'
    check (access_type in ('walkin', 'rsvp_guaranteed', 'rsvp_interest', 'paid', 'apply', 'invite')),
  description text not null default '' check (length(description) <= 5000),
  includes text not null default '' check (length(includes) <= 2000),
  cancellation_terms text not null default '' check (length(cancellation_terms) <= 2000),
  price_minor integer check (price_minor >= 0), -- smallest currency unit; KRW has no minor unit
  price_from boolean not null default false,
  currency text not null default 'USD' check (currency in ('EUR', 'USD', 'GBP', 'KRW')),
  capacity integer not null default 0 check (capacity >= 0),
  plus_one_allowed boolean not null default false,
  tried_it boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  recurring text check (recurring in ('daily')),
  timezone text not null default 'UTC',
  -- Place
  address text not null default '',
  neighborhood text not null default '',
  city text not null default '',
  country text not null default '',
  continent text not null default '',
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  -- Sensory: host-provided. null / '' means "Not provided" and is never assumed or scored.
  energy text check (energy in ('Quiet', 'Social', 'Reflective', 'Lively')), -- the primary atmosphere
  fragrance text check (fragrance in ('None', 'Light', 'Strong')),
  fragrance_note text not null default '',
  group_size text check (group_size in ('Small', 'Medium', 'Large')),
  group_note text not null default '',
  touch text check (touch in ('None', 'Optional', 'Part of the experience', 'Consultations only')),
  touch_note text not null default '',
  setting text not null default '',
  music text not null default '',
  -- Presentation
  palette text not null default 'dusk' check (palette in ('peach', 'rose', 'sea', 'amber', 'lilac', 'mint', 'dusk')),
  cover_path text,
  featured boolean not null default false,
  -- Fields of a co-hosted draft that the hosts haven't confirmed yet.
  unconfirmed text[] not null default '{}' check (unconfirmed <@ array['time', 'admission', 'address']),
  status text not null default 'draft' check (status in ('draft', 'pending_verification', 'published', 'cancelled')),
  published_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (co_host_id is null or co_host_id <> host_id)
);
create index travel_experiences_discover_idx on public.travel_experiences (status, starts_at);
create index travel_experiences_city_idx on public.travel_experiences (lower(city));
create index travel_experiences_country_idx on public.travel_experiences (lower(country));
create index travel_experiences_host_idx on public.travel_experiences (host_id);
create index travel_experiences_cohost_idx on public.travel_experiences (co_host_id);
create trigger travel_experiences_touch before update on public.travel_experiences for each row execute function public.travel_touch();

create or replace function public.travel_owns_experience(_experience uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.travel_experiences e
     join public.travel_hosts h on h.id in (e.host_id, e.co_host_id)
     where e.id = _experience and h.owner_id = auth.uid()
  )
$$;

alter table public.travel_experiences enable row level security;
revoke all on public.travel_experiences from anon, authenticated;
grant select on public.travel_experiences to anon, authenticated;
-- status, featured, hosts and collaboration are never written directly: publishing,
-- cancelling and co-hosting go through the functions below and in later steps.
grant insert (host_id, title, category, access_type, description, includes, cancellation_terms, price_minor, price_from,
  currency, capacity, plus_one_allowed, tried_it, starts_at, ends_at, recurring, timezone, address, neighborhood, city,
  country, continent, latitude, longitude, energy, fragrance, fragrance_note, group_size, group_note, touch, touch_note,
  setting, music, palette, cover_path)
  on public.travel_experiences to authenticated;
grant update (title, category, access_type, description, includes, cancellation_terms, price_minor, price_from,
  currency, capacity, plus_one_allowed, tried_it, starts_at, ends_at, recurring, timezone, address, neighborhood, city,
  country, continent, latitude, longitude, energy, fragrance, fragrance_note, group_size, group_note, touch, touch_note,
  setting, music, palette, cover_path, unconfirmed)
  on public.travel_experiences to authenticated;
grant delete on public.travel_experiences to authenticated;

create policy "published experiences are visible when Travel is open" on public.travel_experiences for select
  using (status = 'published' and public.travel_is_open());
create policy "hosts and co-hosts see their own experiences" on public.travel_experiences for select to authenticated
  using (public.travel_owns_host(host_id) or public.travel_owns_host(co_host_id));
create policy "admins see every experience" on public.travel_experiences for select to authenticated
  using (public.travel_is_admin());
create policy "hosts create drafts" on public.travel_experiences for insert to authenticated
  with check (public.travel_owns_host(host_id) and public.travel_is_open());
create policy "hosts and co-hosts edit their experiences" on public.travel_experiences for update to authenticated
  using ((public.travel_owns_host(host_id) or public.travel_owns_host(co_host_id)) and status <> 'cancelled')
  with check (public.travel_owns_host(host_id) or public.travel_owns_host(co_host_id));
create policy "hosts delete their own unshared drafts" on public.travel_experiences for delete to authenticated
  using (public.travel_owns_host(host_id) and status = 'draft' and collaboration_id is null);

-- Time slots (for events with timed entry).
create table public.travel_slots (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.travel_experiences(id) on delete cascade,
  starts_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  unique (experience_id, starts_at)
);
alter table public.travel_slots enable row level security;
revoke all on public.travel_slots from anon, authenticated;
grant select on public.travel_slots to anon, authenticated;
grant insert, update, delete on public.travel_slots to authenticated;
create policy "slots follow their experience" on public.travel_slots for select
  using (exists (select 1 from public.travel_experiences e where e.id = experience_id));
create policy "hosts manage slots" on public.travel_slots for all to authenticated
  using (public.travel_owns_experience(experience_id)) with check (public.travel_owns_experience(experience_id));

-- Products featured at an experience. product_id optionally links a product already in the Plume shop.
create table public.travel_experience_products (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.travel_experiences(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  price_label text not null default '',
  product_id uuid references public.products(id) on delete set null,
  palette text not null default 'lilac' check (palette in ('peach', 'rose', 'sea', 'amber', 'lilac', 'mint', 'dusk')),
  position integer not null default 0
);
create index travel_experience_products_exp_idx on public.travel_experience_products (experience_id);
alter table public.travel_experience_products enable row level security;
revoke all on public.travel_experience_products from anon, authenticated;
grant select on public.travel_experience_products to anon, authenticated;
grant insert, update, delete on public.travel_experience_products to authenticated;
create policy "products follow their experience" on public.travel_experience_products for select
  using (exists (select 1 from public.travel_experiences e where e.id = experience_id));
create policy "hosts manage featured products" on public.travel_experience_products for all to authenticated
  using (public.travel_owns_experience(experience_id)) with check (public.travel_owns_experience(experience_id));

-- Sensory Match: how a beauty lover likes to feel, on the same 0–2 scales. Private to her.
create table public.travel_sensory_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  energy smallint not null check (energy between 0 and 2),
  fragrance smallint not null check (fragrance between 0 and 2),
  group_size smallint not null check (group_size between 0 and 2),
  touch smallint not null check (touch between 0 and 2),
  updated_at timestamptz not null default now()
);
create trigger travel_sensory_profiles_touch before update on public.travel_sensory_profiles for each row execute function public.travel_touch();
alter table public.travel_sensory_profiles enable row level security;
revoke all on public.travel_sensory_profiles from anon, authenticated;
grant select, insert, update, delete on public.travel_sensory_profiles to authenticated;
create policy "people manage their own sensory profile" on public.travel_sensory_profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Publishing ──────────────────────────────────────────────────────────────
-- The same ten required checks as lib/publish.ts. They are separate from any planning
-- checklist: a missing address blocks publishing, unfinished gift bags don't.

create or replace function public.travel_publication_problems(_experience uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select array_remove(array[
    case when length(btrim(e.title)) < 4 then 'title' end,
    case when length(btrim(e.description)) < 40 then 'description' end,
    case when btrim(e.address) = '' or 'address' = any(e.unconfirmed) then 'address' end,
    case when e.starts_at is null or e.ends_at is null or 'time' = any(e.unconfirmed) then 'time' end,
    case when e.capacity <= 0 then 'capacity' end,
    case when 'admission' = any(e.unconfirmed) then 'admission' end,
    case when btrim(e.includes) = '' then 'includes' end,
    case when e.access_type = 'paid' and coalesce(e.price_minor, 0) <= 0 then 'price' end,
    case when e.energy is null then 'sensory' end,
    case when btrim(e.cancellation_terms) = '' then 'cancellation' end
  ], null)
  from public.travel_experiences e where e.id = _experience
$$;

-- Publishing is its own action. Later steps add rules with triggers on this status change
-- (treatment verification in step 4, follower alerts in step 5, co-host approvals in step 8).
create or replace function public.travel_publish_experience(_experience uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  problems text[];
  result text;
begin
  if not (public.travel_owns_experience(_experience) or public.travel_is_admin()) then
    raise exception 'travel_not_your_experience' using errcode = '42501';
  end if;
  if not public.travel_is_open() then raise exception 'travel_not_open' using errcode = '42501'; end if;
  if not exists (select 1 from public.travel_experiences where id = _experience and status = 'draft') then
    raise exception 'travel_not_a_draft';
  end if;
  problems := public.travel_publication_problems(_experience);
  if cardinality(problems) > 0 then
    raise exception 'travel_publication_blocked: %', array_to_string(problems, ', ');
  end if;
  update public.travel_experiences set status = 'published', published_at = now()
   where id = _experience returning status into result;
  return result; -- 'published', or 'pending_verification' once step 4 is in place
end $$;

create or replace function public.travel_cancel_experience(_experience uuid, _reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.travel_owns_experience(_experience) or public.travel_is_admin()) then
    raise exception 'travel_not_your_experience' using errcode = '42501';
  end if;
  update public.travel_experiences
     set status = 'cancelled', cancelled_at = now(), cancel_reason = nullif(btrim(_reason), '')
   where id = _experience and status <> 'cancelled';
end $$;

-- Admin: feature an experience on Discover.
create or replace function public.travel_admin_set_featured(_experience uuid, _featured boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.travel_is_admin() then raise exception 'travel_admin_only' using errcode = '42501'; end if;
  update public.travel_experiences set featured = _featured where id = _experience;
end $$;

-- What the /travel layout needs to decide between "coming soon" and the app.
create or replace function public.travel_my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'launched', coalesce((select launched from public.travel_settings), false),
    'is_admin', public.travel_is_admin(),
    'can_preview', public.travel_is_open(),
    'host_ids', coalesce((select jsonb_agg(id order by created_at) from public.travel_hosts where owner_id = auth.uid()), '[]'::jsonb)
  )
$$;

-- Functions are callable only by signed-in people unless noted.
revoke execute on function public.travel_is_admin(), public.travel_is_open(), public.travel_owns_host(uuid),
  public.travel_owns_verified_host(uuid), public.travel_can_link(uuid, uuid), public.travel_owns_experience(uuid),
  public.travel_publication_problems(uuid), public.travel_publish_experience(uuid),
  public.travel_cancel_experience(uuid, text), public.travel_admin_set_featured(uuid, boolean),
  public.travel_admin_set_launched(boolean), public.travel_admin_set_host_verified(uuid, boolean),
  public.travel_my_access()
  from public, anon;
grant execute on function public.travel_is_admin(), public.travel_is_open(), public.travel_owns_host(uuid),
  public.travel_owns_verified_host(uuid), public.travel_can_link(uuid, uuid), public.travel_owns_experience(uuid),
  public.travel_publication_problems(uuid), public.travel_publish_experience(uuid),
  public.travel_cancel_experience(uuid, text), public.travel_admin_set_featured(uuid, boolean),
  public.travel_admin_set_launched(boolean), public.travel_admin_set_host_verified(uuid, boolean),
  public.travel_my_access()
  to authenticated;
-- Policies evaluated for signed-out visitors call this one.
grant execute on function public.travel_is_open() to anon;
