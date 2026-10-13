-- Test harness: signs in as a test account and records pass/fail. Test-only.
create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;
create table tests.results (n serial, label text, ok boolean, detail text);
grant insert, select on tests.results to anon, authenticated, service_role;
grant usage on sequence tests.results_n_seq to anon, authenticated, service_role;

-- Accounts used by every test file.
create table tests.who (name text primary key, id uuid not null);
grant select on tests.who to anon, authenticated, service_role;
create function tests.id(_name text) returns uuid language sql stable as $$ select id from tests.who where name = _name $$;
grant execute on function tests.id(text) to anon, authenticated, service_role;

-- Sign in (sets auth.uid()) and switch to the authenticated role. 'anon' signs out.
create function tests.login(_name text) returns void language plpgsql as $$
begin
  if _name = 'anon' then
    perform set_config('request.jwt.claim.sub', '', false);
    perform set_config('role', 'anon', false);
  elsif _name = 'service' then
    perform set_config('request.jwt.claim.sub', '', false);
    perform set_config('role', 'service_role', false);
  else
    perform set_config('request.jwt.claim.sub', tests.id(_name)::text, false);
    perform set_config('role', 'authenticated', false);
  end if;
end $$;
grant execute on function tests.login(text) to anon, authenticated, service_role;

create function tests.ok(_cond boolean, _label text) returns void language plpgsql as $$
begin
  insert into tests.results (label, ok, detail) values (_label, coalesce(_cond, false), case when _cond is null then 'null' end);
end $$;
grant execute on function tests.ok(boolean, text) to anon, authenticated, service_role;

-- Run SQL as the current role and expect it to fail with a message matching _pattern.
create function tests.fails(_sql text, _pattern text, _label text) returns void language plpgsql as $$
begin
  execute _sql;
  insert into tests.results (label, ok, detail) values (_label, false, 'no error');
exception when others then
  insert into tests.results (label, ok, detail) values (_label, sqlerrm ~* _pattern, sqlerrm);
end $$;
grant execute on function tests.fails(text, text, text) to anon, authenticated, service_role;

-- Run SQL and expect no error.
create function tests.runs(_sql text, _label text) returns void language plpgsql as $$
begin
  execute _sql;
  insert into tests.results (label, ok) values (_label, true);
exception when others then
  insert into tests.results (label, ok, detail) values (_label, false, sqlerrm);
end $$;
grant execute on function tests.runs(text, text) to anon, authenticated, service_role;

-- A scratch table each test can stash ids in.
create table tests.v (k text primary key, id uuid);
grant select, insert, update on tests.v to anon, authenticated, service_role;
create function tests.v(_k text) returns uuid language sql stable as $$ select id from tests.v where k = _k $$;
grant execute on function tests.v(text) to anon, authenticated, service_role;
create function tests.keep(_k text, _id uuid) returns uuid language sql as $$
  insert into tests.v values (_k, _id) on conflict (k) do update set id = excluded.id returning id $$;
grant execute on function tests.keep(text, uuid) to anon, authenticated, service_role;

-- Seed accounts (as postgres). Inserting into auth.users runs the app's own profile triggers.
insert into tests.who values
  ('admin', gen_random_uuid()), ('lumen', gen_random_uuid()), ('aube', gen_random_uuid()),
  ('amara', gen_random_uuid()), ('jules', gen_random_uuid()), ('stranger', gen_random_uuid()),
  ('rival', gen_random_uuid());
insert into auth.users (id, email) select id, name || '@test.plume' from tests.who;
update public.profiles p set display_name = initcap(w.name) from tests.who w where p.id = w.id;
insert into public.user_roles (user_id, role) values (tests.id('admin'), 'admin');
insert into public.brands (owner_id, name, slug) values (tests.id('lumen'), 'Lumen Aesthetics', 'lumen');
insert into public.brands (owner_id, name, slug) values (tests.id('rival'), 'Rival Beauty', 'rival');
insert into public.clinic_profiles (clinic_id, name) values (tests.id('aube'), 'Maison Aube');

-- Read the true state of the database (bypassing RLS) to check what a statement really changed.
create function tests.truth(_sql text) returns text language plpgsql security definer as $$
declare r text;
begin
  execute _sql into r;
  return r;
end $$;
grant execute on function tests.truth(text) to anon, authenticated, service_role;
