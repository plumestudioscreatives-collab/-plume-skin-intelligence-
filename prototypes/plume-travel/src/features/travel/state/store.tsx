// Preview state for Plume Travel. Every action here maps to a future Supabase query or
// server function (noted inline). Nothing leaves the browser: this is mock data only.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ADMIN, BOARD_POSTS, DEFAULT_PROFILE, EXPERIENCES, HOSTS, ME, MY_BUSINESS, SAMPLE_ATTENDEES, SEED_ATTENDANCE, SEED_BOOKINGS, SEED_BRING_BACK,
  SEED_COLLABORATIONS, SEED_FOLLOWS, SEED_NOTIFICATIONS, SEED_PROPOSALS, SEED_ROOM_POSTS, SEED_ROOM_SEEN, SEED_ROOMS_JOINED, SEED_SAVED_SEARCHES, SEED_TRIED,
  SEED_TRIPS, TREATMENT_RULES,
} from "../data/seed";
import { findPlace, type Place } from "../data/places";
import { LIVE_OFFER_MINUTES, NOW, WAITLIST_OFFER_HOURS } from "../config";
import { zoneFor } from "../lib/publish";
import { localDate, quickRange, slotTime } from "../lib/format";
import type { Atmosphere, Pref } from "../lib/labels";
import type {
  Attendance, BoardPost, BoardProposal, Booking, BringItBack, Category, Collaboration, CollaborationTask, Experience, Follow, Notification,
  Role, RoomPost, RoomPreference, SavedSearch, SensoryProfile, TimeOfDay, TreatmentRule, TriedProduct, Trip, WaitlistOffer,
} from "../types";

export type QuickPick = "today" | "weekend" | "week" | "next";
export interface Side { place: Place; from: string; to: string; quick: QuickPick | null }

export interface Discovery {
  mode: "near" | "travel";
  near: Side;
  travel: Side;
  timeOfDay: TimeOfDay;
  cat: Category | "all";
  atmosphere: Atmosphere;
  prefs: Pref[];
  view: "day" | "all";
  sort: "match" | "soonest";
}

export interface TravelState {
  v: 3;
  role: Role;
  discovery: Discovery;
  profile: SensoryProfile;
  experiences: Experience[];
  bookings: Booking[];
  offers: WaitlistOffer[];
  live: Record<string, { waitMinutes: number; updatedAt: string }>;
  trips: Trip[];
  activeTrip: string;
  attendance: Attendance[];
  tried: TriedProduct[];
  bringBack: BringItBack[];
  follows: Follow[];
  savedSearches: SavedSearch[];
  notifications: Notification[];
  roomsJoined: string[];
  roomSeen: Record<string, number>;
  roomPrefs: Record<string, RoomPreference>;
  roomPosts: RoomPost[];
  votes: Record<string, { accurate: boolean; comment: string }>;
  checkedIn: Record<string, string[]>;
  offeredSample: Record<string, string[]>;
  boardPosts: BoardPost[];
  savedPosts: string[];
  proposals: BoardProposal[];
  collaborations: Collaboration[];
  invitesSent: string[];
  treatmentRules: TreatmentRule[];
  introductions: { id: string; a: string; b: string; note: string; at: string }[];
  bannerDismissed: boolean;
}

const KEY = "plume-travel-preview:v3";
let seq = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;
const code = () => "PT-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
const DEFAULT_ROOM_PREF: RoomPreference = { showInAttendeeList: false, wantsToMeet: false };

function initial(): TravelState {
  const [wf, wt] = quickRange("week");
  return {
    v: 3,
    role: "host", // this review opens on Host Studio, Partnership board
    discovery: {
      mode: "near",
      near: { place: findPlace("New York")!, from: wf, to: wt, quick: "week" },
      travel: { place: findPlace("Paris")!, from: "2027-06-13", to: "2027-06-16", quick: null },
      timeOfDay: "any", cat: "all", atmosphere: "any", prefs: [], view: "day", sort: "match",
    },
    profile: { ...DEFAULT_PROFILE },
    experiences: structuredClone(EXPERIENCES),
    bookings: structuredClone(SEED_BOOKINGS),
    offers: [],
    live: { e12: { waitMinutes: 15, updatedAt: "2026-10-12T18:52:00Z" }, e15: { waitMinutes: 5, updatedAt: "2026-10-12T18:48:00Z" } },
    trips: structuredClone(SEED_TRIPS),
    activeTrip: "it-ny",
    attendance: structuredClone(SEED_ATTENDANCE),
    tried: structuredClone(SEED_TRIED),
    bringBack: structuredClone(SEED_BRING_BACK),
    follows: structuredClone(SEED_FOLLOWS),
    savedSearches: structuredClone(SEED_SAVED_SEARCHES),
    notifications: structuredClone(SEED_NOTIFICATIONS),
    roomsJoined: [...SEED_ROOMS_JOINED],
    roomSeen: { ...SEED_ROOM_SEEN },
    roomPrefs: {},
    roomPosts: structuredClone(SEED_ROOM_POSTS),
    votes: {},
    checkedIn: { e12: ["PT-12AA", "PT-12AB", "PT-12AC", "PT-4R8M-LUMN"], e10: [], e5: [] },
    offeredSample: {},
    boardPosts: structuredClone(BOARD_POSTS),
    savedPosts: ["b11"],
    proposals: structuredClone(SEED_PROPOSALS),
    collaborations: structuredClone(SEED_COLLABORATIONS),
    invitesSent: [],
    treatmentRules: structuredClone(TREATMENT_RULES),
    introductions: [],
    bannerDismissed: false,
  };
}

function load(): TravelState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 3) return { ...initial(), ...s };
    }
  } catch {
    /* storage unavailable: start fresh */
  }
  return initial();
}

type Toast = { id: string; text: string; action?: { label: string; run: () => void } };

function useTravelStore() {
  const [state, setState] = useState<TravelState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const toast = useCallback((text: string, action?: Toast["action"]) => {
    const id = uid("t");
    setToasts((t) => [...t.slice(-1), { id, text, action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // Apply updates synchronously against the latest state so actions can return values
  // and several actions can run in one event handler.
  const apply = (fn: (s: TravelState) => TravelState) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
  };
  const exp = (id: string) => stateRef.current.experiences.find((e) => e.id === id);

  // ------------------------------------------------------------ helpers
  const notify = (s: TravelState, n: Omit<Notification, "id" | "at" | "read">): TravelState => ({
    ...s, notifications: [{ ...n, id: uid("n"), at: NOW, read: false }, ...s.notifications],
  });

  /** Fan out "new experience" alerts to followers of the place or host (email + in-app in production). */
  const alertFollowers = (s: TravelState, e: Experience): TravelState => {
    const host = HOSTS[e.hostId];
    const byPlace = s.follows.find((f) => f.alertsInApp && ((f.targetType === "city" && f.target === e.city) || (f.targetType === "area" && f.target === e.neighborhood) || (f.targetType === "country" && f.target === e.country)));
    const byHost = s.follows.find((f) => f.targetType === "host" && f.target === e.hostId && f.alertsInApp && (!f.city || f.city === e.city));
    if (!byPlace && !byHost) return s;
    return notify(s, {
      kind: "new_experience", to: { experienceId: e.id },
      text: byHost ? `${host.name} just posted: ${e.title}` : `New in ${e.city}: ${e.title}`,
      detail: byHost ? `Because you asked to hear when ${host.name} hosts${byHost.city ? ` in ${byHost.city}` : ""}.` : `Because you follow ${byPlace!.target}.`,
    });
  };

  const placeInTrip = (s: TravelState, e: Experience, status: "saved" | "booked", tripId?: string): { s: TravelState; name: string | null } => {
    const date = localDate(e.startsAt, e.timezone);
    const target = tripId
      ? s.trips.find((i) => i.id === tripId)
      : s.trips.find((i) => i.items.some((x) => x.experienceId === e.id)) ??
        s.trips.find((i) => i.city === e.city && (e.recurring || (date >= i.from && date <= i.to))) ??
        s.trips.find((i) => i.city === e.city);
    if (!target) return { s, name: null };
    const has = target.items.some((x) => x.experienceId === e.id);
    const items = has
      ? target.items.map((x) => (x.experienceId === e.id ? { ...x, status: status === "booked" ? "booked" as const : x.status } : x))
      : [...target.items, { experienceId: e.id, status }];
    return { s: { ...s, trips: s.trips.map((i) => (i.id === target.id ? { ...i, items } : i)) }, name: target.name };
  };

  const myBooking = (s: TravelState, id: string) => s.bookings.find((b) => b.experienceId === id && b.userId === ME.id && b.status !== "cancelled");

  // ------------------------------------------------------------ actions
  const actions = {
    toast, dismissToast,
    reset: () => { try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } apply(() => initial()); },
    setRole: (role: Role) => apply((s) => ({ ...s, role })),
    setDiscovery: (patch: Partial<Discovery>) => apply((s) => ({ ...s, discovery: { ...s.discovery, ...patch } })),
    /** Update the place and dates for the current mode (Near me or I'm traveling). */
    setSide: (patch: Partial<Side>) => apply((s) => {
      const k = s.discovery.mode;
      return { ...s, discovery: { ...s.discovery, [k]: { ...s.discovery[k], ...patch } } };
    }),
    dismissBanner: () => apply((s) => ({ ...s, bannerDismissed: true })),
    /** sensory_profiles upsert */
    setProfile: (p: SensoryProfile) => apply((s) => ({ ...s, profile: p })),

    isSaved: (id: string) => stateRef.current.trips.some((i) => i.items.some((x) => x.experienceId === id)),
    bookingFor: (id: string) => myBooking(stateRef.current, id),

    /** trip_items insert/delete */
    saveTo: (experienceId: string, tripId?: string) => {
      const e = exp(experienceId); if (!e) return null;
      let name: string | null = null;
      apply((s) => { const r = placeInTrip(s, e, "saved", tripId); name = r.name; return r.s; });
      return name;
    },
    unsave: (experienceId: string, tripId?: string) => apply((s) => ({
      ...s,
      trips: s.trips.map((i) => (!tripId || i.id === tripId)
        ? { ...i, items: i.items.filter((x) => !(x.experienceId === experienceId && x.status === "saved")) } : i),
    })),
    createTrip: (name: string, city: string, from: string, to: string, firstItems: string[] = []) => {
      const id = uid("it");
      apply((s) => ({ ...s, activeTrip: id, trips: [...s.trips, { id, name, city, from, to, shareToken: null, items: firstItems.map((experienceId) => ({ experienceId, status: "saved" as const })) }] }));
      return id;
    },
    /** Plan My Trip: add every suggestion to the trip for that city, or create "My [City] trip". */
    savePlan: (city: string, from: string, to: string, ids: string[]) => {
      const cur = stateRef.current;
      let trip = cur.trips.find((t) => t.city === city && t.from <= to && t.to >= from) ?? cur.trips.find((t) => t.city === city);
      let id = trip?.id;
      if (!trip) {
        id = uid("it");
        trip = { id, name: `My ${city} trip`, city, from, to, shareToken: null, items: [] };
        apply((s) => ({ ...s, trips: [...s.trips, trip!] }));
      }
      apply((s) => ({
        ...s, activeTrip: id!,
        trips: s.trips.map((t) => t.id !== id ? t : {
          ...t, from: from < t.from ? from : t.from, to: to > t.to ? to : t.to,
          items: [...t.items, ...ids.filter((x) => !t.items.some((i) => i.experienceId === x)).map((experienceId) => ({ experienceId, status: "saved" as const }))],
        }),
      }));
      return trip.name;
    },
    setActiveTrip: (id: string) => apply((s) => ({ ...s, activeTrip: id })),
    /** trip_share_links insert: a view-only token */
    shareTrip: (id: string) => {
      const token = Math.random().toString(36).slice(2, 10);
      apply((s) => ({ ...s, trips: s.trips.map((i) => (i.id === id ? { ...i, shareToken: token } : i)) }));
      return token;
    },
    stopSharing: (id: string) => apply((s) => ({ ...s, trips: s.trips.map((i) => (i.id === id ? { ...i, shareToken: null } : i)) })),

    /** bookings insert. In production: server function + Stripe Connect PaymentIntent for paid tickets, no application fee. */
    book: (experienceId: string, opts: { slotId: string | null; plusOne: boolean; consent: boolean; note?: string }) => {
      const e = exp(experienceId)!;
      const status: Booking["status"] = e.accessType === "apply" || e.accessType === "invite" ? "applied" : "booked";
      const qty = opts.plusOne ? 2 : 1;
      const amount = e.price != null ? e.price * qty : null;
      const b: Booking = {
        id: uid("bk"), experienceId, slotId: opts.slotId, userId: ME.id, guestName: ME.name, status, plusOne: opts.plusOne,
        shareOutcomesConsent: opts.consent, stripePaymentIntent: e.price != null ? "pi_test_" + Math.random().toString(36).slice(2, 12) : null,
        amountPaid: amount, note: opts.note, code: code(), createdAt: NOW.slice(0, 10),
      };
      let tripName: string | null = null;
      apply((s) => {
        let next: TravelState = {
          ...s, bookings: [...s.bookings.filter((x) => !(x.experienceId === experienceId && x.userId === ME.id && x.status === "cancelled")), b],
          experiences: s.experiences.map((x) => x.id !== experienceId || status !== "booked" ? x : {
            ...x, placesLeft: Math.max(0, x.placesLeft - qty),
            slots: x.slots?.map((sl) => (sl.id === opts.slotId ? { ...sl, booked: sl.booked + qty } : sl)),
          }),
        };
        const r = placeInTrip(next, e, status === "booked" ? "booked" : "saved");
        next = r.s; tripName = r.name;
        return next;
      });
      return { booking: b, trip: tripName as string | null };
    },
    joinWaitlist: (experienceId: string, slotId: string | null, consent: boolean) => {
      const e = exp(experienceId)!;
      const sampleWaiting = (SAMPLE_ATTENDEES[experienceId] ?? []).filter((a) => a.status === "waitlist" && (!slotId || !a.slot || a.slot === slotId)).length;
      const b: Booking = {
        id: uid("bk"), experienceId, slotId, userId: ME.id, guestName: ME.name, status: "waitlisted", plusOne: false, shareOutcomesConsent: consent,
        stripePaymentIntent: null, amountPaid: null, waitlistPosition: sampleWaiting + 1, code: code(), createdAt: NOW.slice(0, 10),
      };
      apply((s) => placeInTrip({ ...s, bookings: [...s.bookings, b] }, e, "saved").s);
      return b;
    },
    cancelBooking: (bookingId: string) => apply((s) => {
      const b = s.bookings.find((x) => x.id === bookingId); if (!b) return s;
      const qty = b.plusOne ? 2 : 1;
      return {
        ...s,
        bookings: s.bookings.map((x) => (x.id === bookingId ? { ...x, status: "cancelled" } : x)),
        offers: s.offers.filter((o) => o.bookingId !== bookingId),
        experiences: s.experiences.map((x) => x.id !== b.experienceId || b.status !== "booked" ? x : {
          ...x, placesLeft: x.placesLeft + qty,
          slots: x.slots?.map((sl) => (sl.id === b.slotId ? { ...sl, booked: Math.max(0, sl.booked - qty) } : sl)),
        }),
        trips: s.trips.map((i) => ({ ...i, items: i.items.map((x) => (x.experienceId === b.experienceId ? { ...x, status: "saved" as const } : x)) })),
      };
    }),
    /** waitlist_offers: accept within the time limit */
    claimOffer: (bookingId: string) => apply((s) => {
      const b = s.bookings.find((x) => x.id === bookingId); if (!b) return s;
      const e = s.experiences.find((x) => x.id === b.experienceId)!;
      const next: TravelState = {
        ...s, offers: s.offers.filter((o) => o.bookingId !== bookingId),
        bookings: s.bookings.map((x) => (x.id === bookingId ? { ...x, status: "booked", waitlistPosition: undefined, amountPaid: e.price, stripePaymentIntent: e.price != null ? "pi_test_" + Math.random().toString(36).slice(2, 12) : null } : x)),
      };
      return placeInTrip(next, e, "booked").s;
    }),
    /** The hold ran out: the place passes to the next person on the waitlist. */
    expireOffer: (bookingId: string) => apply((s) => {
      const b = s.bookings.find((x) => x.id === bookingId);
      const o = s.offers.find((x) => x.bookingId === bookingId);
      if (!b || !o) return s;
      const e = s.experiences.find((x) => x.id === b.experienceId)!;
      return notify({ ...s, offers: s.offers.filter((x) => x.bookingId !== bookingId) }, {
        kind: "waitlist_offer", to: { experienceId: e.id }, text: o.slotLabel ? `The ${o.slotLabel} place at ${e.title} went to the next person` : `The place at ${e.title} went to the next person`,
        detail: "You're still on the waitlist. We'll tell you if another place opens.",
      });
    }),
    /** Preview only: move my waitlist booking to the front, as Supabase Realtime would when places open. */
    reachFront: (bookingId: string) => apply((s) => {
      const b = s.bookings.find((x) => x.id === bookingId); if (!b) return s;
      const e = s.experiences.find((x) => x.id === b.experienceId)!;
      const slot = e.slots?.find((x) => x.id === b.slotId);
      const label = slot ? slotTime(slot.startsAt, e.timezone) : "";
      const expires = new Date(Date.parse(NOW) + LIVE_OFFER_MINUTES * 60_000).toISOString();
      return notify({
        ...s,
        bookings: s.bookings.map((x) => (x.id === bookingId ? { ...x, waitlistPosition: 1 } : x)),
        offers: [...s.offers.filter((o) => o.bookingId !== bookingId), { bookingId, offeredAt: NOW, expiresAt: expires, slotLabel: label, holdMinutes: LIVE_OFFER_MINUTES, startedAtMs: Date.now() }],
      }, {
        kind: "waitlist_offer", to: { experienceId: e.id },
        text: `A place opened${label ? ` at ${label}` : ""}. It's held for you for ${LIVE_OFFER_MINUTES} minutes.`,
        detail: `${e.title}. After that it goes to the next person on the waitlist.`,
      });
    }),
    /** experience_live.wait_minutes, broadcast with Supabase Realtime */
    setWait: (experienceId: string, waitMinutes: number) => apply((s) => ({ ...s, live: { ...s.live, [experienceId]: { waitMinutes, updatedAt: NOW } } })),

    /** tried_products insert: only for guests checked in to that event */
    tryProduct: (experienceId: string, product: string, reaction: TriedProduct["reaction"], note: string) => apply((s) => {
      const existing = s.tried.find((t) => t.experienceId === experienceId && t.product === product);
      const row: TriedProduct = { id: existing?.id ?? uid("tp"), experienceId, product, reaction, note, at: NOW.slice(0, 10) };
      return { ...s, tried: existing ? s.tried.map((t) => (t.id === existing.id ? row : t)) : [...s.tried, row] };
    }),
    removeTried: (id: string) => apply((s) => ({ ...s, tried: s.tried.filter((t) => t.id !== id) })),
    /** experience_attendance.shared_with_host */
    setStampShared: (experienceId: string, shared: boolean) => apply((s) => ({ ...s, attendance: s.attendance.map((a) => (a.experienceId === experienceId ? { ...a, sharedWithHost: shared } : a)) })),

    /** bring_it_back_requests insert, and a host follow for that city */
    bringItBack: (experienceId: string, city: string) => apply((s) => {
      const e = s.experiences.find((x) => x.id === experienceId)!;
      const row = s.bringBack.find((r) => r.experienceId === experienceId) ?? { experienceId, counts: {}, mine: null };
      const counts = { ...row.counts };
      if (row.mine) counts[row.mine] = Math.max(0, (counts[row.mine] ?? 1) - 1);
      counts[city] = (counts[city] ?? 0) + 1;
      const updated = { ...row, counts, mine: city };
      const following = s.follows.some((f) => f.targetType === "host" && f.target === e.hostId && f.city === city);
      return {
        ...s,
        bringBack: s.bringBack.some((r) => r.experienceId === experienceId) ? s.bringBack.map((r) => (r.experienceId === experienceId ? updated : r)) : [...s.bringBack, updated],
        follows: following ? s.follows : [...s.follows, { id: uid("f"), targetType: "host", target: e.hostId, city, alertsEmail: true, alertsInApp: true }],
      };
    }),

    /** follows: city, area, country, continent or host, with alerts */
    toggleFollow: (targetType: Follow["targetType"], target: string, city?: string) => {
      const existing = stateRef.current.follows.find((f) => f.targetType === targetType && f.target === target && (f.city ?? null) === (city ?? null));
      apply((s) => ({
        ...s, follows: existing ? s.follows.filter((f) => f.id !== existing.id)
          : [...s.follows, { id: uid("f"), targetType, target, city, alertsEmail: true, alertsInApp: true }],
      }));
      return !existing;
    },
    isFollowing: (targetType: Follow["targetType"], target: string, city?: string) =>
      stateRef.current.follows.some((f) => f.targetType === targetType && f.target === target && (city === undefined || (f.city ?? null) === (city ?? null))),
    setFollowAlerts: (id: string, patch: Partial<Pick<Follow, "alertsEmail" | "alertsInApp">>) => apply((s) => ({ ...s, follows: s.follows.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
    /** saved_searches: alerts for a trip's place and dates */
    saveSearch: (ss: Omit<SavedSearch, "id" | "alerts">) => apply((s) => ({ ...s, savedSearches: [...s.savedSearches, { ...ss, id: uid("ss"), alerts: true }] })),
    removeSearch: (id: string) => apply((s) => ({ ...s, savedSearches: s.savedSearches.filter((x) => x.id !== id) })),
    markRead: (id?: string) => apply((s) => ({ ...s, notifications: s.notifications.map((n) => (!id || n.id === id ? { ...n, read: true } : n)) })),

    // ------------------------------------------------------------ rooms
    joinRoom: (experienceId: string) => apply((s) => ({ ...s, roomsJoined: [...new Set([...s.roomsJoined, experienceId])], roomSeen: { ...s.roomSeen, [experienceId]: s.roomPosts.filter((p) => p.experienceId === experienceId).length } })),
    leaveRoom: (experienceId: string) => apply((s) => ({ ...s, roomsJoined: s.roomsJoined.filter((x) => x !== experienceId) })),
    /** room_reads: how many posts she'd seen, for the unread count on Rooms */
    markRoomSeen: (experienceId: string) => apply((s) => {
      const n = s.roomPosts.filter((p) => p.experienceId === experienceId).length;
      return s.roomSeen[experienceId] === n ? s : { ...s, roomSeen: { ...s.roomSeen, [experienceId]: n } };
    }),
    setRoomPref: (experienceId: string, patch: Partial<RoomPreference>) => apply((s) => ({
      ...s, roomPrefs: { ...s.roomPrefs, [experienceId]: { ...(s.roomPrefs[experienceId] ?? DEFAULT_ROOM_PREF), ...patch } },
    })),
    addRoomPost: (experienceId: string, kind: RoomPost["kind"], text: string, fromHost = false) => apply((s) => ({
      ...s, roomPosts: [...s.roomPosts, { id: uid("r"), experienceId, kind, text, fromHost, author: fromHost ? HOSTS[s.experiences.find((e) => e.id === experienceId)!.hostId].name : ME.name, at: NOW }],
    })),
    /** sensory_votes upsert */
    vote: (experienceId: string, accurate: boolean, comment = "") => apply((s) => ({ ...s, votes: { ...s.votes, [experienceId]: { accurate, comment } } })),

    // ------------------------------------------------------------ host studio
    /** experiences insert/update. Treatments go to pending_verification until an admin verifies the license. */
    saveExperience: (e: Experience, publish: boolean) => {
      const status: Experience["status"] = !publish ? "draft" : e.treatment && !e.treatment.licenseVerifiedAt ? "pending_verification" : "published";
      const saved = { ...e, status };
      apply((s) => {
        const exists = s.experiences.some((x) => x.id === e.id);
        let next: TravelState = {
          ...s, experiences: exists ? s.experiences.map((x) => (x.id === e.id ? saved : x)) : [...s.experiences, saved],
          // editing a co-hosted draft asks both hosts to approve again
          collaborations: s.collaborations.map((c) => (c.experienceId === e.id && status === "draft" ? { ...c, approvals: { a: false, b: false } } : c)),
        };
        if (status === "published") next = alertFollowers(next, saved);
        return next;
      });
      return status;
    },
    /** bookings.status = checked_in, and experience_attendance for Passport stamps */
    checkIn: (experienceId: string, ticketCode: string) => apply((s) => {
      const mine = s.bookings.find((b) => b.code === ticketCode && b.experienceId === experienceId && b.userId === ME.id);
      return {
        ...s, checkedIn: { ...s.checkedIn, [experienceId]: [...new Set([...(s.checkedIn[experienceId] ?? []), ticketCode])] },
        bookings: s.bookings.map((b) => (b.code === ticketCode && b.experienceId === experienceId ? { ...b, status: "checked_in", checkedInAt: NOW } : b)),
        attendance: mine && !s.attendance.some((a) => a.experienceId === experienceId) ? [...s.attendance, { experienceId, checkedInAt: NOW, sharedWithHost: mine.shareOutcomesConsent }] : s.attendance,
      };
    }),
    /** waitlist_offers insert; notifies the guest (email + in-app). Live events hold for minutes, others for hours. */
    offerPlace: (experienceId: string, ticketCode: string, live: boolean) => apply((s) => {
      const b = s.bookings.find((x) => x.code === ticketCode && x.experienceId === experienceId && x.status === "waitlisted");
      const e = s.experiences.find((x) => x.id === experienceId)!;
      if (!b) return { ...s, offeredSample: { ...s.offeredSample, [experienceId]: [...(s.offeredSample[experienceId] ?? []), ticketCode] } };
      const ms = live ? LIVE_OFFER_MINUTES * 60_000 : WAITLIST_OFFER_HOURS * 3_600_000;
      const hold = live ? `${LIVE_OFFER_MINUTES} minutes` : `${WAITLIST_OFFER_HOURS} hours`;
      return notify({ ...s, offers: [...s.offers, { bookingId: b.id, offeredAt: NOW, expiresAt: new Date(Date.parse(NOW) + ms).toISOString(), holdMinutes: live ? LIVE_OFFER_MINUTES : undefined, startedAtMs: live ? Date.now() : undefined }] }, {
        kind: "waitlist_offer", to: { experienceId }, text: `A place opened for ${e.title}. It's held for you for ${hold}.`,
        detail: "After that it goes to the next person on the waitlist.",
      });
    }),
    sendUpdate: (experienceId: string, text: string) => apply((s) => {
      const e = s.experiences.find((x) => x.id === experienceId)!;
      let next: TravelState = { ...s, roomPosts: [...s.roomPosts, { id: uid("r"), experienceId, kind: "update", fromHost: true, author: HOSTS[e.hostId].name, text, at: NOW }] };
      if (myBooking(s, experienceId)) {
        next = notify(next, { kind: "host_update", to: { experienceId }, text: `${HOSTS[e.hostId].name} sent an update about ${e.title}`, detail: `"${text.slice(0, 90)}${text.length > 90 ? "…" : ""}"` });
      }
      return next;
    }),

    // ------------------------------------------------------------ partnership board
    /** board_posts insert. A brief is private to verified businesses and never creates a public experience. */
    createPost: (p: Omit<BoardPost, "id" | "status" | "postedAt">, status: BoardPost["status"] = "open") => {
      const id = uid("bp");
      apply((s) => ({ ...s, boardPosts: [{ ...p, id, status, postedAt: NOW.slice(0, 10) }, ...s.boardPosts] }));
      return id;
    },
    updatePost: (id: string, patch: Partial<BoardPost>) => apply((s) => ({ ...s, boardPosts: s.boardPosts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
    /** Closing stops new proposals. It never deletes the brief or changes any proposal's outcome. */
    setPostStatus: (id: string, status: BoardPost["status"]) => apply((s) => ({
      ...s, boardPosts: s.boardPosts.map((p) => (p.id !== id ? p : {
        ...p, status, closedAt: status === "closed" ? NOW.slice(0, 10) : undefined,
        postedAt: status === "open" && p.status === "draft" ? NOW.slice(0, 10) : p.postedAt,
      })),
    })),
    toggleSavedPost: (id: string) => {
      const on = !stateRef.current.savedPosts.includes(id);
      apply((s) => ({ ...s, savedPosts: on ? [...s.savedPosts, id] : s.savedPosts.filter((x) => x !== id) }));
      return on;
    },
    /** board_proposals insert. One live proposal per brief: a withdrawn one can be replaced. */
    propose: (postId: string, f: { person: string; pitch: string; availability: string; terms: string; portfolio?: string }) => {
      const cur = stateRef.current;
      const live = cur.proposals.find((x) => x.postId === postId && x.fromBusinessId === MY_BUSINESS && x.status !== "withdrawn");
      if (live) return false;
      const post = cur.boardPosts.find((p) => p.id === postId)!;
      apply((s) => ({ ...s, proposals: [...s.proposals, { id: uid("pr"), postId, fromBusinessId: MY_BUSINESS, toBusinessId: post.businessId, ...f, status: "new", at: NOW.slice(0, 10) }] }));
      return true;
    },
    setProposal: (id: string, patch: Partial<BoardProposal>) => apply((s) => ({ ...s, proposals: s.proposals.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    decline: (id: string, reason: string) => apply((s) => ({ ...s, proposals: s.proposals.map((x) => (x.id === id ? { ...x, status: "declined", reviewed: true, decisionReason: reason || undefined, decidedAt: NOW.slice(0, 10) } : x)) })),
    withdraw: (id: string) => apply((s) => ({ ...s, proposals: s.proposals.map((x) => (x.id === id ? { ...x, status: "withdrawn", decidedAt: NOW.slice(0, 10) } : x)) })),
    setArchived: (proposalId: string, archived: boolean) => apply((s) => ({ ...s, proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, archived } : x)) })),
    /**
     * The explicit agreement step. Each business confirms independently (in the preview the other
     * side is simulated and labeled). When both have confirmed, the proposal is accepted and a
     * shared workspace opens. Nothing here is a contract, booking or payment.
     */
    confirmAgreement: (proposalId: string, side: "poster" | "applicant", scope: string, terms: string) => {
      let collabId: string | null = null;
      apply((s) => {
        const p = s.proposals.find((x) => x.id === proposalId)!;
        const agreement = { scope, terms, poster: p.agreement?.poster ?? false, applicant: p.agreement?.applicant ?? false, [side]: true };
        if (!(agreement.poster && agreement.applicant)) return { ...s, proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, agreement } : x)) };
        const post = s.boardPosts.find((x) => x.id === p.postId)!;
        const id = uid("c");
        collabId = id;
        const a = post.businessId, b = a === p.fromBusinessId ? p.toBusinessId : p.fromBusinessId;
        return {
          ...s,
          proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, agreement, status: "accepted", reviewed: true, decidedAt: NOW.slice(0, 10), collaborationId: id } : x)),
          collaborations: [...s.collaborations, {
            id, title: post.title, aId: a, bId: b, postId: post.id, proposalId, scope, terms,
            eventDate: post.startDate, city: post.city === "Any city" ? HOSTS[a].city : post.city, status: "planning",
            tasks: [
              { id: uid("t"), text: "Agree the guest-facing description", owner: "both", done: false },
              { id: uid("t"), text: "Confirm the venue and access information", owner: "a", done: false },
              { id: uid("t"), text: "Share brand assets", owner: "b", done: false },
            ],
            messages: [{ id: uid("m"), from: p.fromBusinessId, text: p.pitch, at: NOW }], assets: [], approvals: { a: false, b: false }, experienceId: null,
          }],
        };
      });
      return collabId as string | null;
    },
    invite: (hostId: string) => apply((s) => ({ ...s, invitesSent: [...new Set([...s.invitesSent, hostId])] })),
    updateCollab: (id: string, fn: (c: Collaboration) => Collaboration) => apply((s) => ({ ...s, collaborations: s.collaborations.map((c) => (c.id === id ? fn(c) : c)) })),
    addTask: (id: string, text: string, owner: CollaborationTask["owner"]) => apply((s) => ({
      ...s, collaborations: s.collaborations.map((c) => (c.id === id ? { ...c, tasks: [...c.tasks, { id: uid("t"), text, owner, done: false }] } : c)),
    })),
    /**
     * Create event draft: the bridge to My events. Prefills only what the partners agreed (title,
     * city, date, scope). Everything else waits for the hosts. A draft is never discoverable or bookable.
     */
    createEventDraft: (id: string) => {
      const c = stateRef.current.collaborations.find((x) => x.id === id)!;
      if (c.experienceId) return c.experienceId;
      const post = c.postId ? stateRef.current.boardPosts.find((p) => p.id === c.postId) : undefined;
      const eid = uid("exp");
      const date = c.eventDate || NOW.slice(0, 10);
      const zone = zoneFor(c.city);
      const draft: Experience = {
        id: eid, hostId: c.aId, coHostId: c.bId, title: c.title, category: post?.category ?? "brand", accessType: "rsvp_guaranteed",
        description: "", includes: "", cancellationTerms: "",
        price: null, currency: zone.currency, capacity: 0, placesLeft: 0, startsAt: `${date}T18:00:00${zone.offset}`, endsAt: `${date}T21:00:00${zone.offset}`, timezone: zone.zone,
        address: "", neighborhood: "", city: c.city, country: zone.country, x: 60, y: 44, status: "draft", unconfirmed: ["time", "admission", "address"],
        sensory: { energy: null, fragrance: null, group: null, touch: null, setting: "", music: "" },
        palette: post?.palette ?? "dusk", products: [], articles: [], roomMembers: 0,
      };
      apply((s) => ({
        ...s, experiences: [...s.experiences, draft],
        collaborations: s.collaborations.map((x) => (x.id === id ? { ...x, experienceId: eid, approvals: { a: false, b: false } } : x)),
      }));
      return eid;
    },
    /** Each host approves the reviewed draft. Approval alone doesn't publish. */
    approveCollab: (id: string, side: "a" | "b") => apply((s) => ({ ...s, collaborations: s.collaborations.map((x) => (x.id === id ? { ...x, approvals: { ...x.approvals, [side]: true }, status: "awaiting_approval" } : x)) })),
    /** Publish: a separate action once both hosts approved and every required check passes. */
    publishCollab: (id: string) => apply((s) => {
      const c = s.collaborations.find((x) => x.id === id)!;
      if (!c.experienceId || !c.approvals.a || !c.approvals.b) return s;
      let next: TravelState = {
        ...s,
        collaborations: s.collaborations.map((x) => (x.id === id ? { ...x, status: "live" } : x)),
        experiences: s.experiences.map((e) => (e.id === c.experienceId ? { ...e, status: "published", placesLeft: e.capacity } : e)),
      };
      next = alertFollowers(next, next.experiences.find((e) => e.id === c.experienceId)!);
      return next;
    }),
    rateCollab: (id: string, stars: number, comment: string) => apply((s) => ({ ...s, collaborations: s.collaborations.map((c) => (c.id === id ? { ...c, rating: { stars, comment } } : c)) })),

    // ------------------------------------------------------------ admin
    /** experience_treatments.license_verified_at + verified_by */
    verifyLicense: (experienceId: string) => apply((s) => {
      const next: TravelState = {
        ...s, experiences: s.experiences.map((e) => (e.id === experienceId && e.treatment
          ? { ...e, status: "published", treatment: { ...e.treatment, licenseVerifiedAt: NOW, verifiedBy: ADMIN.name } } : e)),
      };
      return alertFollowers(next, next.experiences.find((e) => e.id === experienceId)!);
    }),
    returnToHost: (experienceId: string) => apply((s) => ({ ...s, experiences: s.experiences.map((e) => (e.id === experienceId ? { ...e, status: "draft" } : e)) })),
    setRule: (type: TreatmentRule["treatmentType"], patch: Partial<TreatmentRule>) => apply((s) => ({ ...s, treatmentRules: s.treatmentRules.map((r) => (r.treatmentType === type ? { ...r, ...patch } : r)) })),
    introduce: (a: string, b: string, note: string) => apply((s) => ({ ...s, introductions: [{ id: uid("in"), a, b, note, at: NOW }, ...s.introductions] })),
  };

  return { state, toasts, ...actions };
}

type Store = ReturnType<typeof useTravelStore>;
const Ctx = createContext<Store | null>(null);

export function TravelProvider({ children }: { children: ReactNode }) {
  const store = useTravelStore();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useTravel() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useTravel must be used inside <TravelProvider>");
  return s;
}

export function useExperience(id: string | undefined) {
  const { state } = useTravel();
  return useMemo(() => state.experiences.find((e) => e.id === id), [state.experiences, id]);
}

/** Ticks every second so live holds can count down in the preview. */
export function useTick(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}
