// Preview state for Plume Travel. Every action here maps to a future Supabase query or
// server function (noted inline). Nothing leaves the browser: this is mock data only.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ADMIN, BOARD_POSTS, EXPERIENCES, HOSTS, ME, MY_BUSINESS, SAMPLE_ATTENDEES, SEED_BOOKINGS, SEED_COLLABORATIONS, SEED_FOLLOWS,
  SEED_ITINERARIES, SEED_NOTIFICATIONS, SEED_PROPOSALS, SEED_ROOM_POSTS, TREATMENT_RULES,
} from "../data/seed";
import { WAITLIST_OFFER_HOURS } from "../config";
import { localDate } from "../lib/format";
import type {
  BoardPost, BoardProposal, Booking, Category, Collaboration, CollaborationTask, Experience, ExperienceAttendance, Follow, Itinerary,
  Notification, Role, RoomPost, RoomPreference, TreatmentRule, WaitlistOffer,
} from "../types";

export type Feel = "quiet" | "lively" | "nofrag" | "small" | "notouch";

export interface Discovery {
  mode: "near" | "travel";
  near: string;
  when: "This weekend" | "This week" | "This month";
  tripCity: string;
  from: string;
  to: string;
  cat: Category | "all";
  feels: Feel[];
}

export interface TravelState {
  v: 1;
  role: Role;
  discovery: Discovery;
  experiences: Experience[];
  bookings: Booking[];
  offers: WaitlistOffer[];
  itineraries: Itinerary[];
  activeItinerary: string;
  follows: Follow[];
  notifications: Notification[];
  roomPrefs: Record<string, RoomPreference>;
  roomPosts: RoomPost[];
  votes: Record<string, { accurate: boolean; comment: string }>;
  attendance: ExperienceAttendance[];
  checkedIn: Record<string, string[]>;
  offeredSample: Record<string, string[]>;
  boardPosts: BoardPost[];
  proposals: BoardProposal[];
  collaborations: Collaboration[];
  invitesSent: string[];
  treatmentRules: TreatmentRule[];
  introductions: { id: string; a: string; b: string; note: string; at: string }[];
  homeNoteDismissed: boolean;
}

const KEY = "plume-travel-preview:v1";
const NOW = "2026-10-12T15:00:00Z";
let seq = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;
const code = () => "PT-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

function initial(): TravelState {
  return {
    v: 1,
    role: "lover",
    discovery: { mode: "travel", near: "New York", when: "This weekend", tripCity: "Paris", from: "2027-06-12", to: "2027-06-18", cat: "all", feels: [] },
    experiences: structuredClone(EXPERIENCES),
    bookings: structuredClone(SEED_BOOKINGS),
    offers: [],
    itineraries: structuredClone(SEED_ITINERARIES),
    activeItinerary: "it-paris",
    follows: structuredClone(SEED_FOLLOWS),
    notifications: structuredClone(SEED_NOTIFICATIONS),
    roomPrefs: {},
    roomPosts: structuredClone(SEED_ROOM_POSTS),
    votes: {},
    attendance: [{ userId: ME.id, experienceId: "p1", productsTried: ["Clay cleansing balm", "Soft focus blush"] }],
    checkedIn: { e10: ["PT-91AA", "PT-91AC"], e5: [] },
    offeredSample: {},
    boardPosts: structuredClone(BOARD_POSTS),
    proposals: structuredClone(SEED_PROPOSALS),
    collaborations: structuredClone(SEED_COLLABORATIONS),
    invitesSent: [],
    treatmentRules: structuredClone(TREATMENT_RULES),
    introductions: [],
    homeNoteDismissed: false,
  };
}

function load(): TravelState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1) return { ...initial(), ...s };
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
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
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

  /** Fan out "new experience" alerts to followers of the city or host (email + in-app in production). */
  const alertFollowers = (s: TravelState, e: Experience): TravelState => {
    const host = HOSTS[e.hostId];
    const byCity = s.follows.find((f) => f.targetType === "city" && f.target === e.city && f.alertsInApp);
    const byHost = s.follows.find((f) => f.targetType === "host" && f.target === e.hostId && f.alertsInApp && (!f.city || f.city === e.city));
    if (!byCity && !byHost) return s;
    return notify(s, {
      kind: "new_experience", to: { experienceId: e.id },
      text: byHost ? `${host.name} just posted: ${e.title}` : `New in ${e.city}: ${e.title}`,
      detail: byHost ? `Because you asked to hear when ${host.name} hosts.` : `Because you follow ${e.city}.`,
    });
  };

  const placeInItinerary = (s: TravelState, e: Experience, status: "saved" | "booked", itineraryId?: string): { s: TravelState; name: string | null } => {
    const date = localDate(e.startsAt, e.timezone);
    let target = itineraryId
      ? s.itineraries.find((i) => i.id === itineraryId)
      : s.itineraries.find((i) => i.items.some((x) => x.experienceId === e.id)) ??
        s.itineraries.find((i) => i.city === e.city && (e.recurring || (date >= i.from && date <= i.to))) ??
        s.itineraries.find((i) => i.city === e.city);
    if (!target) return { s, name: null };
    const has = target.items.some((x) => x.experienceId === e.id);
    const items = has
      ? target.items.map((x) => (x.experienceId === e.id ? { ...x, status: status === "booked" ? "booked" as const : x.status } : x))
      : [...target.items, { experienceId: e.id, status }];
    const t = target;
    return { s: { ...s, itineraries: s.itineraries.map((i) => (i.id === t.id ? { ...i, items } : i)) }, name: t.name };
  };

  // ------------------------------------------------------------ actions
  const actions = {
    toast, dismissToast,
    reset: () => { try { window.localStorage.removeItem(KEY); } catch { /* ignore */ } apply(() => initial()); },
    setRole: (role: Role) => apply((s) => ({ ...s, role })),
    setDiscovery: (patch: Partial<Discovery>) => apply((s) => ({ ...s, discovery: { ...s.discovery, ...patch } })),
    dismissHomeNote: () => apply((s) => ({ ...s, homeNoteDismissed: true })),

    isSaved: (id: string) => stateRef.current.itineraries.some((i) => i.items.some((x) => x.experienceId === id)),
    bookingFor: (id: string) => stateRef.current.bookings.find((b) => b.experienceId === id && b.userId === ME.id && b.status !== "cancelled"),

    /** itinerary_items insert/delete */
    saveTo: (experienceId: string, itineraryId?: string) => {
      const e = exp(experienceId); if (!e) return null;
      let name: string | null = null;
      apply((s) => { const r = placeInItinerary(s, e, "saved", itineraryId); name = r.name; return r.s; });
      return name;
    },
    unsave: (experienceId: string, itineraryId?: string) => apply((s) => ({
      ...s,
      itineraries: s.itineraries.map((i) => (!itineraryId || i.id === itineraryId)
        ? { ...i, items: i.items.filter((x) => !(x.experienceId === experienceId && x.status === "saved")) } : i),
    })),
    createItinerary: (name: string, city: string, from: string, to: string, firstItem?: string) => {
      const id = uid("it");
      apply((s) => ({ ...s, activeItinerary: id, itineraries: [...s.itineraries, { id, name, city, from, to, shareToken: null, items: firstItem ? [{ experienceId: firstItem, status: "saved" }] : [] }] }));
      return id;
    },
    setActiveItinerary: (id: string) => apply((s) => ({ ...s, activeItinerary: id })),
    /** itinerary_share_links insert: a view-only token */
    shareItinerary: (id: string) => {
      const token = Math.random().toString(36).slice(2, 10);
      apply((s) => ({ ...s, itineraries: s.itineraries.map((i) => (i.id === id ? { ...i, shareToken: token } : i)) }));
      return token;
    },
    stopSharing: (id: string) => apply((s) => ({ ...s, itineraries: s.itineraries.map((i) => (i.id === id ? { ...i, shareToken: null } : i)) })),

    /** bookings insert. In production: server function + Stripe Connect PaymentIntent for paid tickets. */
    book: (experienceId: string, opts: { slotId: string | null; plusOne: boolean; consent: boolean; note?: string }) => {
      const e = exp(experienceId)!;
      const status: Booking["status"] = e.accessType === "apply" || e.accessType === "invite" ? "applied" : "booked";
      const amount = e.price != null ? e.price * (opts.plusOne ? 2 : 1) : null;
      const b: Booking = {
        id: uid("bk"), experienceId, slotId: opts.slotId, userId: ME.id, guestName: ME.name, status, plusOne: opts.plusOne,
        shareOutcomesConsent: opts.consent, stripePaymentIntent: e.price != null ? "pi_test_" + Math.random().toString(36).slice(2, 12) : null,
        amountPaid: amount, note: opts.note, code: code(), createdAt: NOW.slice(0, 10),
      };
      let itinName: string | null = null;
      apply((s) => {
        let next: TravelState = {
          ...s, bookings: [...s.bookings, b],
          experiences: s.experiences.map((x) => x.id !== experienceId || status !== "booked" ? x : {
            ...x, placesLeft: Math.max(0, x.placesLeft - (opts.plusOne ? 2 : 1)),
            slots: x.slots?.map((sl) => (sl.id === opts.slotId ? { ...sl, booked: sl.booked + (opts.plusOne ? 2 : 1) } : sl)),
          }),
        };
        const r = placeInItinerary(next, e, status === "booked" ? "booked" : "saved");
        next = r.s; itinName = r.name;
        return next;
      });
      return { booking: b, itinerary: itinName as string | null };
    },
    joinWaitlist: (experienceId: string, slotId: string | null, consent: boolean) => {
      const e = exp(experienceId)!;
      const sampleWaiting = (SAMPLE_ATTENDEES[experienceId] ?? []).filter((a) => a.status === "waitlist").length;
      const mine = stateRef.current.bookings.filter((b) => b.experienceId === experienceId && b.status === "waitlisted").length;
      const b: Booking = {
        id: uid("bk"), experienceId, slotId, userId: ME.id, guestName: ME.name, status: "waitlisted", plusOne: false, shareOutcomesConsent: consent,
        stripePaymentIntent: null, amountPaid: null, waitlistPosition: sampleWaiting + mine + 1, code: code(), createdAt: NOW.slice(0, 10),
      };
      apply((s) => placeInItinerary({ ...s, bookings: [...s.bookings, b] }, e, "saved").s);
      return b;
    },
    cancelBooking: (bookingId: string) => apply((s) => {
      const b = s.bookings.find((x) => x.id === bookingId); if (!b) return s;
      return {
        ...s,
        bookings: s.bookings.map((x) => (x.id === bookingId ? { ...x, status: "cancelled" } : x)),
        offers: s.offers.filter((o) => o.bookingId !== bookingId),
        experiences: s.experiences.map((x) => x.id !== b.experienceId || b.status !== "booked" ? x : {
          ...x, placesLeft: x.placesLeft + (b.plusOne ? 2 : 1),
          slots: x.slots?.map((sl) => (sl.id === b.slotId ? { ...sl, booked: Math.max(0, sl.booked - (b.plusOne ? 2 : 1)) } : sl)),
        }),
        itineraries: s.itineraries.map((i) => ({ ...i, items: i.items.map((x) => (x.experienceId === b.experienceId ? { ...x, status: "saved" as const } : x)) })),
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
      return placeInItinerary(next, e, "booked").s;
    }),

    setRoomPref: (experienceId: string, patch: Partial<RoomPreference>) => apply((s) => ({
      ...s, roomPrefs: { ...s.roomPrefs, [experienceId]: { ...(s.roomPrefs[experienceId] ?? { showInAttendeeList: false, wantsToMeet: false }), ...patch } },
    })),
    addRoomPost: (experienceId: string, kind: RoomPost["kind"], text: string, fromHost = false) => apply((s) => ({
      ...s, roomPosts: [...s.roomPosts, { id: uid("r"), experienceId, kind, text, fromHost, author: fromHost ? HOSTS[s.experiences.find((e) => e.id === experienceId)!.hostId].name : ME.name, at: NOW }],
    })),
    /** sensory_votes upsert */
    vote: (experienceId: string, accurate: boolean, comment = "") => apply((s) => ({ ...s, votes: { ...s.votes, [experienceId]: { accurate, comment } } })),

    /** follows: city or host, with alerts */
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
    markRead: (id?: string) => apply((s) => ({ ...s, notifications: s.notifications.map((n) => (!id || n.id === id ? { ...n, read: true } : n)) })),

    // ------------------------------------------------------------ host studio
    /** experiences insert/update. Treatments go to pending_verification until an admin verifies the license. */
    saveExperience: (e: Experience, publish: boolean) => {
      const status: Experience["status"] = !publish ? "draft" : e.treatment && !e.treatment.licenseVerifiedAt ? "pending_verification" : "published";
      const saved = { ...e, status };
      apply((s) => {
        const exists = s.experiences.some((x) => x.id === e.id);
        let next: TravelState = { ...s, experiences: exists ? s.experiences.map((x) => (x.id === e.id ? saved : x)) : [...s.experiences, saved] };
        if (status === "published") next = alertFollowers(next, saved);
        return next;
      });
      return status;
    },
    checkIn: (experienceId: string, ticketCode: string) => apply((s) => ({
      ...s, checkedIn: { ...s.checkedIn, [experienceId]: [...new Set([...(s.checkedIn[experienceId] ?? []), ticketCode])] },
      bookings: s.bookings.map((b) => (b.code === ticketCode && b.experienceId === experienceId ? { ...b, status: "checked_in" } : b)),
    })),
    /** waitlist_offers insert; notifies the guest (email + in-app). */
    offerPlace: (experienceId: string, ticketCode: string) => apply((s) => {
      const b = s.bookings.find((x) => x.code === ticketCode && x.experienceId === experienceId && x.status === "waitlisted");
      const e = s.experiences.find((x) => x.id === experienceId)!;
      if (!b) return { ...s, offeredSample: { ...s.offeredSample, [experienceId]: [...(s.offeredSample[experienceId] ?? []), ticketCode] } };
      const expires = new Date(Date.parse(NOW) + WAITLIST_OFFER_HOURS * 3_600_000).toISOString();
      return notify({ ...s, offers: [...s.offers, { bookingId: b.id, offeredAt: NOW, expiresAt: expires }] }, {
        kind: "waitlist_offer", to: { experienceId }, text: `A place opened for ${e.title}`,
        detail: `It's held for you for ${WAITLIST_OFFER_HOURS} hours. After that it goes to the next person on the waitlist.`,
      });
    }),
    sendUpdate: (experienceId: string, text: string) => apply((s) => {
      const e = s.experiences.find((x) => x.id === experienceId)!;
      let next: TravelState = { ...s, roomPosts: [...s.roomPosts, { id: uid("r"), experienceId, kind: "update", fromHost: true, author: HOSTS[e.hostId].name, text, at: NOW }] };
      if (s.bookings.some((b) => b.experienceId === experienceId && b.userId === ME.id && b.status !== "cancelled")) {
        next = notify(next, { kind: "host_update", to: { experienceId }, text: `${HOSTS[e.hostId].name} sent an update about ${e.title}`, detail: `"${text.slice(0, 90)}${text.length > 90 ? "…" : ""}"` });
      }
      return next;
    }),

    // ------------------------------------------------------------ partnership board
    createPost: (p: Omit<BoardPost, "id" | "status">) => {
      const id = uid("bp");
      apply((s) => ({ ...s, boardPosts: [{ ...p, id, status: "open" }, ...s.boardPosts] }));
      return id;
    },
    propose: (postId: string, pitch: string) => apply((s) => {
      const post = s.boardPosts.find((p) => p.id === postId)!;
      return { ...s, proposals: [...s.proposals, { id: uid("pr"), postId, fromBusinessId: MY_BUSINESS, toBusinessId: post.businessId, pitch, status: "sent", at: NOW.slice(0, 10) }] };
    }),
    /** Accepting opens a collaboration workspace for both businesses. */
    respond: (proposalId: string, accept: boolean) => {
      const p = stateRef.current.proposals.find((x) => x.id === proposalId)!;
      const post = stateRef.current.boardPosts.find((x) => x.id === p.postId)!;
      const id = uid("c");
      apply((s) => ({
        ...s,
        proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, status: accept ? "accepted" : "declined" } : x)),
        collaborations: accept ? [...s.collaborations, {
          id, title: `${HOSTS[p.fromBusinessId].name} at ${HOSTS[MY_BUSINESS].name}`, aId: MY_BUSINESS, bId: p.fromBusinessId, eventDate: "", city: post.city, status: "planning",
          tasks: [
            { id: uid("t"), text: "Agree on a date", owner: "both", done: false },
            { id: uid("t"), text: "Agree on the guest list size", owner: "a", done: false },
            { id: uid("t"), text: "Write the event description and sensory details", owner: "b", done: false },
          ],
          messages: [{ id: uid("m"), from: p.fromBusinessId, text: p.pitch, at: NOW }], assets: [], approvals: { a: false, b: false }, experienceId: null,
        }] : s.collaborations,
      }));
      return accept ? id : null;
    },
    invite: (hostId: string) => apply((s) => ({ ...s, invitesSent: [...new Set([...s.invitesSent, hostId])] })),
    updateCollab: (id: string, fn: (c: Collaboration) => Collaboration) => apply((s) => ({ ...s, collaborations: s.collaborations.map((c) => (c.id === id ? fn(c) : c)) })),
    addTask: (id: string, text: string, owner: CollaborationTask["owner"]) => apply((s) => ({
      ...s, collaborations: s.collaborations.map((c) => (c.id === id ? { ...c, tasks: [...c.tasks, { id: uid("t"), text, owner, done: false }] } : c)),
    })),
    /** Creates a draft co-hosted listing. Both partners approve before it goes live. */
    publishCollab: (id: string) => {
      const c = stateRef.current.collaborations.find((x) => x.id === id)!;
      const eid = uid("exp");
      const date = c.eventDate || "2026-12-10";
      const draft: Experience = {
        id: eid, hostId: c.aId, coHostId: c.bId, title: c.title, category: "brand", accessType: "rsvp_guaranteed",
        description: `${HOSTS[c.aId].name} and ${HOSTS[c.bId].name} host an evening together: a sampling bar by the entrance and consultations in the back room.`,
        includes: "Drinks, a sampling bar, consultations, a gift bag", cancellationTerms: "Let the hosts know if you can't come",
        price: null, currency: "USD", capacity: 80, placesLeft: 80, startsAt: `${date}T18:00:00-05:00`, endsAt: `${date}T21:00:00-05:00`, timezone: "America/New_York",
        address: "212 Wythe Ave, Brooklyn, NY 11249", area: "Williamsburg", city: "New York", country: "United States", x: 64, y: 40, status: "draft",
        sensory: { energy: "Lively", setting: "Indoor", fragrance: "Light", music: "Medium", groupSize: "80 people", smallGroup: false, touch: "Consultations only" },
        treatment: { treatmentType: "consultation", practitionerName: "Dana Ruiz, RN", licenseNumber: "NY-RN-641208", licenseRegion: "New York, US", disclosure: "Complimentary consultations with licensed nurse injectors. No treatments are performed at this event.", licenseVerifiedAt: "2026-10-01T16:40:00Z", verifiedBy: ADMIN.name },
        palette: "dusk", products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Clay cleansing balm", price: "$34", palette: "rose" }], articles: [], roomMembers: 0,
      };
      apply((s) => ({
        ...s, experiences: [...s.experiences, draft],
        collaborations: s.collaborations.map((x) => (x.id === id ? { ...x, status: "awaiting_approval", experienceId: eid, approvals: { a: false, b: false } } : x)),
      }));
      return eid;
    },
    approveCollab: (id: string, side: "a" | "b") => apply((s) => {
      const c = s.collaborations.find((x) => x.id === id)!;
      const approvals = { ...c.approvals, [side]: true };
      const live = approvals.a && approvals.b;
      let next: TravelState = {
        ...s,
        collaborations: s.collaborations.map((x) => (x.id === id ? { ...x, approvals, status: live ? "live" : x.status } : x)),
        experiences: live ? s.experiences.map((e) => (e.id === c.experienceId ? { ...e, status: "published" } : e)) : s.experiences,
      };
      if (live) next = alertFollowers(next, next.experiences.find((e) => e.id === c.experienceId)!);
      return next;
    }),
    rateCollab: (id: string, stars: number, comment: string) => apply((s) => ({ ...s, collaborations: s.collaborations.map((c) => (c.id === id ? { ...c, rating: { stars, comment } } : c)) })),

    // ------------------------------------------------------------ admin
    /** experience_treatments.license_verified_at + verified_by */
    verifyLicense: (experienceId: string) => apply((s) => {
      let next: TravelState = {
        ...s, experiences: s.experiences.map((e) => (e.id === experienceId && e.treatment
          ? { ...e, status: "published", treatment: { ...e.treatment, licenseVerifiedAt: NOW, verifiedBy: ADMIN.name } } : e)),
      };
      next = alertFollowers(next, next.experiences.find((e) => e.id === experienceId)!);
      return next;
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
