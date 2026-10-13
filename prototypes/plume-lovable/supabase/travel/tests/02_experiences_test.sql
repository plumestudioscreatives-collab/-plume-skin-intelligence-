-- Step 2: pre-launch gate, hosts, experiences, publishing.

-- Before launch, a member can't use Travel at all.
select tests.login('amara');
select tests.fails($$ insert into travel_hosts (owner_id, name, host_type) values (auth.uid(), 'Amara Studio', 'Spa') $$,
  'row-level security', 'before launch: a member without preview access cannot create a host');
select tests.ok((travel_my_access()->>'can_preview')::boolean = false, 'before launch: travel_my_access says no preview');

-- The admin gives three businesses preview access.
select tests.login('admin');
select tests.ok((travel_my_access()->>'is_admin')::boolean, 'admin is recognised through user_roles');
insert into travel_preview_access (user_id) values (tests.id('lumen')), (tests.id('aube')), (tests.id('rival'));
select tests.login('amara');
select tests.fails($$ insert into travel_preview_access (user_id) values (auth.uid()) $$, 'row-level security',
  'a member cannot grant herself preview access');
select tests.fails($$ select travel_admin_set_launched(true) $$, 'travel_admin_only', 'a member cannot launch Travel');

-- Hosts
select tests.login('lumen');
select tests.fails($$ insert into travel_hosts (owner_id, name, host_type, verified) values (auth.uid(), 'Lumen', 'Beauty brand', true) $$,
  'permission denied', 'a host cannot mark itself verified');
select tests.fails($$ insert into travel_hosts (owner_id, name, host_type, brand_id)
  values (auth.uid(), 'Lumen', 'Beauty brand', (select id from brands where slug = 'rival')) $$,
  'row-level security', 'a host cannot link someone else''s brand');
select tests.fails($$ insert into travel_hosts (owner_id, name, host_type) values (tests.id('amara'), 'Fake', 'Spa') $$,
  'row-level security', 'nobody can create a host profile for another account');
with x as (
  insert into travel_hosts (owner_id, name, host_type, city, brand_id)
  values (auth.uid(), 'Lumen Aesthetics', 'Beauty brand', 'New York', (select id from brands where owner_id = auth.uid()))
  returning id)
select tests.keep('lumen_host', id) from x;
select tests.ok(tests.v('lumen_host') is not null, 'a brand owner links their own brand as a Travel host');
select tests.fails($$ update travel_hosts set travel_plan = 'paid' where owner_id = auth.uid() $$,
  'permission denied', 'a host cannot change its own travel_plan');
select tests.fails($$ update travel_hosts set host_type = 'Plume' where owner_id = auth.uid() $$,
  'row-level security', 'a host cannot pose as Plume');

select tests.login('aube');
with x as (
  insert into travel_hosts (owner_id, name, host_type, city, clinic_profile_id)
  values (auth.uid(), 'Maison Aube', 'Med spa', 'New York', (select id from clinic_profiles where clinic_id = auth.uid()))
  returning id)
select tests.keep('aube_host', id) from x;
select tests.ok(tests.v('aube_host') is not null, 'a clinic owner links their own clinic profile');
update travel_hosts set name = 'Hijacked' where id = tests.v('lumen_host');
select tests.ok(tests.truth(format('select name from travel_hosts where id = %L', tests.v('lumen_host'))) = 'Lumen Aesthetics',
  'one host cannot edit another host''s profile');

select tests.login('rival');
with x as (insert into travel_hosts (owner_id, name, host_type) values (auth.uid(), 'Rival Beauty', 'Beauty brand') returning id)
select tests.keep('rival_host', id) from x;

-- Experiences
select tests.login('lumen');
select tests.fails($$ insert into travel_experiences (host_id, title) values (tests.v('aube_host'), 'Not mine') $$,
  'row-level security', 'a host cannot create an experience under another host');
select tests.fails($$ insert into travel_experiences (host_id, title, status) values (tests.v('lumen_host'), 'Sneaky', 'published') $$,
  'permission denied', 'a host cannot insert an already-published experience');
select tests.fails($$ insert into travel_experiences (host_id, co_host_id, title) values (tests.v('lumen_host'), tests.v('aube_host'), 'Co') $$,
  'permission denied', 'a host cannot add a co-host without the board agreement');
with x as (
  insert into travel_experiences (host_id, title, access_type, capacity, city, country, starts_at, ends_at, timezone)
  values (tests.v('lumen_host'), 'Glow bar evening', 'rsvp_guaranteed', 2, 'New York', 'United States',
          now() + interval '3 days', now() + interval '3 days 3 hours', 'America/New_York')
  returning id)
select tests.keep('glow', id) from x;
select tests.ok(tests.v('glow') is not null, 'a host creates a draft');
select tests.fails($$ update travel_experiences set status = 'published' where id = tests.v('glow') $$,
  'permission denied', 'a host cannot set status directly');
select tests.fails($$ update travel_experiences set featured = true where id = tests.v('glow') $$,
  'permission denied', 'a host cannot feature their own experience');
select tests.fails($$ select travel_publish_experience(tests.v('glow')) $$,
  'travel_publication_blocked: description, address, includes, sensory, cancellation',
  'publishing names every missing required check');
update travel_experiences set description = 'A slow evening of skin consultations, tea and quiet music in Williamsburg.',
  address = '88 Wythe Ave, Brooklyn', includes = 'Consultation, tea, a sample kit', energy = 'Quiet',
  cancellation_terms = 'Cancel any time before the day.' where id = tests.v('glow');
select tests.ok(travel_publish_experience(tests.v('glow')) = 'published', 'publishing works once the checks pass');

select tests.login('rival');
select tests.ok((select count(*) from travel_experiences where id = tests.v('glow')) = 1,
  'before launch: preview accounts see published experiences');
update travel_experiences set title = 'Defaced' where id = tests.v('glow');
select tests.ok(tests.truth(format('select title from travel_experiences where id = %L', tests.v('glow'))) = 'Glow bar evening',
  'another host cannot edit the experience');
select tests.fails($$ select travel_publish_experience(tests.v('glow')) $$, 'travel_not_your_experience',
  'another host cannot publish or republish it');
select tests.fails($$ select travel_cancel_experience(tests.v('glow')) $$, 'travel_not_your_experience',
  'another host cannot cancel it');
select tests.fails($$ insert into travel_slots (experience_id, starts_at, capacity) values (tests.v('glow'), now(), 5) $$,
  'row-level security', 'another host cannot add time slots');

select tests.login('amara');
select tests.ok((select count(*) from travel_experiences) = 0, 'before launch: a member sees no experiences');
select tests.login('anon');
select tests.ok((select count(*) from travel_experiences) = 0, 'before launch: a signed-out visitor sees no experiences');
select tests.ok((select count(*) from travel_hosts) = 0, 'before launch: a signed-out visitor sees no hosts');

-- Launch
select tests.login('admin');
select travel_admin_set_launched(true);
select tests.login('anon');
select tests.ok((select count(*) from travel_experiences) = 1, 'after launch: signed-out visitors see published experiences');
select tests.fails($$ insert into travel_experiences (host_id, title) values (tests.v('lumen_host'), 'x') $$,
  'permission denied', 'signed-out visitors cannot write');
select tests.login('amara');
select tests.ok((select count(*) from travel_experiences) = 1, 'after launch: members see published experiences');
select tests.ok((select count(*) from travel_sensory_profiles) = 0, 'a member starts without a sensory profile');
insert into travel_sensory_profiles (user_id, energy, fragrance, group_size, touch) values (auth.uid(), 0, 1, 0, 1);
select tests.fails($$ insert into travel_sensory_profiles (user_id, energy, fragrance, group_size, touch) values (tests.id('jules'), 2, 2, 2, 2) $$,
  'row-level security', 'nobody can write another person''s sensory profile');
select tests.login('jules');
select tests.ok((select count(*) from travel_sensory_profiles) = 0, 'sensory profiles are private');

-- Drafts stay private; published experiences can't be deleted.
select tests.login('lumen');
with x as (insert into travel_experiences (host_id, title) values (tests.v('lumen_host'), 'Quiet draft') returning id)
select tests.keep('draft', id) from x;
select tests.login('amara');
select tests.ok((select count(*) from travel_experiences where id = tests.v('draft')) = 0, 'drafts are invisible to members');
select tests.login('lumen');
delete from travel_experiences where id = tests.v('glow');
select tests.ok(tests.truth(format('select count(*) from travel_experiences where id = %L', tests.v('glow'))) = '1',
  'a published experience cannot be deleted');
delete from travel_experiences where id = tests.v('draft');
select tests.ok(tests.truth(format('select count(*) from travel_experiences where id = %L', tests.v('draft'))) = '0',
  'a host can delete their own draft');
select tests.fails($$ select travel_admin_set_featured(tests.v('glow'), true) $$, 'travel_admin_only',
  'only admins can feature');
