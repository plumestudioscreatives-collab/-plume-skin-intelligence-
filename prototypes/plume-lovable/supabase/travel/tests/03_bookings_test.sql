-- Step 3: bookings, capacity, waitlist offers, paid holds, check-in, cancellation.
-- "glow" (capacity 2, free RSVP) was published in step 2's test.

select tests.login('amara');
select tests.fails($$ insert into travel_bookings (experience_id, user_id, status) values (tests.v('glow'), auth.uid(), 'booked') $$,
  'permission denied', 'nobody inserts bookings directly');
select tests.keep('amara_glow', (travel_book(tests.v('glow'), null, false, null, true)).id);
select tests.ok(tests.truth(format('select status from travel_bookings where id = %L', tests.v('amara_glow'))) = 'booked',
  'a free RSVP with places left is booked');
select tests.fails($$ select travel_book(tests.v('glow')) $$, 'travel_already_booked', 'one live booking per person');
select tests.fails($$ update travel_bookings set status = 'checked_in' where id = tests.v('amara_glow') $$,
  'permission denied', 'a guest cannot change her booking status');
select tests.ok((select places_left from travel_availability(array[tests.v('glow')])) = 1, 'availability shows 1 place left');

select tests.login('jules');
select tests.fails($$ select travel_book(tests.v('glow'), null, true) $$, 'travel_no_plus_one',
  'a plus-one is refused when the host doesn''t allow it');
select tests.login('lumen');
update travel_experiences set plus_one_allowed = true where id = tests.v('glow');
select tests.login('jules');
select tests.keep('jules_glow', (travel_book(tests.v('glow'), null, true)).id);
select tests.ok(tests.truth(format('select status from travel_bookings where id = %L', tests.v('jules_glow'))) = 'waitlisted',
  'a booking that needs more places than are left goes on the waitlist');
select tests.ok(travel_waitlist_position(tests.v('jules_glow')) = 1, 'waitlist position is reported to the guest');
select tests.ok((select count(*) from travel_bookings) = 1, 'a guest sees only her own bookings');
select tests.ok(travel_waitlist_position(tests.v('amara_glow')) is null, 'nobody can read someone else''s waitlist position');

select tests.login('rival');
select tests.ok((select count(*) from travel_bookings where experience_id = tests.v('glow')) = 0,
  'another host cannot see the guest list');
select tests.fails($$ select travel_offer_place(tests.v('jules_glow')) $$, 'travel_not_your_experience',
  'another host cannot offer places');
select tests.fails($$ select travel_check_in(tests.v('glow'), tests.truth(format('select code from travel_bookings where id = %L', tests.v('amara_glow')))) $$,
  'travel_not_your_experience', 'another host cannot check guests in');

-- The host sees the list and offers Jules a place; the offer holds it.
select tests.login('lumen');
select tests.ok((select count(*) from travel_bookings where experience_id = tests.v('glow')) = 2, 'the host sees the guest list');
select tests.keep('offer', (travel_offer_place(tests.v('jules_glow'), true)).id);
select tests.ok(tests.truth(format('select (expires_at - offered_at) = interval ''10 minutes'' from travel_waitlist_offers where id = %L', tests.v('offer'))) = 'true',
  'a live offer is held for 10 minutes');
select tests.login('jules');
select tests.ok((select count(*) from travel_notifications where kind = 'waitlist_offer') = 1, 'the guest is notified of the offer');
select tests.login('amara');
select tests.fails($$ select travel_claim_offer(tests.v('offer')) $$, 'travel_not_your_offer', 'only the guest it was offered to can claim it');
select tests.ok((select count(*) from travel_notifications) = 0, 'notifications are private');
select tests.login('jules');
select tests.ok((travel_claim_offer(tests.v('offer'))).status = 'booked', 'claiming a free offer books the place');
select tests.fails($$ select travel_claim_offer(tests.v('offer')) $$, 'travel_offer_expired', 'an offer can be claimed once');

-- Check-in
select tests.login('lumen');
select tests.ok((travel_check_in(tests.v('glow'), lower(tests.truth(format('select code from travel_bookings where id = %L', tests.v('amara_glow')))))).status = 'checked_in',
  'the host checks a guest in by code (case-insensitive)');
select tests.fails($$ select travel_check_in(tests.v('glow'), 'PT-NOPE-NOPE') $$, 'travel_ticket_not_found', 'an unknown code is refused');
select tests.login('amara');
select tests.ok((select shared_with_host from travel_attendance where experience_id = tests.v('glow')),
  'check-in creates the Passport record, shared only because she consented');
select tests.fails($$ select travel_cancel_booking(tests.v('amara_glow')) $$, 'travel_cannot_cancel', 'a used ticket cannot be cancelled');

-- Paid tickets
select tests.login('aube');
with x as (
  insert into travel_experiences (host_id, title, access_type, price_minor, currency, capacity, city, starts_at, ends_at,
    description, address, includes, energy, cancellation_terms)
  values (tests.v('aube_host'), 'Lymphatic facial masterclass', 'paid', 4500, 'USD', 1, 'New York',
    now() + interval '5 days', now() + interval '5 days 2 hours',
    'A hands-on masterclass with our lead esthetician, small group, everything provided.',
    '12 Bond St', 'Masterclass and a take-home kit', 'Reflective', 'Full refund up to 48 hours before.')
  returning id)
select tests.keep('masterclass', id) from x;
select travel_publish_experience(tests.v('masterclass'));
select tests.login('amara');
select tests.keep('amara_paid', (travel_book(tests.v('masterclass'))).id);
select tests.ok(tests.truth(format('select status || '' '' || amount_minor || '' '' || (hold_expires_at > now()) from travel_bookings where id = %L', tests.v('amara_paid'))) = 'pending_payment 4500 true',
  'a paid ticket is held as pending_payment for the ticket price');
select tests.login('jules');
select tests.ok((travel_book(tests.v('masterclass'))).status = 'waitlisted', 'a held place counts against capacity');
select tests.login('amara');
select tests.fails($$ select travel_mark_ticket_paid(tests.v('amara_paid'), 'cs_test', 'pi_test', 4500) $$,
  'permission denied', 'a guest cannot mark her own ticket paid');
select tests.login('service');
select tests.ok((travel_mark_ticket_paid(tests.v('amara_paid'), 'cs_test_1', 'pi_test_1', 4500)).status = 'booked',
  'the payment webhook (service role) confirms the ticket');
select tests.ok((travel_mark_ticket_paid(tests.v('amara_paid'), 'cs_test_1', 'pi_test_1', 4500)).status = 'booked',
  'a repeated webhook delivery changes nothing');

-- An expired hold frees the place.
select tests.login('lumen');
with x as (
  insert into travel_experiences (host_id, title, access_type, price_minor, currency, capacity, city, starts_at, ends_at,
    description, address, includes, energy, cancellation_terms)
  values (tests.v('lumen_host'), 'Serum lab', 'paid', 2000, 'USD', 1, 'New York', now() + interval '6 days', now() + interval '6 days 1 hour',
    'Build your own serum with our chemists. Ingredients and bottle included in the ticket.',
    '88 Wythe Ave', 'A 30ml serum you make', 'Social', 'Non-refundable.')
  returning id)
select tests.keep('lab', id) from x;
select travel_publish_experience(tests.v('lab'));
select tests.login('amara');
select tests.keep('amara_lab', (travel_book(tests.v('lab'))).id);
select tests.truth(format('update travel_bookings set hold_expires_at = now() - interval ''1 minute'' where id = %L returning 1', tests.v('amara_lab')));
select tests.login('jules');
select tests.ok((travel_book(tests.v('lab'))).status = 'pending_payment', 'an expired payment hold no longer takes the place');

-- Applications
select tests.login('lumen');
with x as (
  insert into travel_experiences (host_id, title, access_type, capacity, city, starts_at, ends_at,
    description, address, includes, energy, cancellation_terms)
  values (tests.v('lumen_host'), 'Founders breakfast', 'apply', 10, 'New York', now() + interval '8 days', now() + interval '8 days 2 hours',
    'A breakfast for skincare founders, by application, with a short talk and plenty of time to talk.',
    '88 Wythe Ave', 'Breakfast', 'Social', 'Let us know if you can''t make it.')
  returning id)
select tests.keep('breakfast', id) from x;
select travel_publish_experience(tests.v('breakfast'));
select tests.login('jules');
select tests.keep('jules_app', (travel_book(tests.v('breakfast'), null, false, 'I run a small SPF brand.')).id);
select tests.ok(tests.truth(format('select status from travel_bookings where id = %L', tests.v('jules_app'))) = 'applied', 'an application is recorded as applied');
select tests.fails($$ select travel_review_application(tests.v('jules_app'), true) $$, 'travel_not_your_experience', 'a guest cannot accept her own application');
select tests.login('lumen');
select tests.ok((travel_review_application(tests.v('jules_app'), true)).status = 'booked', 'the host accepts an application');

-- Cancelling an experience cancels bookings, flags paid ones for refund and tells guests.
select tests.login('aube');
select travel_cancel_experience(tests.v('masterclass'), 'Our esthetician is unwell.');
select tests.ok(tests.truth(format('select status || '' '' || refund_status from travel_bookings where id = %L', tests.v('amara_paid'))) = 'cancelled due',
  'a cancelled experience cancels a paid ticket and marks the refund as due');
select tests.login('amara');
select tests.ok((select count(*) from travel_experiences where id = tests.v('masterclass')) = 1,
  'a guest still sees the experience she booked after it is cancelled');
select tests.ok((select count(*) from travel_notifications where experience_id = tests.v('masterclass')) = 1,
  'the guest is told it was cancelled');
select tests.login('aube');
update travel_experiences set title = 'Edited after cancelling' where id = tests.v('masterclass');
select tests.ok(tests.truth(format('select title from travel_experiences where id = %L', tests.v('masterclass'))) = 'Lymphatic facial masterclass',
  'a cancelled experience can no longer be edited');
select tests.login('anon');
select tests.fails($$ select count(*) from travel_bookings $$, 'permission denied', 'signed-out visitors cannot read bookings');
select tests.fails($$ select travel_book(tests.v('glow')) $$, 'permission denied', 'signed-out visitors cannot book');
