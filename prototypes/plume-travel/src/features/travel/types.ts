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

export type ExperienceStatus = "draft" | "pending_verification" | "published" | "ended" | "cancelled";

export type Energy = "Quiet" | "Social" | "Lively" | "Reflective";
export type Touch = "None" | "Optional" | "Part of the experience" | "Consultations only";

export interface Sensory {
  energy: Energy;
  setting: string; // indoor, outdoor, both, warm water…
  fragrance: "None" | "Light" | "Medium" | "Strong";
  fragranceNote?: string;
  music: "None" | "Soft" | "Medium" | "Loud";
  musicNote?: string;
  groupSize: string;
  smallGroup: boolean;
  touch: Touch;
  touchNote?: string;
}

export interface Slot {
  id: string;
  startsAt: string; // ISO with offset
  capacity: number;
  booked: number;
}

export type TreatmentType =
  | "consultation"
  | "facial"
  | "massage"
  | "chemical_peel"
  | "laser"
  | "injectable"
  | "prescription";

export interface Treatment {
  treatmentType: TreatmentType;
  practitionerName: string;
  licenseNumber: string;
  licenseRegion: string;
  disclosure: string;
  licenseVerifiedAt: string | null;
  verifiedBy: string | null;
}

export interface TreatmentRule {
  treatmentType: TreatmentType;
  label: string;
  allowedAtEvents: boolean;
  allowedAsTicket: boolean;
}

export interface Product {
  name: string;
  price: string;
  palette: Palette;
}

export interface Recap {
  attendance: number;
  photos: Palette[];
  quote?: string;
}

export type Palette = "peach" | "rose" | "sea" | "amber" | "lilac" | "mint" | "dusk";

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
  price: number | null; // null = free
  priceFrom?: boolean;
  currency: "EUR" | "USD";
  capacity: number;
  placesLeft: number;
  startsAt: string;
  endsAt: string;
  recurring?: "daily";
  timezone: string; // IANA zone
  address: string;
  area: string;
  city: string;
  country: string;
  x: number; // position on the stylized itinerary map, 0–100
  y: number;
  status: ExperienceStatus;
  slots?: Slot[];
  plusOneAllowed?: boolean;
  sensory: Sensory;
  treatment?: Treatment;
  accuracy?: { yes: number; total: number };
  palette: Palette;
  featured?: boolean;
  products: Product[];
  articles: string[];
  roomMembers: number;
  recap?: Recap;
}

export type HostType =
  | "Beauty brand"
  | "Fragrance house"
  | "Spa"
  | "Esthetician studio"
  | "Med spa"
  | "Bathhouse"
  | "Resort"
  | "Retreat organizer"
  | "Venue"
  | "Plume";

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
}

export interface WaitlistOffer {
  bookingId: string;
  offeredAt: string;
  expiresAt: string;
}

export interface ItineraryItem {
  experienceId: string;
  status: "saved" | "booked";
}

export interface Itinerary {
  id: string;
  name: string;
  city: string;
  from: string; // yyyy-mm-dd
  to: string;
  items: ItineraryItem[];
  shareToken: string | null;
}

export interface Follow {
  id: string;
  targetType: "city" | "host";
  target: string; // city name or host id
  city?: string; // for "tell me next time in [city]"
  alertsEmail: boolean;
  alertsInApp: boolean;
}

export interface Notification {
  id: string;
  text: string;
  detail?: string;
  to?: { experienceId?: string; page?: "itinerary" | "board" | "following" };
  at: string;
  read: boolean;
  kind: "new_experience" | "waitlist_offer" | "host_update" | "board" | "proposal";
}

export interface RoomPreference {
  showInAttendeeList: boolean;
  wantsToMeet: boolean;
}

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

export type DealType = "Co-host" | "Product exchange" | "Flat fee" | "Revenue share" | "Open to discussion";

export interface BoardPost {
  id: string;
  businessId: string;
  kind: "seeking" | "offering";
  title: string;
  city: string;
  timing: string;
  month: string;
  audienceSize: string;
  weBring: string;
  weNeed: string;
  dealType: DealType;
  category: Category;
  visibility: "everyone" | "invited";
  invited?: string[];
  status: "open" | "closed";
  palette: Palette;
  postedByAdmin?: boolean;
}

export interface BoardProposal {
  id: string;
  postId: string;
  fromBusinessId: string;
  toBusinessId: string;
  pitch: string;
  status: "sent" | "accepted" | "declined";
  at: string;
}

export interface CollaborationTask {
  id: string;
  text: string;
  owner: "both" | "a" | "b";
  done: boolean;
}

export interface CollaborationMessage {
  id: string;
  from: string; // business id
  text: string;
  at: string;
}

export interface CollaborationAsset {
  id: string;
  name: string;
  size: string;
  by: string;
}

export interface Collaboration {
  id: string;
  title: string;
  aId: string; // business a (the viewer in the preview)
  bId: string;
  eventDate: string;
  city: string;
  status: "planning" | "awaiting_approval" | "live" | "ended";
  tasks: CollaborationTask[];
  messages: CollaborationMessage[];
  assets: CollaborationAsset[];
  approvals: { a: boolean; b: boolean };
  experienceId: string | null;
  rating?: { stars: number; comment: string } | null;
}

export interface ExperienceAttendance {
  userId: string;
  experienceId: string;
  productsTried: string[];
}

export type Role = "lover" | "host" | "admin";
