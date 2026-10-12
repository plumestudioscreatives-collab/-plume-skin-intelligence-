import type { AccessType, Category, Experience, TreatmentType } from "../types";
import type { Feel } from "../state/store";
import { priceLabel } from "./format";

export const CATEGORY_LABEL: Record<Category, string> = {
  brand: "Brand events", beauty: "Beauty experiences", escape: "Day escapes", retreat: "Retreats and stays",
};
export const CATEGORY_ONE: Record<Category, string> = {
  brand: "Brand event", beauty: "Beauty experience", escape: "Day escape", retreat: "Retreat or stay",
};

export const ACCESS: Record<AccessType, { label: string; explain: string; short: string }> = {
  walkin: { label: "Free walk-in", short: "Free walk-in", explain: "Just show up during opening hours. Entry is first come, first served." },
  rsvp_guaranteed: { label: "Free RSVP", short: "Free RSVP", explain: "Your RSVP guarantees entry for the time you choose." },
  rsvp_interest: { label: "Free RSVP, interest only", short: "Free RSVP", explain: "An RSVP registers your interest. The host confirms places by email 48 hours before." },
  paid: { label: "Paid ticket", short: "Paid ticket", explain: "Your ticket guarantees entry for the time you book." },
  apply: { label: "Apply to attend", short: "Apply to attend", explain: "The host reviews applications and confirms places by email." },
  invite: { label: "Invitation only", short: "Invitation only", explain: "Entry needs an invitation from the host. You can ask for one." },
};

export const ACCESS_OPTIONS: { value: AccessType; label: string }[] = [
  { value: "rsvp_guaranteed", label: "Free RSVP that guarantees entry" },
  { value: "rsvp_interest", label: "Free RSVP that registers interest" },
  { value: "walkin", label: "Free walk-in" },
  { value: "paid", label: "Paid ticket" },
  { value: "apply", label: "Apply to attend" },
  { value: "invite", label: "Invitation only" },
];

export function ctaLabel(e: Experience, full: boolean) {
  if (full) return "Join the waitlist";
  switch (e.accessType) {
    case "walkin": return "Plan to go";
    case "rsvp_guaranteed": case "rsvp_interest": return "RSVP";
    case "paid": return `Book for ${priceLabel({ ...e, priceFrom: false })}`;
    case "apply": return "Apply to attend";
    case "invite": return "Request an invitation";
  }
}

export const FEELS: { value: Feel; label: string }[] = [
  { value: "quiet", label: "Quiet" }, { value: "lively", label: "Lively" }, { value: "nofrag", label: "Fragrance-free" },
  { value: "small", label: "Small group" }, { value: "notouch", label: "No touch treatments" },
];

export function matchesFeel(e: Experience, f: Feel) {
  const s = e.sensory;
  if (f === "quiet") return s.energy === "Quiet" || s.energy === "Reflective";
  if (f === "lively") return s.energy === "Lively";
  if (f === "nofrag") return s.fragrance === "None";
  if (f === "small") return s.smallGroup;
  return s.touch === "None" || s.touch === "Consultations only";
}

export const TREATMENT_LABEL: Record<TreatmentType, string> = {
  consultation: "Consultation", facial: "Facial", massage: "Massage", chemical_peel: "Chemical peel", laser: "Laser or energy device", injectable: "Injectable", prescription: "Prescription treatment",
};
