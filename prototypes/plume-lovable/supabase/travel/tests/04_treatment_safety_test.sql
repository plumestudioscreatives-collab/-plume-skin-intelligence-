-- Step 4: Treatment Safety.

select tests.login('aube');
with x as (
  insert into travel_experiences (host_id, title, access_type, capacity, city, starts_at, ends_at,
    description, address, includes, energy, cancellation_terms)
  values (tests.v('aube_host'), 'Glass skin facials', 'rsvp_guaranteed', 6, 'New York', now() + interval '4 days', now() + interval '4 days 4 hours',
    'Twenty-minute express facials with our licensed estheticians, between talks on barrier care.',
    '12 Bond St', 'A 20-minute facial', 'Quiet', 'Cancel any time.')
  returning id)
select tests.keep('facials', id) from x;
insert into travel_experience_treatments (experience_id, treatment_type, practitioner_name) values (tests.v('facials'), 'facial', 'Dana Kim, LE');
select tests.fails($$ update travel_experience_treatments set license_verified_at = now() where experience_id = tests.v('facials') $$,
  'permission denied', 'a host cannot verify their own license');
select tests.fails($$ select travel_publish_experience(tests.v('facials')) $$, 'travel_license_missing',
  'a treatment needs license details before publishing');
insert into travel_treatment_licenses (experience_id, license_number, license_region) values (tests.v('facials'), 'NY-ES-448812', 'New York State');
select tests.ok(travel_publish_experience(tests.v('facials')) = 'pending_verification',
  'publishing a treatment waits for license verification');

select tests.login('amara');
select tests.ok((select count(*) from travel_experiences where id = tests.v('facials')) = 0,
  'an experience pending verification is not public');
select tests.ok((select count(*) from travel_treatment_licenses) = 0, 'members cannot read license details');
select tests.fails($$ select travel_admin_verify_license(tests.v('facials')) $$, 'travel_admin_only', 'a member cannot verify a license');
select tests.login('rival');
select tests.ok((select count(*) from travel_treatment_licenses) = 0, 'another host cannot read license details');
select tests.fails($$ select travel_admin_verify_license(tests.v('facials')) $$, 'travel_admin_only', 'a host cannot verify a license');

select tests.login('admin');
select tests.ok((select count(*) from travel_treatment_licenses where experience_id = tests.v('facials')) = 1, 'admins read license details');
select tests.ok(travel_admin_verify_license(tests.v('facials')) = 'published', 'admin verification publishes it');
select tests.login('amara');
select tests.ok((select count(*) from travel_experiences where id = tests.v('facials')) = 1, 'the verified experience is public');

-- Changing the practitioner sends it back for verification.
select tests.login('aube');
update travel_experience_treatments set practitioner_name = 'Someone Else' where experience_id = tests.v('facials');
select tests.ok(tests.truth(format('select status from travel_experiences where id = %L', tests.v('facials'))) = 'pending_verification',
  'changing the practitioner sends a published experience back for verification');
select tests.ok(tests.truth(format('select license_verified_at is null from travel_experience_treatments where experience_id = %L', tests.v('facials'))) = 'true',
  'and clears the verification');

-- Admin returns it to the host.
select tests.login('admin');
select travel_admin_return_to_host(tests.v('facials'), 'Please add the practitioner''s license for this practitioner.');
select tests.login('aube');
select tests.ok((select status from travel_experiences where id = tests.v('facials')) = 'draft', 'returned to the host as a draft');
select tests.ok((select count(*) from travel_notifications where kind = 'verification') = 1, 'the host is told what to change');

-- Treatments Plume doesn't allow.
with x as (
  insert into travel_experiences (host_id, title, access_type, capacity, city, starts_at, ends_at,
    description, address, includes, energy, cancellation_terms)
  values (tests.v('aube_host'), 'Lip filler happy hour', 'rsvp_guaranteed', 6, 'New York', now() + interval '4 days', now() + interval '4 days 2 hours',
    'Not allowed at events, so this should never publish no matter what the host does.',
    '12 Bond St', 'Filler', 'Social', 'None.')
  returning id)
select tests.keep('filler', id) from x;
insert into travel_experience_treatments (experience_id, treatment_type, practitioner_name) values (tests.v('filler'), 'injectable', 'Dr Example');
insert into travel_treatment_licenses (experience_id, license_number, license_region) values (tests.v('filler'), 'MD-1234', 'New York State');
select tests.fails($$ select travel_publish_experience(tests.v('filler')) $$, 'travel_treatment_not_allowed', 'injectables cannot be published');
select tests.login('admin');
select tests.login('aube');
update travel_treatment_rules set allowed_at_events = true where treatment_type = 'injectable';
select tests.ok(tests.truth($$ select allowed_at_events::text from travel_treatment_rules where treatment_type = 'injectable' $$) = 'false',
  'a host cannot change the treatment rules');

-- A treatment that can't be sold as a ticket.
select tests.login('admin');
update travel_treatment_rules set allowed_as_ticket = false where treatment_type = 'massage';
select tests.ok((select allowed_as_ticket from travel_treatment_rules where treatment_type = 'massage') = false, 'admins change the rules');
select tests.login('lumen');
with x as (
  insert into travel_experiences (host_id, title, access_type, price_minor, currency, capacity, city, starts_at, ends_at,
    description, address, includes, energy, cancellation_terms)
  values (tests.v('lumen_host'), 'Paid massage', 'paid', 3000, 'USD', 4, 'New York', now() + interval '9 days', now() + interval '9 days 1 hour',
    'A paid massage session that the rules say cannot be sold as a ticket right now.',
    '88 Wythe Ave', 'Massage', 'Quiet', 'None.')
  returning id)
select tests.keep('massage', id) from x;
insert into travel_experience_treatments (experience_id, treatment_type, practitioner_name) values (tests.v('massage'), 'massage', 'Ana Ruiz, LMT');
insert into travel_treatment_licenses (experience_id, license_number, license_region) values (tests.v('massage'), 'LMT-99881', 'New York State');
select tests.fails($$ select travel_publish_experience(tests.v('massage')) $$, 'travel_treatment_not_allowed_as_ticket',
  'a treatment the rules don''t allow as a ticket cannot be sold');

-- License documents: private bucket, by experience folder.
select tests.login('aube');
select tests.runs(format($$ insert into storage.objects (bucket_id, name, owner) values ('travel-licenses', '%s/license.pdf', auth.uid()) $$, tests.v('facials')),
  'a host uploads a license document to their experience folder');
select tests.fails(format($$ insert into storage.objects (bucket_id, name, owner) values ('travel-licenses', '%s/license.pdf', auth.uid()) $$, tests.v('glow')),
  'row-level security', 'a host cannot upload into another host''s folder');
select tests.fails($$ insert into storage.objects (bucket_id, name, owner) values ('travel-licenses', 'not-a-uuid/x.pdf', auth.uid()) $$,
  'row-level security', 'a malformed folder is refused, not an error');
select tests.login('amara');
select tests.ok((select count(*) from storage.objects where bucket_id = 'travel-licenses') = 0, 'members cannot see license documents');
select tests.login('admin');
select tests.ok((select count(*) from storage.objects where bucket_id = 'travel-licenses') = 1, 'admins can see license documents');
