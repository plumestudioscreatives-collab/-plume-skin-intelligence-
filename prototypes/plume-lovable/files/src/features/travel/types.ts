// Plume Travel domain types. Field names mirror the proposed Supabase tables
// (camelCase here, snake_case in SQL) so the mock data can be swapped for queries later.

export type Category = "brand" | "beauty" | "escape" | "retreat";

export type AccessType =
  | "walkin" // free walk-in
  | "rsvp_guaranteed" // free RSVP that guarantees entry
  | "rsvp_interest" // free RSVP that registers interest
  | "paid" // paid ticket
  | "apply" // apply to attend
  | "invite"; // invitation only

export type ExperienceStatus = "draft" | "pending_verification" | "published" | "live" | "ended" | "cancelled";

/** Atmosphere. Reflective scores like Quiet in Sensory Match. */
export type Energy = "Quiet" | "Social" | "Reflective" | "Lively";
export type Fragrance = "None" | "Light" | "Strong";
export type GroupSize = "Small" | "Medium" | "Large";
export type Touch = "None" | "Optional" | "Part of the experience" | "Consultations only";

/** Host-provided. null or "" means the host hasn't provided it: shown as "Not provided", never assumed. */
export interface Sensory {
  energy: Energy | null; // the primary atmosphere
  fragrance: Fragrance | null;
  fragranceNote?: string;
  group: GroupSize | null;
  groupNote?: string;
  touch: Touch | null;
  touchNote?: string;
  setting: string; // indoor/outdoor, free text
  music: string; // sound, free text
}

/** experience_sensory scores and sensory_profiles use the same 0–2 scales. */
export interface SensoryProfile { energy: 0 | 1 | 2; fragrance: 0 | 1 | 2; group: 0 | 1 | 2; touch: 0 | 1 | 2 }

export interface Slot { id: string; startsAt: string; capacity: number; booked: number }

export type TreatmentType = "consultation" | "facial" | "massage" | "chemical_peel" | "laser" | "injectable" | "prescription";

export interface Treatment {
  treatmentType: TreatmentType;
  practitionerName: string;
  licenseNumber: string;
  licenseRegion: string;
  disclosure: string;
  licenseVerifiedAt: string | null;
  verifiedBy: string | null;
}

export interface TreatmentRule { treatmentType: TreatmentType; label: string; allowedAtEvents: boolean; allowedAsTicket: boolean }

export type Palette = "peach" | "rose" | "sea" | "amber" | "lilac" | "mint" | "dusk";

export interface Product { name: string; price: string; palette: Palette }

export interface Recap {
  attendance: number;
  photos: Palette[];
  quotes: { text: string; by: string }[];
}

export interface Experience {
  id: string;
  hostId: string;
  coHostId: string | null;
  title: string;
  category: Category;
  accessType: AccessType;
  description: string;
  includes: string;
  cancellationTerms: string;
  price: number | null;
  priceFrom?: boolean;
  currency: "EUR" | "USD" | "GBP" | "KRW";
  capacity: number;
  placesLeft: number;
  startsAt: string; // ISO with offset; for multi-day events the first day's opening
  endsAt: string; // last day's closing
  recurring?: "daily";
  timezone: string;
  address: string;
  neighborhood: string;
  city: string;
  country: string;
  x: number; // position on the stylized trip map, 0–100
  y: number;
  status: ExperienceStatus;
  slots?: Slot[];
  plusOneAllowed?: boolean;
  triedIt?: boolean;
  sensory: Sensory;
  treatment?: Treatment;
  accuracy?: { yes: number; total: number };
  palette: Palette;
  featured?: boolean;
  products: Product[];
  articles: string[];
  roomMembers: number;
  recap?: Recap;
  /** Draft fields not yet confirmed by the hosts (collaboration drafts start with only what was agreed). */
  unconfirmed?: ("time" | "admission" | "address")[];
}

export type HostType = "Beauty brand" | "Fragrance house" | "Spa" | "Esthetician studio" | "Med spa" | "Bathhouse" | "Resort" | "Retreat organizer" | "Venue" | "Plume";

export interface TravelHost {
  id: string;
  businessId: string;
  name: string;
  hostType: HostType;
  city: string;
  verified: boolean;
  travelPlan: "launch_free" | "paid";
  palette: Palette;
  bio: string;
  pastCollaborations: number;
  partnerRating: number | null;
  ratingCount: number;
}

export type BookingStatus = "booked" | "waitlisted" | "applied" | "invited" | "cancelled" | "checked_in";

export interface Booking {
  id: string;
  experienceId: string;
  slotId: string | null;
  userId: string;
  guestName: string;
  status: BookingStatus;
  plusOne: boolean;
  shareOutcomesConsent: boolean;
  stripePaymentIntent: string | null;
  amountPaid: number | null;
  waitlistPosition?: number;
  note?: string;
  code: string;
  createdAt: string;
  checkedInAt?: string;
}

export interface WaitlistOffer {
  bookingId: string;
  offeredAt: string;
  expiresAt: string;
  slotLabel?: string;
  /** Happening Now holds are short (minutes) and count down live in the preview. */
  holdMinutes?: number;
  startedAtMs?: number;
}

export interface TripItem { experienceId: string; status: "saved" | "booked" }
export interface Trip { id: string; name: string; city: string; from: string; to: string; items: TripItem[]; shareToken: string | null }

export interface Follow {
  id: string;
  targetType: "city" | "area" | "country" | "continent" | "host";
  target: string; // place name or host id
  city?: string; // "tell me next time in [city]"
  alertsEmail: boolean;
  alertsInApp: boolean;
}

export interface SavedSearch { id: string; place: string; label: string; from: string; to: string; timeOfDay: TimeOfDay; alerts: boolean }

export interface Notification {
  id: string;
  text: string;
  detail?: string;
  to?: { experienceId?: string };
  at: string;
  read: boolean;
  kind: "new_experience" | "waitlist_offer" | "host_update" | "board" | "live" | "bring_back";
}

export interface RoomPreference { showInAttendeeList: boolean; wantsToMeet: boolean }

export interface RoomPost {
  id: string;
  experienceId: string;
  kind: "update" | "question" | "intro" | "photo" | "answer";
  author: string;
  fromHost: boolean;
  text: string;
  at: string;
  palette?: Palette;
}

/** tried_products: a Tried It tap saved to the Passport. */
export interface TriedProduct { id: string; experienceId: string; product: string; reaction: "loved" | "not_for_me"; note: string; at: string }

/** experience_attendance: powers Passport stamps. */
export interface Attendance { experienceId: string; checkedInAt: string; sharedWithHost: boolean }

export interface BringItBack { experienceId: string; counts: Record<string, number>; mine: string | null }

export type DealType = "Paid fee" | "Product exchange" | "Revenue share" | "Co-funded" | "Co-host" | "Other";

/** board_posts: a private brief on the Partnership Board. Never a public experience. */
export interface BoardPost {
  id: string;
  businessId: string;
  kind: "seeking" | "offering";
  title: string;
  partnerType: string; // who they want: "Skincare brand", "Venue"...
  city: string;
  startDate: string; // experience dates
  endDate: string;
  deadline: string; // applications close
  audienceSize: string;
  story: string; // what they're creating
  weBring: string; // the poster's full contribution
  weNeed: string; // what the partner would contribute
  requirements: string; // partner requirements
  deliverables: string[];
  dealType: DealType;
  terms: string; // budget and currency, exchange value, or proposed terms
  category: Category;
  visibility: "everyone" | "invited";
  invited?: string[];
  status: "draft" | "open" | "closed";
  palette: Palette;
  postedAt: string;
  closedAt?: string;
  postedByAdmin?: boolean;
}

export type ProposalStatus = "new" | "shortlisted" | "accepted" | "declined" | "withdrawn";

/** board_proposals: an application to a brief. Its outcome is separate from the brief's open/closed status. */
export interface BoardProposal {
  id: string;
  postId: string;
  fromBusinessId: string;
  toBusinessId: string;
  person: string; // name and role
  pitch: string; // what they'd contribute
  availability: string;
  terms: string; // proposed commercial terms
  portfolio?: string;
  status: ProposalStatus;
  reviewed?: boolean;
  decisionReason?: string;
  decidedAt?: string;
  archived?: boolean;
  /** The explicit agreement step. Each business confirms independently. */
  agreement?: { scope: string; terms: string; poster: boolean; applicant: boolean };
  collaborationId?: string;
  at: string;
}

export interface CollaborationTask { id: string; text: string; owner: "both" | "a" | "b"; done: boolean }
export interface CollaborationMessage { id: string; from: string; text: string; at: string }
export interface CollaborationAsset { id: string; name: string; size: string; by: string }

export interface Collaboration {
  id: string;
  title: string;
  aId: string;
  bId: string;
  postId: string | null;
  proposalId: string | null;
  scope: string; // agreed scope
  terms: string; // agreed commercial terms
  eventDate: string;
  city: string;
  status: "planning" | "awaiting_approval" | "live" | "ended";
  tasks: CollaborationTask[];
  messages: CollaborationMessage[];
  assets: CollaborationAsset[];
  /** Both hosts approve the event draft before publication (a separate action). */
  approvals: { a: boolean; b: boolean };
  experienceId: string | null;
  rating?: { stars: number; comment: string } | null;
}

export type TimeOfDay = "any" | "morning" | "afternoon" | "evening";

export type Role = "lover" | "host" | "admin";
