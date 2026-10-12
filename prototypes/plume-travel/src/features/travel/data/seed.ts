// Demo content for the UI preview. Matches the reference file. Every host, guest,
// number and article here is sample data for showing Plume Travel to early hosts.
import type {
  BoardPost, BoardProposal, Booking, Collaboration, Experience, Follow, Itinerary, Notification, RoomPost, TravelHost, TreatmentRule,
} from "../types";

export const CITIES = ["New York", "Paris", "Lisbon", "Tulum"] as const;
export const CITY_ZONES: Record<string, string> = {
  "New York": "America/New_York", Paris: "Europe/Paris", Lisbon: "Europe/Lisbon", Tulum: "America/Cancun",
};

export const HOSTS: Record<string, TravelHost> = {
  "maison-lune": { id: "maison-lune", businessId: "b-maison-lune", name: "Maison Lune", hostType: "Beauty brand", city: "Paris", verified: true, travelPlan: "launch_free", palette: "rose", bio: "A Paris skincare brand that started on a kitchen table and now runs a café every summer.", pastCollaborations: 4, partnerRating: 4.9, ratingCount: 7 },
  "atelier-verre": { id: "atelier-verre", businessId: "b-atelier-verre", name: "Atelier Verre", hostType: "Fragrance house", city: "Paris", verified: true, travelPlan: "launch_free", palette: "amber", bio: "Independent perfumers in Saint-Germain. Small workshops, real raw materials.", pastCollaborations: 2, partnerRating: 4.8, ratingCount: 3 },
  "bains-opale": { id: "bains-opale", businessId: "b-bains-opale", name: "Les Bains Opale", hostType: "Spa", city: "Paris", verified: true, travelPlan: "launch_free", palette: "sea", bio: "A hammam and spa in the 9th arrondissement.", pastCollaborations: 1, partnerRating: 5, ratingCount: 1 },
  "skin-theory": { id: "skin-theory", businessId: "b-skin-theory", name: "Skin Theory Studio", hostType: "Esthetician studio", city: "New York", verified: true, travelPlan: "launch_free", palette: "lilac", bio: "A SoHo studio of licensed estheticians who teach as much as they treat.", pastCollaborations: 3, partnerRating: 4.7, ratingCount: 4 },
  lumen: { id: "lumen", businessId: "b-lumen", name: "Lumen Aesthetics", hostType: "Med spa", city: "New York", verified: true, travelPlan: "launch_free", palette: "dusk", bio: "A Williamsburg med spa with a licensed clinical team and a front room made for launches.", pastCollaborations: 2, partnerRating: 4.9, ratingCount: 2 },
  plume: { id: "plume", businessId: "b-plume", name: "Plume", hostType: "Plume", city: "New York", verified: true, travelPlan: "launch_free", palette: "peach", bio: "Plume's own gatherings for its founding community.", pastCollaborations: 0, partnerRating: null, ratingCount: 0 },
  "sal-pedra": { id: "sal-pedra", businessId: "b-sal-pedra", name: "Sal & Pedra", hostType: "Bathhouse", city: "Lisbon", verified: true, travelPlan: "launch_free", palette: "mint", bio: "Three pools and a salt room under the Alfama.", pastCollaborations: 1, partnerRating: 4.6, ratingCount: 2 },
  "casa-sal": { id: "casa-sal", businessId: "b-casa-sal", name: "Casa Sal", hostType: "Resort", city: "Tulum", verified: true, travelPlan: "launch_free", palette: "sea", bio: "A twenty-room resort built around skin, sound and slow mornings.", pastCollaborations: 2, partnerRating: 4.8, ratingCount: 2 },
  "rosa-clay": { id: "rosa-clay", businessId: "b-rosa-clay", name: "Rosa Clay", hostType: "Beauty brand", city: "New York", verified: true, travelPlan: "launch_free", palette: "peach", bio: "Clay-based skincare and colour, made in small batches in Brooklyn.", pastCollaborations: 5, partnerRating: 4.9, ratingCount: 6 },
  "still-water": { id: "still-water", businessId: "b-still-water", name: "Still Water Retreats", hostType: "Retreat organizer", city: "Sintra", verified: true, travelPlan: "launch_free", palette: "mint", bio: "Small retreats in the hills above Lisbon.", pastCollaborations: 1, partnerRating: 4.5, ratingCount: 1 },
};

/** The demo accounts behind the preview switcher. */
export const ME = { id: "u-amara", name: "Amara Okafor", city: "New York" };
export const MY_BUSINESS = "lumen"; // the host account in the preview
export const ADMIN = { id: "admin-kalea", name: "Kalea (Plume)" };

export const EXPERIENCES: Experience[] = [
  {
    id: "e1", hostId: "maison-lune", coHostId: null, title: "Maison Lune pop-up café", category: "brand", accessType: "rsvp_guaranteed",
    description: "Three days of pink oat lattes, a sampling bar for the whole range, and the autumn launch a season early. Pick an entry time so the café never gets crowded.",
    includes: "A pink oat latte, the sampling bar, and a take-home mini", cancellationTerms: "Release your slot up to 2 hours before",
    price: null, currency: "EUR", capacity: 300, placesLeft: 38,
    startsAt: "2027-06-14T10:00:00+02:00", endsAt: "2027-06-16T18:00:00+02:00", timezone: "Europe/Paris",
    address: "14 Rue de Bretagne, 75003 Paris", area: "Le Marais", city: "Paris", country: "France", x: 58, y: 44, status: "published",
    slots: [
      { id: "e1s1", startsAt: "2027-06-14T10:00:00+02:00", capacity: 50, booked: 50 },
      { id: "e1s2", startsAt: "2027-06-14T14:00:00+02:00", capacity: 50, booked: 44 },
      { id: "e1s3", startsAt: "2027-06-15T10:00:00+02:00", capacity: 50, booked: 39 },
      { id: "e1s4", startsAt: "2027-06-15T14:00:00+02:00", capacity: 50, booked: 47 },
      { id: "e1s5", startsAt: "2027-06-16T10:00:00+02:00", capacity: 50, booked: 41 },
      { id: "e1s6", startsAt: "2027-06-16T14:00:00+02:00", capacity: 50, booked: 41 },
    ],
    plusOneAllowed: true,
    sensory: { energy: "Lively", setting: "Indoor", fragrance: "Light", music: "Medium", musicNote: "Upbeat", groupSize: "Drop-in crowd, about 50 at a time", smallGroup: false, touch: "None" },
    accuracy: { yes: 195, total: 214 }, palette: "rose", featured: true,
    products: [{ name: "Peptide lip tint", price: "€24", palette: "rose" }, { name: "Barrier cream", price: "€38", palette: "lilac" }, { name: "Glazing mist", price: "€29", palette: "sea" }],
    articles: ["How Maison Lune went from a kitchen table to a cult following"], roomMembers: 126,
  },
  {
    id: "e2", hostId: "atelier-verre", coHostId: null, title: "Blend your own perfume", category: "beauty", accessType: "paid",
    description: "Sit at the organ with a perfumer, smell forty raw materials, and leave with a 15 ml bottle of your own blend and its formula.",
    includes: "A guided session with a perfumer and a 15 ml bottle of your blend", cancellationTerms: "Full refund up to 48 hours before",
    price: 65, currency: "EUR", capacity: 12, placesLeft: 4,
    startsAt: "2027-06-13T15:00:00+02:00", endsAt: "2027-06-13T17:00:00+02:00", timezone: "Europe/Paris",
    address: "9 Rue Jacob, 75006 Paris", area: "Saint-Germain", city: "Paris", country: "France", x: 40, y: 60, status: "published",
    sensory: { energy: "Quiet", setting: "Indoor", fragrance: "Strong", fragranceNote: "It's a perfume workshop", music: "None", groupSize: "12 people", smallGroup: true, touch: "None" },
    accuracy: { yes: 85, total: 88 }, palette: "amber",
    products: [{ name: "Fig leaf extrait", price: "€120", palette: "mint" }, { name: "Iris discovery set", price: "€32", palette: "lilac" }, { name: "Travel atomiser", price: "€18", palette: "amber" }],
    articles: ["A perfumer explains how to find your signature scent"], roomMembers: 9,
  },
  {
    id: "e3", hostId: "bains-opale", coHostId: null, title: "Hammam morning", category: "escape", accessType: "paid",
    description: "A slow morning in the hammam with a black soap ritual and mint tea in the courtyard.",
    includes: "Hammam access, a black soap ritual, mint tea", cancellationTerms: "Full refund up to 24 hours before",
    price: 55, currency: "EUR", capacity: 24, placesLeft: 11,
    startsAt: "2027-06-15T09:00:00+02:00", endsAt: "2027-06-15T12:00:00+02:00", timezone: "Europe/Paris",
    address: "18 Rue Milton, 75009 Paris", area: "9th arrondissement", city: "Paris", country: "France", x: 50, y: 26, status: "published",
    sensory: { energy: "Quiet", setting: "Indoor, warm and steamy", fragrance: "Light", fragranceNote: "Eucalyptus", music: "Soft", groupSize: "Up to 24", smallGroup: false, touch: "Optional", touchNote: "Scrub is an add-on" },
    accuracy: { yes: 123, total: 140 }, palette: "sea",
    products: [{ name: "Black soap", price: "€16", palette: "amber" }, { name: "Kessa mitt", price: "€12", palette: "sea" }],
    articles: ["The ritual behind a proper hammam"], roomMembers: 14,
  },
  {
    id: "e9", hostId: "maison-lune", coHostId: null, title: "Founder breakfast", category: "brand", accessType: "apply",
    description: "Breakfast at the long table with Maison Lune's founder and a first look at the autumn launch. Sixteen seats, chosen from applications.",
    includes: "Breakfast with the founder and a first look at the autumn launch", cancellationTerms: "Let the host know if you can't come",
    price: null, currency: "EUR", capacity: 16, placesLeft: 5,
    startsAt: "2027-06-15T09:30:00+02:00", endsAt: "2027-06-15T11:00:00+02:00", timezone: "Europe/Paris",
    address: "14 Rue de Bretagne, 75003 Paris", area: "Le Marais", city: "Paris", country: "France", x: 62, y: 48, status: "published",
    sensory: { energy: "Social", setting: "Indoor", fragrance: "Light", music: "None", groupSize: "16 people", smallGroup: true, touch: "None" },
    palette: "lilac",
    products: [{ name: "Peptide lip tint", price: "€24", palette: "rose" }, { name: "Glazing mist", price: "€29", palette: "sea" }],
    articles: ["How Maison Lune went from a kitchen table to a cult following"], roomMembers: 16,
  },
  {
    id: "e7", hostId: "sal-pedra", coHostId: null, title: "Bathhouse afternoon", category: "escape", accessType: "paid",
    description: "Three pools at different temperatures, a salt room and herbal tea, in an old cistern under the Alfama. Book a two-hour entry.",
    includes: "Three pools, the salt room, herbal tea", cancellationTerms: "Full refund up to 24 hours before",
    price: 42, currency: "EUR", capacity: 30, placesLeft: 12, recurring: "daily",
    startsAt: "2026-10-12T13:00:00+01:00", endsAt: "2026-10-12T19:00:00+01:00", timezone: "Europe/Lisbon",
    address: "Rua de São Miguel 21, 1100-544 Lisboa", area: "Alfama", city: "Lisbon", country: "Portugal", x: 50, y: 50, status: "published",
    slots: [
      { id: "e7s1", startsAt: "2026-10-12T13:00:00+01:00", capacity: 10, booked: 6 },
      { id: "e7s2", startsAt: "2026-10-12T15:00:00+01:00", capacity: 10, booked: 9 },
      { id: "e7s3", startsAt: "2026-10-12T17:00:00+01:00", capacity: 10, booked: 3 },
    ],
    sensory: { energy: "Quiet", setting: "Indoor, warm water", fragrance: "Light", fragranceNote: "Herbal", music: "None", groupSize: "Up to 10 per entry", smallGroup: true, touch: "Optional", touchNote: "Massage is an add-on" },
    accuracy: { yes: 271, total: 301 }, palette: "mint", featured: true,
    products: [{ name: "Salt scrub", price: "€22", palette: "mint" }, { name: "Body oil", price: "€34", palette: "amber" }],
    articles: ["Why Lisbon is having a bathhouse moment"], roomMembers: 18,
  },
  {
    id: "e8", hostId: "casa-sal", coHostId: null, title: "Skin and sound retreat", category: "retreat", accessType: "apply",
    description: "Four nights by the cenotes with two facials, daily sound baths and slow breakfasts. Twenty guests, chosen from applications.",
    includes: "4 nights, 2 facials, daily sound baths, all meals", cancellationTerms: "50% refund up to 30 days before",
    price: 1450, priceFrom: true, currency: "USD", capacity: 20, placesLeft: 7,
    startsAt: "2026-11-06T15:00:00-05:00", endsAt: "2026-11-10T11:00:00-05:00", timezone: "America/Cancun",
    address: "Carretera Tulum-Boca Paila km 8, Tulum, Quintana Roo", area: "Tulum beach road", city: "Tulum", country: "Mexico", x: 50, y: 50, status: "published",
    sensory: { energy: "Reflective", setting: "Indoor and outdoor", fragrance: "Light", fragranceNote: "Copal and natural oils", music: "Medium", musicNote: "Live sound baths", groupSize: "20 guests", smallGroup: true, touch: "Part of the experience", touchNote: "Facials and massage" },
    treatment: { treatmentType: "facial", practitionerName: "Inés Varela", licenseNumber: "COS-55120", licenseRegion: "Quintana Roo, Mexico", disclosure: "Two facials performed by a licensed esthetician. No medical or injectable treatments are included.", licenseVerifiedAt: "2026-09-02T14:12:00Z", verifiedBy: "Kalea (Plume)" },
    accuracy: { yes: 35, total: 37 }, palette: "sea", featured: true,
    products: [{ name: "Cenote clay mask", price: "$38", palette: "sea" }, { name: "Aloe gel", price: "$22", palette: "mint" }],
    articles: ["Inside a retreat built around skin"], roomMembers: 12,
  },
  {
    id: "e4", hostId: "skin-theory", coHostId: null, title: "Glass skin masterclass", category: "beauty", accessType: "rsvp_interest",
    description: "A live demo of layering without pilling, with skin analysis on request and a take-home kit.",
    includes: "Live demo, a skin analysis on request, a sample kit", cancellationTerms: "Cancel any time",
    price: null, currency: "USD", capacity: 30, placesLeft: 6,
    startsAt: "2026-10-17T14:00:00-04:00", endsAt: "2026-10-17T15:30:00-04:00", timezone: "America/New_York",
    address: "112 Greene St, New York, NY 10012", area: "SoHo", city: "New York", country: "United States", x: 46, y: 56, status: "published",
    sensory: { energy: "Social", setting: "Indoor", fragrance: "Light", music: "Soft", groupSize: "30 people", smallGroup: false, touch: "Optional", touchNote: "Skin analysis on request" },
    accuracy: { yes: 57, total: 61 }, palette: "lilac",
    products: [{ name: "Rice toner", price: "$28", palette: "lilac" }, { name: "Ceramide serum", price: "$46", palette: "sea" }, { name: "SPF 50 fluid", price: "$32", palette: "amber" }],
    articles: ["Layering without pilling: an esthetician's order of operations"], roomMembers: 22,
  },
  {
    id: "e11", hostId: "rosa-clay", coHostId: null, title: "The clay cart in Washington Square", category: "brand", accessType: "walkin",
    description: "Rosa Clay's sampling cart parks by the arch for the weekend. Try the clay balms and get a colour match.",
    includes: "Sampling, a colour match, a mini to take home while they last", cancellationTerms: "Nothing to cancel",
    price: null, currency: "USD", capacity: 600, placesLeft: 600,
    startsAt: "2026-10-17T11:00:00-04:00", endsAt: "2026-10-18T17:00:00-04:00", timezone: "America/New_York",
    address: "Washington Square Park, by the arch, New York, NY", area: "Greenwich Village", city: "New York", country: "United States", x: 40, y: 46, status: "published",
    sensory: { energy: "Lively", setting: "Outdoor", fragrance: "Light", music: "Soft", groupSize: "Open crowd", smallGroup: false, touch: "Optional", touchNote: "Colour match on your hand or cheek" },
    accuracy: { yes: 6, total: 7 }, palette: "peach",
    products: [{ name: "Clay cleansing balm", price: "$34", palette: "rose" }, { name: "Soft focus blush", price: "$26", palette: "peach" }],
    articles: ["Meet the Brooklyn brand making clay feel new"], roomMembers: 40,
  },
  {
    id: "e5", hostId: "lumen", coHostId: null, title: "Lumen launch night", category: "brand", accessType: "invite",
    description: "The launch of Lumen's recovery line, with drinks, a DJ and consultations with the clinical team in the back room.",
    includes: "Drinks, consultations with the clinical team, a gift bag", cancellationTerms: "Let the host know if you can't come",
    price: null, currency: "USD", capacity: 80, placesLeft: 20,
    startsAt: "2026-10-22T19:00:00-04:00", endsAt: "2026-10-22T22:00:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", area: "Williamsburg", city: "New York", country: "United States", x: 64, y: 40, status: "published",
    sensory: { energy: "Lively", setting: "Indoor", fragrance: "None", music: "Loud", musicNote: "DJ", groupSize: "80 people", smallGroup: false, touch: "Consultations only" },
    treatment: { treatmentType: "consultation", practitionerName: "Dana Ruiz, RN", licenseNumber: "NY-RN-641208", licenseRegion: "New York, US", disclosure: "Complimentary consultations with licensed nurse injectors. No injectables or treatments are performed at this event.", licenseVerifiedAt: "2026-10-01T16:40:00Z", verifiedBy: "Kalea (Plume)" },
    accuracy: { yes: 5, total: 6 }, palette: "dusk",
    products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Mineral SPF", price: "$36", palette: "amber" }],
    articles: ["What to ask before your first consultation"], roomMembers: 41,
  },
  {
    id: "e10", hostId: "lumen", coHostId: null, title: "Skin recovery workshop", category: "beauty", accessType: "paid",
    description: "An hour with Lumen's estheticians on barrier repair after summer, with a hands-on routine session. No treatments are performed.",
    includes: "The workshop, a recovery kit, a follow-up routine card", cancellationTerms: "Full refund up to 48 hours before",
    price: 35, currency: "USD", capacity: 24, placesLeft: 0,
    startsAt: "2026-10-28T18:30:00-04:00", endsAt: "2026-10-28T19:30:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", area: "Williamsburg", city: "New York", country: "United States", x: 66, y: 42, status: "published",
    sensory: { energy: "Quiet", setting: "Indoor", fragrance: "None", music: "Soft", groupSize: "24 people", smallGroup: false, touch: "None" },
    palette: "dusk",
    products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Barrier serum", price: "$48", palette: "lilac" }],
    articles: ["Your skin after summer, explained"], roomMembers: 19,
  },
  {
    id: "e6", hostId: "plume", coHostId: null, title: "Founding 50 meetup", category: "brand", accessType: "rsvp_guaranteed",
    description: "Brunch with Plume's founding community, product testing with three of our brands, and a preview of what's coming.",
    includes: "Brunch, product testing, a preview of what's coming", cancellationTerms: "Cancel any time",
    price: null, currency: "USD", capacity: 40, placesLeft: 17, plusOneAllowed: true,
    startsAt: "2026-10-25T11:00:00-04:00", endsAt: "2026-10-25T13:00:00-04:00", timezone: "America/New_York",
    address: "41 Bank St, New York, NY 10014", area: "West Village", city: "New York", country: "United States", x: 38, y: 50, status: "published",
    sensory: { energy: "Social", setting: "Indoor", fragrance: "Light", music: "Soft", groupSize: "40 people", smallGroup: false, touch: "None" },
    palette: "peach", products: [], articles: ["Meet the Founding 50"], roomMembers: 33,
  },
  // ---------------------------------------------------------------- ended events (recaps)
  {
    id: "p1", hostId: "rosa-clay", coHostId: null, title: "Soft Hour pop-up", category: "brand", accessType: "walkin",
    description: "Rosa Clay's first pop-up: a pink-lit shop on Crosby Street with a clay bar and colour matching.",
    includes: "Sampling, colour match, a mini", cancellationTerms: "Nothing to cancel",
    price: null, currency: "USD", capacity: 1500, placesLeft: 0,
    startsAt: "2026-09-26T11:00:00-04:00", endsAt: "2026-09-28T19:00:00-04:00", timezone: "America/New_York",
    address: "63 Crosby St, New York, NY 10012", area: "SoHo", city: "New York", country: "United States", x: 48, y: 58, status: "ended",
    sensory: { energy: "Lively", setting: "Indoor", fragrance: "Light", music: "Medium", groupSize: "Open crowd", smallGroup: false, touch: "Optional", touchNote: "Colour match" },
    accuracy: { yes: 140, total: 158 }, palette: "peach",
    products: [{ name: "Clay cleansing balm", price: "$34", palette: "rose" }, { name: "Soft focus blush", price: "$26", palette: "peach" }, { name: "Lip oil", price: "$22", palette: "amber" }],
    articles: ["Meet the Brooklyn brand making clay feel new"], roomMembers: 310,
    recap: { attendance: 1240, photos: ["peach", "rose", "amber", "lilac"], quote: "The colour match alone was worth the queue." },
  },
  {
    id: "p2", hostId: "lumen", coHostId: "rosa-clay", title: "Clay and glow evening", category: "brand", accessType: "rsvp_guaranteed",
    description: "Lumen and Rosa Clay's co-hosted evening: a sampling bar by the entrance and consultations in the back room.",
    includes: "Drinks, a sampling bar, consultations, a gift bag", cancellationTerms: "Let the host know if you can't come",
    price: null, currency: "USD", capacity: 700, placesLeft: 0,
    startsAt: "2026-09-17T18:00:00-04:00", endsAt: "2026-09-17T21:30:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", area: "Williamsburg", city: "New York", country: "United States", x: 64, y: 40, status: "ended",
    sensory: { energy: "Lively", setting: "Indoor", fragrance: "Light", music: "Medium", groupSize: "Up to 700 across the evening", smallGroup: false, touch: "Consultations only" },
    accuracy: { yes: 88, total: 97 }, palette: "dusk",
    products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Clay cleansing balm", price: "$34", palette: "rose" }],
    articles: ["What to ask before your first consultation"], roomMembers: 260,
    recap: { attendance: 412, photos: ["dusk", "rose", "lilac", "peach"] },
  },
  {
    id: "p3", hostId: "atelier-verre", coHostId: null, title: "Summer scent garden", category: "beauty", accessType: "walkin",
    description: "Atelier Verre's courtyard of fig, tomato leaf and neroli, open for one week in August.",
    includes: "The garden, a blotter wall, a scent consultation", cancellationTerms: "Nothing to cancel",
    price: null, currency: "EUR", capacity: 500, placesLeft: 0,
    startsAt: "2026-08-24T11:00:00+02:00", endsAt: "2026-08-30T19:00:00+02:00", timezone: "Europe/Paris",
    address: "9 Rue Jacob, 75006 Paris", area: "Saint-Germain", city: "Paris", country: "France", x: 40, y: 60, status: "ended",
    sensory: { energy: "Quiet", setting: "Outdoor", fragrance: "Strong", music: "None", groupSize: "Open crowd", smallGroup: false, touch: "None" },
    accuracy: { yes: 61, total: 66 }, palette: "amber",
    products: [{ name: "Fig leaf extrait", price: "€120", palette: "mint" }, { name: "Neroli water", price: "€58", palette: "amber" }, { name: "Iris discovery set", price: "€32", palette: "lilac" }],
    articles: ["A perfumer explains how to find your signature scent"], roomMembers: 88,
    recap: { attendance: 380, photos: ["amber", "mint", "lilac", "rose"], quote: "Like walking through the inside of a perfume." },
  },
  // ---------------------------------------------------------------- awaiting license verification
  {
    id: "x1", hostId: "skin-theory", coHostId: null, title: "Barrier repair facial class", category: "beauty", accessType: "paid",
    description: "A small class where one guest at a time receives a barrier repair facial while the others learn the steps.",
    includes: "The class, one facial per guest, a take-home kit", cancellationTerms: "Full refund up to 48 hours before",
    price: 85, currency: "USD", capacity: 8, placesLeft: 8,
    startsAt: "2026-11-07T11:00:00-05:00", endsAt: "2026-11-07T14:00:00-05:00", timezone: "America/New_York",
    address: "112 Greene St, New York, NY 10012", area: "SoHo", city: "New York", country: "United States", x: 46, y: 56, status: "pending_verification",
    sensory: { energy: "Quiet", setting: "Indoor", fragrance: "Light", music: "Soft", groupSize: "8 people", smallGroup: true, touch: "Part of the experience", touchNote: "A facial for each guest" },
    treatment: { treatmentType: "facial", practitionerName: "Mina Cho, LE", licenseNumber: "LE-104882", licenseRegion: "New York, US", disclosure: "Each guest receives a barrier repair facial from a licensed esthetician. No peels, lasers or injectables.", licenseVerifiedAt: null, verifiedBy: null },
    palette: "lilac", products: [{ name: "Ceramide serum", price: "$46", palette: "sea" }], articles: [], roomMembers: 0,
  },
];

export const TREATMENT_RULES: TreatmentRule[] = [
  { treatmentType: "consultation", label: "Consultations", allowedAtEvents: true, allowedAsTicket: true },
  { treatmentType: "facial", label: "Facials by a licensed esthetician", allowedAtEvents: true, allowedAsTicket: true },
  { treatmentType: "massage", label: "Massage by a licensed therapist", allowedAtEvents: true, allowedAsTicket: true },
  { treatmentType: "chemical_peel", label: "Chemical peels", allowedAtEvents: false, allowedAsTicket: false },
  { treatmentType: "laser", label: "Laser and energy devices", allowedAtEvents: false, allowedAsTicket: false },
  { treatmentType: "injectable", label: "Injectables", allowedAtEvents: false, allowedAsTicket: false },
  { treatmentType: "prescription", label: "Prescription treatments", allowedAtEvents: false, allowedAsTicket: false },
];

// ---------------------------------------------------------------- the beauty lover's own data
export const SEED_BOOKINGS: Booking[] = [
  { id: "bk1", experienceId: "e1", slotId: "e1s2", userId: ME.id, guestName: ME.name, status: "booked", plusOne: false, shareOutcomesConsent: false, stripePaymentIntent: null, amountPaid: null, code: "PT-7Q4K-LUNE", createdAt: "2026-10-02" },
  { id: "bk2", experienceId: "p1", slotId: null, userId: ME.id, guestName: ME.name, status: "checked_in", plusOne: false, shareOutcomesConsent: true, stripePaymentIntent: null, amountPaid: null, code: "PT-2M8C-ROSA", createdAt: "2026-09-20" },
];

export const SEED_ITINERARIES: Itinerary[] = [
  { id: "it-paris", name: "My Paris weekend", city: "Paris", from: "2027-06-12", to: "2027-06-18", shareToken: null,
    items: [{ experienceId: "e2", status: "saved" }, { experienceId: "e1", status: "booked" }, { experienceId: "e3", status: "saved" }] },
  { id: "it-ny", name: "New York in October", city: "New York", from: "2026-10-17", to: "2026-10-25", shareToken: null,
    items: [{ experienceId: "e4", status: "saved" }, { experienceId: "e6", status: "saved" }] },
];

export const SEED_FOLLOWS: Follow[] = [
  { id: "f1", targetType: "city", target: "Paris", alertsEmail: true, alertsInApp: true },
  { id: "f2", targetType: "host", target: "skin-theory", alertsEmail: false, alertsInApp: true },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: "n1", kind: "new_experience", text: "New in Paris: Founder breakfast with Maison Lune", detail: "Because you follow Paris. Applications are open.", to: { experienceId: "e9" }, at: "2026-10-11T09:10:00Z", read: false },
  { id: "n2", kind: "host_update", text: "Skin Theory Studio posted an update in the Glass skin masterclass room", detail: "\"We're bringing extra sample kits.\"", to: { experienceId: "e4" }, at: "2026-10-10T17:30:00Z", read: false },
  { id: "n3", kind: "new_experience", text: "Atelier Verre has 4 places left for Blend your own perfume", detail: "It's saved in My Paris weekend.", to: { experienceId: "e2" }, at: "2026-10-08T12:00:00Z", read: true },
];

export const SEED_ROOM_POSTS: RoomPost[] = [
  { id: "r1", experienceId: "e1", kind: "update", author: "Maison Lune", fromHost: true, text: "We've added a second entry time each afternoon, so the 14:00 slots have more room. The café is step-free through the courtyard door.", at: "2026-10-09T10:00:00Z" },
  { id: "r2", experienceId: "e1", kind: "question", author: "Léa M.", fromHost: false, text: "Can I bring a friend who hasn't booked?", at: "2026-10-09T13:20:00Z" },
  { id: "r3", experienceId: "e1", kind: "answer", author: "Maison Lune", fromHost: true, text: "Yes, if you add a plus one to your booking. Each slot is capped so the café stays comfortable.", at: "2026-10-09T15:02:00Z" },
  { id: "r4", experienceId: "e1", kind: "intro", author: "Sofia R.", fromHost: false, text: "Visiting from Lisbon and going alone on the Monday afternoon. Happy to share a table.", at: "2026-10-10T08:45:00Z" },
  { id: "r5", experienceId: "p1", kind: "update", author: "Rosa Clay", fromHost: true, text: "Thank you, New York. 1,240 of you came through in three days. The clay balm is back in stock.", at: "2026-09-29T12:00:00Z" },
  { id: "r6", experienceId: "p1", kind: "photo", author: "Rosa Clay", fromHost: true, text: "The clay bar on Saturday afternoon", at: "2026-09-29T12:05:00Z", palette: "peach" },
  { id: "r7", experienceId: "p1", kind: "photo", author: "Priya S.", fromHost: false, text: "My colour match card", at: "2026-09-29T18:40:00Z", palette: "rose" },
  { id: "r8", experienceId: "e4", kind: "update", author: "Skin Theory Studio", fromHost: true, text: "We're bringing extra sample kits. Seats are confirmed 48 hours before, by email.", at: "2026-10-10T17:30:00Z" },
];

export const SAMPLE_ATTENDEES: Record<string, { name: string; status: "guaranteed" | "plus_one" | "waitlist" | "paid"; position?: number; code: string }[]> = {
  e10: [
    { name: "Léa Martin", status: "paid", code: "PT-91AA" }, { name: "Jordan Kim", status: "paid", code: "PT-91AB" }, { name: "Priya Shah", status: "paid", code: "PT-91AC" },
    { name: "Hana Sato", status: "paid", code: "PT-91AD" }, { name: "Grace Bello", status: "paid", code: "PT-91AE" }, { name: "Marisol Diaz", status: "plus_one", code: "PT-91AF" },
    { name: "Chloe Park", status: "paid", code: "PT-91AG" }, { name: "Ines Duarte", status: "paid", code: "PT-91AH" },
    { name: "Sofia Reyes", status: "waitlist", position: 1, code: "PT-91W1" }, { name: "Naomi Fox", status: "waitlist", position: 2, code: "PT-91W2" },
  ],
  e5: [
    { name: "Amara Okafor", status: "guaranteed", code: "PT-51AA" }, { name: "Léa Martin", status: "guaranteed", code: "PT-51AB" }, { name: "Jordan Kim", status: "plus_one", code: "PT-51AC" },
    { name: "Priya Shah", status: "guaranteed", code: "PT-51AD" }, { name: "Sofia Reyes", status: "waitlist", position: 1, code: "PT-51W1" },
  ],
};

// ---------------------------------------------------------------- partnership board
export const BOARD_POSTS: BoardPost[] = [
  { id: "b1", businessId: "casa-sal", kind: "seeking", title: "A skincare brand for a spa weekend", city: "Tulum", timing: "November", month: "2026-11", audienceSize: "40 guests", weBring: "Rooms, spa treatment rooms, our guest list", weNeed: "Product for facials and in-room amenities", dealType: "Revenue share", category: "retreat", visibility: "everyone", status: "open", palette: "sea" },
  { id: "b2", businessId: "atelier-verre", kind: "seeking", title: "A quiet venue for three perfume workshops", city: "Lisbon", timing: "February", month: "2027-02", audienceSize: "12 per session", weBring: "A perfumer, all materials, an audience of 18k", weNeed: "A calm room with natural light", dealType: "Flat fee", category: "beauty", visibility: "everyone", status: "open", palette: "amber" },
  { id: "b4", businessId: "still-water", kind: "seeking", title: "A licensed facialist for a five-day retreat", city: "Sintra", timing: "March", month: "2027-03", audienceSize: "16 guests", weBring: "Travel, lodging, a full-day schedule", weNeed: "A licensed facialist for daily treatments", dealType: "Flat fee", category: "retreat", visibility: "everyone", status: "open", palette: "mint" },
  { id: "b6", businessId: "maison-lune", kind: "seeking", title: "A New York host for our first US café", city: "New York", timing: "April", month: "2027-04", audienceSize: "About 900 over three days", weBring: "The café concept, product, staff and press", weNeed: "A street-level space and a local co-host", dealType: "Co-host", category: "brand", visibility: "invited", invited: ["lumen", "skin-theory"], status: "open", palette: "rose" },
  { id: "b3", businessId: "lumen", kind: "offering", title: "Our Williamsburg space for brand launch evenings", city: "New York", timing: "Weekday evenings", month: "2026-11", audienceSize: "Up to 80", weBring: "Space, a licensed clinical team, 2,400 clients", weNeed: "Brands focused on skin health", dealType: "Co-host", category: "brand", visibility: "everyone", status: "open", palette: "dusk" },
  { id: "b5", businessId: "rosa-clay", kind: "offering", title: "Product for gift bags and sampling bars", city: "Any city", timing: "Year-round", month: "any", audienceSize: "Up to 500 units", weBring: "Full-size and mini products, display materials", weNeed: "Events with a skin-curious audience", dealType: "Product exchange", category: "brand", visibility: "everyone", status: "open", palette: "peach" },
];

export const SEED_PROPOSALS: BoardProposal[] = [
  { id: "pr1", postId: "b3", fromBusinessId: "skin-theory", toBusinessId: "lumen", pitch: "We'd love to run a glass skin evening in your space: our estheticians teach in the front room while your clinical team runs consultations in the back. We'd bring our class audience of about 3,000 New Yorkers.", status: "sent", at: "2026-10-10" },
  { id: "pr2", postId: "b4", fromBusinessId: "lumen", toBusinessId: "still-water", pitch: "Our licensed esthetician Dana could lead daily facials for your Sintra retreat, with products from our recovery line.", status: "sent", at: "2026-10-06" },
];

export const SIGNALFLOW_MATCHES: { hostId: string; overlap: number }[] = [
  { hostId: "maison-lune", overlap: 64 },
  { hostId: "skin-theory", overlap: 58 },
  { hostId: "rosa-clay", overlap: 51 },
];

export const SEED_COLLABORATIONS: Collaboration[] = [
  {
    id: "c1", title: "Clay and glow, winter edition", aId: "lumen", bId: "rosa-clay", eventDate: "2026-12-10", city: "New York", status: "planning",
    tasks: [
      { id: "t1", text: "Confirm the date: Thu, Dec 10", owner: "both", done: true },
      { id: "t2", text: "Agree on the guest list size", owner: "a", done: true },
      { id: "t3", text: "Send product for 80 gift bags", owner: "b", done: false },
      { id: "t4", text: "Share brand assets", owner: "b", done: true },
      { id: "t5", text: "Write the event description and sensory details", owner: "a", done: false },
    ],
    messages: [
      { id: "m1", from: "rosa-clay", text: "We'd love to do this again. Could we host the sampling bar by the entrance like last time?", at: "2026-10-07T15:00:00Z" },
      { id: "m2", from: "lumen", text: "Yes, the front room works. 80 guests, consultations in the back.", at: "2026-10-07T15:20:00Z" },
      { id: "m3", from: "rosa-clay", text: "Perfect. Product ships Monday.", at: "2026-10-08T09:02:00Z" },
    ],
    assets: [{ id: "as1", name: "rosa-clay-brand-kit.pdf", size: "4.2 MB", by: "rosa-clay" }, { id: "as2", name: "lumen-floorplan.png", size: "880 KB", by: "lumen" }],
    approvals: { a: false, b: false }, experienceId: null,
  },
  {
    id: "c0", title: "Clay and glow evening", aId: "lumen", bId: "rosa-clay", eventDate: "2026-09-17", city: "New York", status: "ended",
    tasks: [], messages: [], assets: [], approvals: { a: true, b: true }, experienceId: "p2", rating: null,
  },
];

export const RESULTS: Record<string, {
  rsvps: number; attended: number; sales: number; currency: "USD" | "EUR"; treatments: number; consented: number;
  funnel: [string, number][]; samples: [string, number][]; locals: number; visitors: number; origins: [string, number][]; suggestion: string;
}> = {
  p2: {
    rsvps: 640, attended: 412, sales: 6240, currency: "USD", treatments: 31, consented: 298,
    funnel: [["Viewed the listing", 4812], ["RSVP'd or booked", 640], ["Attended", 412], ["Saved a product within 30 days", 188], ["Bought within 30 days", 96], ["Booked a treatment within 30 days", 31]],
    samples: [["Recovery balm", 34], ["Clay cleansing balm", 27], ["Mineral SPF", 19], ["Soft focus blush", 11]],
    locals: 79, visitors: 21, origins: [["Brooklyn", 48], ["Manhattan", 31], ["London", 8], ["Paris", 6], ["Other", 7]],
    suggestion: "Attendees visiting from London and Paris saved three times as many products as locals. A co-hosted evening in Paris with Maison Lune, whose audience overlaps with yours by 64%, is worth testing.",
  },
};
