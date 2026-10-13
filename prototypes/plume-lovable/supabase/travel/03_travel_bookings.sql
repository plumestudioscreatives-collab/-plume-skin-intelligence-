-- Plume Travel · build step 3: bookings, slots, waitlists, ticketing, check-in.
--
-- Additive only. People never insert or edit bookings directly: every change goes through
-- the functions below, which lock the experience row so two people can't take the last place.
-- Paid tickets: travel_book() holds the place as pending_payment; the Stripe webhook calls
-- travel_mark_ticket_paid() (service role only). Plume takes no application fee.

create or replace function public.travel_ticket_code()
returns text language sql volatile set search_path = public as $$
  -- 40 random bits, shown as PT-XXXX-XXXX (no 0/O/1/I).
  select 'PT-' || string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', (get_byte(b, i) % 32) + 1, 1)
                             || case when i = 3 then '-' else '' end, '' order by i)
  from (select extensions.gen_random_bytes(8) as b) r, generate_series(0, 7) as i
$$;

create table public.travel_bookings (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.travel_experiences(id) on delete cascade,
  slot_id uuid references public.travel_slots(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_name text not null default 'Guest',
  status text not null check (status in ('pending_payment', 'booked', 'waitlisted', 'applied', 'invited',
    'declined', 'cancelled', 'checked_in')),
  plus_one boolean not null default false,
  -- The guest's choice to let the host see what she bought afterwards (Event Outcome Intelligence).
  share_outcomes_consent boolean not null default false,
  note text check (length(note) <= 1000), -- application or invitation request
  code text not null unique default public.travel_ticket_code(),
  amount_minor integer check (amount_minor >= 0),
  currency text check (currency in ('EUR', 'USD', 'GBP', 'KRW')),
  hold_expires_at timestamptz, -- pending_payment places are held until then
  stripe_session_id text unique,
  stripe_payment_intent text,
  refund_status text check (refund_status in ('requested', 'due', 'refunded', 'not_refunded')),
  stripe_refund_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  checked_in_at timestamptz
);
-- One live booking per person per experience. A cancelled or declined one can be replaced.
create unique index travel_bookings_one_live on public.travel_bookings (experience_id, user_id)
  where status not in ('cancelled', 'declined');
create index travel_bookings_exp_status_idx on public.travel_bookings (experience_id, status);
create index travel_bookings_user_idx on public.travel_bookings (user_id);
create trigger travel_bookings_touch before update on public.travel_bookings for each row execute function public.travel_touch();

-- Waitlist offers: a place held for one person for a limited time
-- (2 hours, or 10 minutes during the event: WAITLIST_OFFER_HOURS / LIVE_OFFER_MINUTES).
create table public.travel_waitlist_offers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.travel_bookings(id) on delete cascade,
  offered_by uuid references auth.users(id) on delete set null,
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  claimed_at timestamptz,
  withdrawn_at timestamptz
);
create unique index travel_waitlist_offers_one_open on public.travel_waitlist_offers (booking_id)
  where claimed_at is null and withdrawn_at is null;

-- Check-in record. Powers Passport stamps (step 6).
create table public.travel_attendance (
  experience_id uuid not null references public.travel_experiences(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references public.travel_bookings(id) on delete set null,
  checked_in_at timestamptz not null default now(),
  shared_with_host boolean not null default false,
  primary key (experience_id, user_id)
);

-- In-app notifications for Travel (waitlist offers, host updates, new experiences, board activity).
-- Kept separate from social_notifications so the existing notification list is unchanged.
create table public.travel_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('new_experience', 'waitlist_offer', 'host_update', 'board', 'live', 'bring_back', 'booking', 'verification')),
  text text not null,
  detail text,
  experience_id uuid references public.travel_experiences(id) on delete cascade,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index travel_notifications_user_idx on public.travel_notifications (user_id, created_at desc);

create or replace function public.travel_notify(_user uuid, _kind text, _text text, _detail text default null,
  _experience uuid default null, _link text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.travel_notifications (user_id, kind, text, detail, experience_id, link)
  values (_user, _kind, _text, _detail, _experience, _link)
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.travel_bookings enable row level security;
alter table public.travel_waitlist_offers enable row level security;
alter table public.travel_attendance enable row level security;
alter table public.travel_notifications enable row level security;
revoke all on public.travel_bookings, public.travel_waitlist_offers, public.travel_attendance,
  public.travel_notifications from anon, authenticated;
grant select on public.travel_bookings, public.travel_waitlist_offers, public.travel_attendance,
  public.travel_notifications to authenticated;
grant update (share_outcomes_consent) on public.travel_bookings to authenticated;
grant update (shared_with_host) on public.travel_attendance to authenticated;
grant update (read_at) on public.travel_notifications to authenticated;
grant delete on public.travel_notifications to authenticated;

create policy "guests see their bookings" on public.travel_bookings for select to authenticated
  using (user_id = auth.uid());
create policy "hosts see bookings for their experiences" on public.travel_bookings for select to authenticated
  using (public.travel_owns_experience(experience_id) or public.travel_is_admin());
create policy "guests change their outcome consent" on public.travel_bookings for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "guests see offers made to them" on public.travel_waitlist_offers for select to authenticated
  using (exists (select 1 from public.travel_bookings b where b.id = booking_id and b.user_id = auth.uid()));
create policy "hosts see offers they made" on public.travel_waitlist_offers for select to authenticated
  using (exists (select 1 from public.travel_bookings b where b.id = booking_id and public.travel_owns_experience(b.experience_id)));

create policy "guests see their check-ins" on public.travel_attendance for select to authenticated
  using (user_id = auth.uid());
create policy "hosts see check-ins at their experiences" on public.travel_attendance for select to authenticated
  using (public.travel_owns_experience(experience_id));
create policy "guests choose whether to share a stamp" on public.travel_attendance for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "people see their notifications" on public.travel_notifications for select to authenticated
  using (user_id = auth.uid());
create policy "people mark notifications read" on public.travel_notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "people clear notifications" on public.travel_notifications for delete to authenticated
  using (user_id = auth.uid());

-- Guests keep seeing an experience they booked, even after it is cancelled.
create policy "guests see experiences they booked" on public.travel_experiences for select to authenticated
  using (exists (select 1 from public.travel_bookings b
                 where b.experience_id = travel_experiences.id and b.user_id = auth.uid()));

-- ─── Capacity ────────────────────────────────────────────────────────────────

-- Places taken: booked and checked-in guests (a plus-one counts twice), unexpired payment
-- holds, and open waitlist offers.
create or replace function public.travel_places_taken(_experience uuid, _slot uuid default null)
returns integer language sql stable security definer set search_path = public as $$
  select (
    select coalesce(sum(case when b.plus_one then 2 else 1 end), 0)
      from public.travel_bookings b
     where b.experience_id = _experience and b.slot_id is not distinct from _slot
       and (b.status in ('booked', 'checked_in') or (b.status = 'pending_payment' and b.hold_expires_at > now()))
  ) + (
    select count(*)
      from public.travel_waitlist_offers o join public.travel_bookings b on b.id = o.booking_id
     where b.experience_id = _experience and b.slot_id is not distinct from _slot and b.status = 'waitlisted'
       and o.claimed_at is null and o.withdrawn_at is null and o.expires_at > now()
  )::int
$$;

create or replace function public.travel_waitlist_count(_experience uuid, _slot uuid default null)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.travel_bookings
   where experience_id = _experience and slot_id is not distinct from _slot and status = 'waitlisted'
$$;

-- Places left per experience (and per slot) for listings. Runs with the caller's rights,
-- so it only returns rows for experiences the caller can see.
create or replace function public.travel_availability(_experiences uuid[])
returns table (experience_id uuid, slot_id uuid, capacity integer, places_left integer, waitlisted integer)
language sql stable set search_path = public as $$
  select e.id, s.id, coalesce(s.capacity, e.capacity),
         greatest(coalesce(s.capacity, e.capacity) - public.travel_places_taken(e.id, s.id), 0),
         public.travel_waitlist_count(e.id, s.id)
    from public.travel_experiences e
    left join public.travel_slots s on s.experience_id = e.id
   where e.id = any(_experiences)
$$;

-- "You're 3rd on the waitlist."
create or replace function public.travel_waitlist_position(_booking uuid)
returns integer language sql stable security definer set search_path = public as $$
  select 1 + (select count(*)::int from public.travel_bookings other
                where other.experience_id = me.experience_id and other.slot_id is not distinct from me.slot_id
                  and other.status = 'waitlisted' and other.created_at < me.created_at)
    from public.travel_bookings me
   where me.id = _booking and me.user_id = auth.uid() and me.status = 'waitlisted'
$$;

-- ─── Guest actions ───────────────────────────────────────────────────────────

create or replace function public.travel_book(_experience uuid, _slot uuid default null, _plus_one boolean default false,
  _note text default null, _share_consent boolean default false)
returns public.travel_bookings language plpgsql security definer set search_path = public as $$
declare
  e public.travel_experiences;
  need int := case when _plus_one then 2 else 1 end;
  cap int;
  st text;
  b public.travel_bookings;
begin
  if auth.uid() is null then raise exception 'travel_sign_in_required' using errcode = '42501'; end if;
  if not public.travel_is_open() then raise exception 'travel_not_open' using errcode = '42501'; end if;

  select * into e from public.travel_experiences where id = _experience and status = 'published' for update;
  if not found then raise exception 'travel_not_bookable'; end if;
  if coalesce(e.ends_at, e.starts_at) < now() then raise exception 'travel_event_over'; end if;
  if e.access_type = 'walkin' then raise exception 'travel_walk_in_no_booking'; end if;
  if _plus_one and not e.plus_one_allowed then raise exception 'travel_no_plus_one'; end if;
  if exists (select 1 from public.travel_slots where experience_id = e.id) then
    select capacity into cap from public.travel_slots where id = _slot and experience_id = e.id;
    if cap is null then raise exception 'travel_choose_a_time'; end if;
  elsif _slot is not null then
    raise exception 'travel_no_such_time';
  else
    cap := e.capacity;
  end if;
  if exists (select 1 from public.travel_bookings where experience_id = e.id and user_id = auth.uid()
               and status not in ('cancelled', 'declined')) then
    raise exception 'travel_already_booked';
  end if;

  st := case
    when e.access_type in ('apply', 'invite') then 'applied'
    when public.travel_places_taken(e.id, _slot) + need > cap then 'waitlisted'
    when e.access_type = 'paid' and coalesce(e.price_minor, 0) > 0 then 'pending_payment'
    else 'booked' end;

  insert into public.travel_bookings (experience_id, slot_id, user_id, guest_name, status, plus_one,
    share_outcomes_consent, note, amount_minor, currency, hold_expires_at)
  values (e.id, _slot, auth.uid(),
    coalesce((select nullif(btrim(display_name), '') from public.profiles where id = auth.uid()), 'Guest'),
    st, _plus_one, coalesce(_share_consent, false), nullif(btrim(_note), ''),
    case when e.access_type = 'paid' then e.price_minor * need end,
    case when e.access_type = 'paid' then e.currency end,
    case when st = 'pending_payment' then now() + interval '35 minutes' end)
  returning * into b;
  return b;
end $$;

-- An accepted application or a claimed offer for a paid event: hold the place for payment.
create or replace function public.travel_start_payment(_booking uuid)
returns public.travel_bookings language plpgsql security definer set search_path = public as $$
declare
  b public.travel_bookings;
  e public.travel_experiences;
begin
  select * into b from public.travel_bookings where id = _booking and user_id = auth.uid() for update;
  if not found then raise exception 'travel_not_your_booking' using errcode = '42501'; end if;
  select * into e from public.travel_experiences where id = b.experience_id and status = 'published' for update;
  if not found or e.access_type <> 'paid' then raise exception 'travel_not_payable'; end if;
  if b.status = 'pending_payment' and b.hold_expires_at > now() then return b; end if;
  if b.status not in ('invited', 'pending_payment') then raise exception 'travel_not_payable'; end if;
  if b.status = 'pending_payment' and public.travel_places_taken(e.id, b.slot_id) + (case when b.plus_one then 2 else 1 end)
       > coalesce((select capacity from public.travel_slots where id = b.slot_id), e.capacity) then
    raise exception 'travel_sold_out';
  end if;
  update public.travel_bookings
     set status = 'pending_payment', hold_expires_at = now() + interval '35 minutes',
         amount_minor = e.price_minor * (case when b.plus_one then 2 else 1 end), currency = e.currency
   where id = b.id returning * into b;
  return b;
end $$;

create or replace function public.travel_cancel_booking(_booking uuid)
returns public.travel_bookings language plpgsql security definer set search_path = public as $$
declare b public.travel_bookings;
begin
  select * into b from public.travel_bookings where id = _booking and user_id = auth.uid() for update;
  if not found then raise exception 'travel_not_your_booking' using errcode = '42501'; end if;
  if b.status in ('cancelled', 'declined', 'checked_in') then raise exception 'travel_cannot_cancel'; end if;
  update public.travel_waitlist_offers set withdrawn_at = now()
   where booking_id = b.id and claimed_at is null and withdrawn_at is null;
  update public.travel_bookings
     set status = 'cancelled', cancelled_at = now(),
         -- A paid ticket: the host decides on the refund under their cancellation terms.
         refund_status = case when b.status = 'booked' and b.stripe_payment_intent is not null then 'requested' end
   where id = b.id returning * into b;
  return b;
end $$;

create or replace function public.travel_claim_offer(_offer uuid)
returns public.travel_bookings language plpgsql security definer set search_path = public as $$
declare
  o public.travel_waitlist_offers;
  b public.travel_bookings;
  e public.travel_experiences;
begin
  select o2.* into o from public.travel_waitlist_offers o2 join public.travel_bookings b2 on b2.id = o2.booking_id
   where o2.id = _offer and b2.user_id = auth.uid() for update of o2;
  if not found then raise exception 'travel_not_your_offer' using errcode = '42501'; end if;
  if o.claimed_at is not null or o.withdrawn_at is not null or o.expires_at <= now() then
    raise exception 'travel_offer_expired';
  end if;
  select * into b from public.travel_bookings where id = o.booking_id for update;
  select * into e from public.travel_experiences where id = b.experience_id for update;
  update public.travel_waitlist_offers set claimed_at = now() where id = o.id;
  if e.access_type = 'paid' and coalesce(e.price_minor, 0) > 0 then
    update public.travel_bookings
       set status = 'pending_payment', hold_expires_at = greatest(o.expires_at, now() + interval '35 minutes'),
           amount_minor = e.price_minor * (case when b.plus_one then 2 else 1 end), currency = e.currency
     where id = b.id returning * into b;
  else
    update public.travel_bookings set status = 'booked' where id = b.id returning * into b;
  end if;
  return b;
end $$;

-- ─── Host actions ────────────────────────────────────────────────────────────

-- Offer an opened place to someone on the waitlist.
create or replace function public.travel_offer_place(_booking uuid, _live boolean default false)
returns public.travel_waitlist_offers language plpgsql security definer set search_path = public as $$
declare
  b public.travel_bookings;
  e public.travel_experiences;
  o public.travel_waitlist_offers;
  hold interval := case when _live then interval '10 minutes' else interval '2 hours' end;
begin
  select * into b from public.travel_bookings where id = _booking for update;
  if not found or not public.travel_owns_experience(b.experience_id) then
    raise exception 'travel_not_your_experience' using errcode = '42501';
  end if;
  if b.status <> 'waitlisted' then raise exception 'travel_not_on_waitlist'; end if;
  select * into e from public.travel_experiences where id = b.experience_id;
  insert into public.travel_waitlist_offers (booking_id, offered_by, expires_at)
  values (b.id, auth.uid(), now() + hold) returning * into o;
  perform public.travel_notify(b.user_id, 'waitlist_offer',
    format('A place opened for %s. It''s held for you for %s.', e.title,
           case when _live then '10 minutes' else '2 hours' end),
    'After that it goes to the next person on the waitlist.', e.id);
  return o;
end $$;

-- Accept or decline an application (or an invitation request).
create or replace function public.travel_review_application(_booking uuid, _accept boolean)
returns public.travel_bookings language plpgsql security definer set search_path = public as $$
declare
  b public.travel_bookings;
  e public.travel_experiences;
begin
  select * into b from public.travel_bookings where id = _booking for update;
  if not found or not public.travel_owns_experience(b.experience_id) then
    raise exception 'travel_not_your_experience' using errcode = '42501';
  end if;
  if b.status <> 'applied' then raise exception 'travel_not_an_application'; end if;
  select * into e from public.travel_experiences where id = b.experience_id for update;
  if not _accept then
    update public.travel_bookings set status = 'declined' where id = b.id returning * into b;
    perform public.travel_notify(b.user_id, 'booking', format('%s couldn''t offer you a place this time', e.title), null, e.id);
  elsif coalesce(e.price_minor, 0) > 0 then
    update public.travel_bookings set status = 'invited' where id = b.id returning * into b;
    perform public.travel_notify(b.user_id, 'booking', format('You''re invited to %s', e.title), 'Pay for your ticket to confirm your place.', e.id);
  else
    if public.travel_places_taken(e.id, b.slot_id) + (case when b.plus_one then 2 else 1 end)
         > coalesce((select capacity from public.travel_slots where id = b.slot_id), e.capacity) then
      raise exception 'travel_sold_out';
    end if;
    update public.travel_bookings set status = 'booked' where id = b.id returning * into b;
    perform public.travel_notify(b.user_id, 'booking', format('You''re in: %s', e.title), null, e.id);
  end if;
  return b;
end $$;

-- Check a guest in by ticket code. Returns the booking (status checked_in).
create or replace function public.travel_check_in(_experience uuid, _code text)
returns public.travel_bookings language plpgsql security definer set search_path = public as $$
declare b public.travel_bookings;
begin
  if not public.travel_owns_experience(_experience) then
    raise exception 'travel_not_your_experience' using errcode = '42501';
  end if;
  select * into b from public.travel_bookings
   where experience_id = _experience and code = upper(btrim(_code)) for update;
  if not found then raise exception 'travel_ticket_not_found'; end if;
  if b.status = 'checked_in' then return b; end if;
  if b.status = 'pending_payment' then raise exception 'travel_ticket_unpaid'; end if;
  if b.status <> 'booked' then raise exception 'travel_ticket_not_valid: %', b.status; end if;
  update public.travel_bookings set status = 'checked_in', checked_in_at = now() where id = b.id returning * into b;
  insert into public.travel_attendance (experience_id, user_id, booking_id, checked_in_at, shared_with_host)
  values (b.experience_id, b.user_id, b.id, b.checked_in_at, b.share_outcomes_consent)
  on conflict (experience_id, user_id) do nothing;
  return b;
end $$;

-- Record a host's refund decision. The refund itself is made by the server function
-- (stripe.refunds.create with reverse_transfer), which then sets refund_status = 'refunded'.
create or replace function public.travel_set_refund_decision(_booking uuid, _refund boolean)
returns void language plpgsql security definer set search_path = public as $$
declare b public.travel_bookings;
begin
  select * into b from public.travel_bookings where id = _booking for update;
  if not found or not public.travel_owns_experience(b.experience_id) then
    raise exception 'travel_not_your_experience' using errcode = '42501';
  end if;
  if b.refund_status is distinct from 'requested' then raise exception 'travel_no_refund_requested'; end if;
  update public.travel_bookings set refund_status = case when _refund then 'due' else 'not_refunded' end where id = b.id;
end $$;

-- ─── Payment webhook (service role only) ─────────────────────────────────────

create or replace function public.travel_mark_ticket_paid(_booking uuid, _session text, _payment_intent text, _amount integer)
returns public.travel_bookings language plpgsql security definer set search_path = public as $$
declare b public.travel_bookings;
begin
  select * into b from public.travel_bookings where id = _booking for update;
  if not found then raise exception 'travel_booking_not_found'; end if;
  if b.status in ('booked', 'checked_in') and b.stripe_session_id = _session then return b; end if; -- webhook retry
  -- Paid after the hold ran out: still honour it (the guest paid). The host sees it in Check-in.
  update public.travel_bookings
     set status = case when b.status in ('pending_payment', 'invited', 'waitlisted') then 'booked' else b.status end,
         stripe_session_id = _session, stripe_payment_intent = _payment_intent, amount_minor = _amount,
         hold_expires_at = null,
         refund_status = case when b.status in ('cancelled', 'declined') then 'due' else b.refund_status end
   where id = b.id returning * into b;
  return b;
end $$;

create or replace function public.travel_mark_refunded(_booking uuid, _refund text)
returns void language sql security definer set search_path = public as $$
  update public.travel_bookings set refund_status = 'refunded', stripe_refund_id = _refund where id = _booking
$$;

-- A cancelled experience cancels its live bookings, flags paid ones for refund, and tells guests.
create or replace function public.travel_on_experience_cancelled()
returns trigger language plpgsql security definer set search_path = public as $$
declare guest record;
begin
  for guest in select user_id from public.travel_bookings
                where experience_id = new.id and status in ('pending_payment', 'booked', 'waitlisted', 'applied', 'invited') loop
    perform public.travel_notify(guest.user_id, 'booking', format('%s was cancelled', new.title),
      coalesce(new.cancel_reason, 'The host cancelled this experience.'), new.id);
  end loop;
  update public.travel_bookings
     set refund_status = case when status = 'booked' and stripe_payment_intent is not null then 'due' else refund_status end,
         status = 'cancelled', cancelled_at = now()
   where experience_id = new.id and status in ('pending_payment', 'booked', 'waitlisted', 'applied', 'invited');
  update public.travel_waitlist_offers o set withdrawn_at = now()
    from public.travel_bookings b
   where b.id = o.booking_id and b.experience_id = new.id and o.claimed_at is null and o.withdrawn_at is null;
  return new;
end $$;
create trigger travel_experience_cancelled after update of status on public.travel_experiences
  for each row when (new.status = 'cancelled' and old.status is distinct from 'cancelled')
  execute function public.travel_on_experience_cancelled();

-- ─── Grants ──────────────────────────────────────────────────────────────────

revoke execute on function public.travel_ticket_code(), public.travel_notify(uuid, text, text, text, uuid, text),
  public.travel_places_taken(uuid, uuid), public.travel_availability(uuid[]), public.travel_waitlist_count(uuid, uuid),
  public.travel_waitlist_position(uuid), public.travel_book(uuid, uuid, boolean, text, boolean),
  public.travel_start_payment(uuid), public.travel_cancel_booking(uuid), public.travel_claim_offer(uuid),
  public.travel_offer_place(uuid, boolean), public.travel_review_application(uuid, boolean),
  public.travel_check_in(uuid, text), public.travel_set_refund_decision(uuid, boolean),
  public.travel_mark_ticket_paid(uuid, text, text, integer), public.travel_mark_refunded(uuid, text),
  public.travel_on_experience_cancelled()
  from public, anon, authenticated;
grant execute on function public.travel_ticket_code() to authenticated; -- column default
grant execute on function public.travel_places_taken(uuid, uuid), public.travel_availability(uuid[]),
  public.travel_waitlist_count(uuid, uuid) to anon, authenticated;
grant execute on function public.travel_waitlist_position(uuid), public.travel_book(uuid, uuid, boolean, text, boolean),
  public.travel_start_payment(uuid), public.travel_cancel_booking(uuid), public.travel_claim_offer(uuid),
  public.travel_offer_place(uuid, boolean), public.travel_review_application(uuid, boolean),
  public.travel_check_in(uuid, text), public.travel_set_refund_decision(uuid, boolean)
  to authenticated;
grant execute on function public.travel_mark_ticket_paid(uuid, text, text, integer), public.travel_mark_refunded(uuid, text)
  to service_role;
