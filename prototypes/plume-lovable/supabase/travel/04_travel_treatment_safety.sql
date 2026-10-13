-- Plume Travel · build step 4: Treatment Safety and admin verification.
--
-- Additive only. Any experience offering a treatment names the practitioner and their license.
-- It can't be published until a Plume admin verifies the license, and treatments Plume doesn't
-- allow at events (or as a ticket) can't be published at all. Admins set those rules.
-- Adds policies for one new private storage bucket, travel-licenses.

create table public.travel_treatment_rules (
  treatment_type text primary key check (treatment_type in ('consultation', 'facial', 'massage', 'chemical_peel', 'laser',
    'injectable', 'prescription')),
  label text not null,
  allowed_at_events boolean not null default false,
  allowed_as_ticket boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
insert into public.travel_treatment_rules (treatment_type, label, allowed_at_events, allowed_as_ticket) values
  ('consultation', 'Consultations', true, true),
  ('facial', 'Facials by a licensed esthetician', true, true),
  ('massage', 'Massage by a licensed therapist', true, true),
  ('chemical_peel', 'Chemical peels', false, false),
  ('laser', 'Laser and energy devices', false, false),
  ('injectable', 'Injectables', false, false),
  ('prescription', 'Prescription treatments', false, false);
create trigger travel_treatment_rules_touch before update on public.travel_treatment_rules for each row execute function public.travel_touch();

create table public.travel_experience_treatments (
  experience_id uuid primary key references public.travel_experiences(id) on delete cascade,
  treatment_type text not null references public.travel_treatment_rules(treatment_type),
  practitioner_name text not null check (length(btrim(practitioner_name)) >= 2),
  disclosure text not null default '' check (length(disclosure) <= 2000),
  license_verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- License details are visible to the host and Plume admins only.
create table public.travel_treatment_licenses (
  experience_id uuid primary key references public.travel_experience_treatments(experience_id) on delete cascade,
  license_number text not null check (length(btrim(license_number)) >= 3),
  license_region text not null check (length(btrim(license_region)) >= 2),
  document_path text, -- in the private travel-licenses bucket
  updated_at timestamptz not null default now()
);

alter table public.travel_treatment_rules enable row level security;
alter table public.travel_experience_treatments enable row level security;
alter table public.travel_treatment_licenses enable row level security;
revoke all on public.travel_treatment_rules, public.travel_experience_treatments, public.travel_treatment_licenses
  from anon, authenticated;
grant select on public.travel_treatment_rules, public.travel_experience_treatments to anon, authenticated;
grant update (label, allowed_at_events, allowed_as_ticket) on public.travel_treatment_rules to authenticated;
grant insert (experience_id, treatment_type, practitioner_name, disclosure),
      update (treatment_type, practitioner_name, disclosure), delete
  on public.travel_experience_treatments to authenticated;
grant select, insert, update, delete on public.travel_treatment_licenses to authenticated;

create policy "anyone reads treatment rules" on public.travel_treatment_rules for select using (true);
create policy "admins set treatment rules" on public.travel_treatment_rules for update to authenticated
  using (public.travel_is_admin()) with check (public.travel_is_admin());
create policy "treatments follow their experience" on public.travel_experience_treatments for select
  using (exists (select 1 from public.travel_experiences e where e.id = experience_id));
create policy "hosts manage the treatment" on public.travel_experience_treatments for all to authenticated
  using (public.travel_owns_experience(experience_id)) with check (public.travel_owns_experience(experience_id));
create policy "hosts manage the license" on public.travel_treatment_licenses for all to authenticated
  using (public.travel_owns_experience(experience_id)) with check (public.travel_owns_experience(experience_id));
create policy "admins read licenses" on public.travel_treatment_licenses for select to authenticated
  using (public.travel_is_admin());

-- Any change to the treatment or license clears the verification. A published experience goes
-- back to pending_verification until an admin checks again (booked guests keep their places).
create or replace function public.travel_on_treatment_changed()
returns trigger language plpgsql security definer set search_path = public as $$
declare exp_id uuid := coalesce(new.experience_id, old.experience_id);
begin
  if tg_table_name = 'travel_experience_treatments' then
    new.updated_at := now();
    if tg_op = 'INSERT' or new.treatment_type is distinct from old.treatment_type
       or new.practitioner_name is distinct from old.practitioner_name then
      new.license_verified_at := null;
      new.verified_by := null;
    end if;
  else
    if tg_op = 'UPDATE' then new.updated_at := now(); end if;
    update public.travel_experience_treatments set license_verified_at = null, verified_by = null
     where experience_id = exp_id;
  end if;
  update public.travel_experiences set status = 'pending_verification'
   where id = exp_id and status = 'published';
  return coalesce(new, old);
end $$;
create trigger travel_treatment_changed before insert or update on public.travel_experience_treatments
  for each row execute function public.travel_on_treatment_changed();
create trigger travel_license_changed before insert or update or delete on public.travel_treatment_licenses
  for each row execute function public.travel_on_treatment_changed();

-- Publishing rules for treatments (runs inside travel_publish_experience and admin verification).
create or replace function public.travel_check_treatment_on_publish()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  t public.travel_experience_treatments;
  r public.travel_treatment_rules;
begin
  select * into t from public.travel_experience_treatments where experience_id = new.id;
  if not found then return new; end if;
  select * into r from public.travel_treatment_rules where treatment_type = t.treatment_type;
  if not r.allowed_at_events then
    raise exception 'travel_treatment_not_allowed: % are not allowed at Plume Travel events', r.label;
  end if;
  if new.access_type = 'paid' and not r.allowed_as_ticket then
    raise exception 'travel_treatment_not_allowed_as_ticket: % can''t be sold as a ticket', r.label;
  end if;
  if not exists (select 1 from public.travel_treatment_licenses where experience_id = new.id) then
    raise exception 'travel_license_missing';
  end if;
  if t.license_verified_at is null then
    new.status := 'pending_verification';
    new.published_at := null;
  end if;
  return new;
end $$;
create trigger travel_treatment_publish_check before update of status on public.travel_experiences
  for each row when (new.status = 'published' and old.status is distinct from 'published')
  execute function public.travel_check_treatment_on_publish();

-- ─── Admin ───────────────────────────────────────────────────────────────────

create or replace function public.travel_admin_verify_license(_experience uuid)
returns text language plpgsql security definer set search_path = public as $$
declare result text;
begin
  if not public.travel_is_admin() then raise exception 'travel_admin_only' using errcode = '42501'; end if;
  if not exists (select 1 from public.travel_treatment_licenses where experience_id = _experience) then
    raise exception 'travel_license_missing';
  end if;
  update public.travel_experience_treatments set license_verified_at = now(), verified_by = auth.uid()
   where experience_id = _experience;
  update public.travel_experiences set status = 'published', published_at = now()
   where id = _experience and status = 'pending_verification';
  select status into result from public.travel_experiences where id = _experience;
  return result;
end $$;

-- Send it back to the host as a draft, with a note.
create or replace function public.travel_admin_return_to_host(_experience uuid, _note text)
returns void language plpgsql security definer set search_path = public as $$
declare e public.travel_experiences;
begin
  if not public.travel_is_admin() then raise exception 'travel_admin_only' using errcode = '42501'; end if;
  update public.travel_experiences set status = 'draft', published_at = null
   where id = _experience and status = 'pending_verification' returning * into e;
  if not found then raise exception 'travel_not_pending_verification'; end if;
  perform public.travel_notify(h.owner_id, 'verification', format('%s needs changes before it can be published', e.title),
                               nullif(btrim(_note), ''), e.id)
     from public.travel_hosts h where h.id in (e.host_id, e.co_host_id);
end $$;

-- Private bucket for license documents: <experience_id>/<file>. Hosts upload, admins read.
insert into storage.buckets (id, name, public) values ('travel-licenses', 'travel-licenses', false)
on conflict (id) do nothing;

create or replace function public.travel_folder_uuid(_name text)
returns uuid language sql immutable set search_path = public as $$
  select case when (storage.foldername(_name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then ((storage.foldername(_name))[1])::uuid end
$$;

create policy "travel hosts upload license documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'travel-licenses' and public.travel_owns_experience(public.travel_folder_uuid(name)));
create policy "travel hosts and admins read license documents" on storage.objects for select to authenticated
  using (bucket_id = 'travel-licenses'
         and (public.travel_owns_experience(public.travel_folder_uuid(name)) or public.travel_is_admin()));
create policy "travel hosts remove license documents" on storage.objects for delete to authenticated
  using (bucket_id = 'travel-licenses' and public.travel_owns_experience(public.travel_folder_uuid(name)));

revoke execute on function public.travel_on_treatment_changed(), public.travel_check_treatment_on_publish(),
  public.travel_admin_verify_license(uuid), public.travel_admin_return_to_host(uuid, text), public.travel_folder_uuid(text)
  from public, anon, authenticated;
grant execute on function public.travel_admin_verify_license(uuid), public.travel_admin_return_to_host(uuid, text),
  public.travel_folder_uuid(text) to authenticated;
