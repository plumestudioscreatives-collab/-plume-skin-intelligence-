// Demo content for the UI preview, matching the reference file. Every host, guest, number
// and article is sample data for showing Plume Travel to early hosts.
import type {
  Attendance, BoardPost, BoardProposal, Booking, BringItBack, Collaboration, Experience, Follow, Notification, RoomPost, SavedSearch, SensoryProfile,
  TravelHost, TreatmentRule, TriedProduct, Trip,
} from "../types";

export const ME = { id: "u-amara", name: "Amara Okafor", city: "New York" };
export const MY_BUSINESS = "lumen";
export const ADMIN = { id: "admin-kalea", name: "Kalea (Plume)" };
export const DEFAULT_PROFILE: SensoryProfile = { energy: 1, fragrance: 1, group: 0, touch: 1 };

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
  dalbit: { id: "dalbit", businessId: "b-dalbit", name: "Dalbit Skin", hostType: "Beauty brand", city: "Seoul", verified: true, travelPlan: "launch_free", palette: "lilac", bio: "A Seongsu skincare brand built on rice, barley and very patient layering.", pastCollaborations: 2, partnerRating: 4.8, ratingCount: 2 },
  "linen-skin": { id: "linen-skin", businessId: "b-linen-skin", name: "Linen Skin", hostType: "Beauty brand", city: "New York", verified: false, travelPlan: "launch_free", palette: "mint", bio: "A two-person body care brand from Queens, new to Plume.", pastCollaborations: 0, partnerRating: null, ratingCount: 0 },
  "maison-aube": { id: "maison-aube", businessId: "b-maison-aube", name: "Maison Aube Retreats", hostType: "Resort", city: "Lisbon", verified: true, travelPlan: "launch_free", palette: "sea", bio: "A twelve-room retreat house outside Lisbon, built for slow weekends.", pastCollaborations: 3, partnerRating: 4.8, ratingCount: 3 },
  "hollis-vane": { id: "hollis-vane", businessId: "b-hollis-vane", name: "Hollis & Vane", hostType: "Fragrance house", city: "London", verified: true, travelPlan: "launch_free", palette: "amber", bio: "A Mayfair perfumery making small-batch scents from British botanicals.", pastCollaborations: 1, partnerRating: 4.7, ratingCount: 1 },
};

const base = { coHostId: null, articles: [] as string[] };

export const EXPERIENCES: Experience[] = [
  // ---------------------------------------------------------------- happening now (Mon Oct 12, 15:00 in New York)
  {
    ...base, id: "e12", hostId: "lumen", title: "Recovery lounge open house", category: "beauty", accessType: "rsvp_guaranteed",
    description: "Lumen's front room becomes a recovery lounge for the day: a testing bar for the new barrier line, skin consultations on request, and tea. Book an hourly entry so it never gets crowded.",
    includes: "The testing bar, tea, and a recovery mini to take home", cancellationTerms: "Release your entry up to an hour before",
    price: null, currency: "USD", capacity: 84, placesLeft: 10, triedIt: true,
    startsAt: "2026-10-12T12:00:00-04:00", endsAt: "2026-10-12T19:00:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", neighborhood: "Williamsburg", city: "New York", country: "United States", x: 64, y: 40, status: "published",
    slots: ["12", "13", "14", "15", "16", "17", "18"].map((h, i) => ({ id: `e12s${h}`, startsAt: `2026-10-12T${h}:00:00-04:00`, capacity: 12, booked: [12, 12, 11, 12, 12, 9, 6][i] })),
    sensory: { energy: "Quiet", fragrance: "None", group: "Small", groupNote: "Up to 12 an hour", touch: "Optional", touchNote: "Skin consultation on request", setting: "Indoor, a quiet front room", music: "Soft" },
    accuracy: { yes: 40, total: 43 }, palette: "dusk",
    products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Barrier serum", price: "$48", palette: "lilac" }, { name: "Mineral SPF", price: "$36", palette: "amber" }],
    articles: ["Your skin after summer, explained"], roomMembers: 58,
  },
  {
    ...base, id: "e15", hostId: "rosa-clay", title: "Colour match sessions", category: "beauty", accessType: "rsvp_guaranteed",
    description: "Twenty minutes at Rosa Clay's studio table with a colour artist, matching blush and lip to your skin in daylight. Six people per entry.",
    includes: "A colour match, a swatch card and a mini of your shade", cancellationTerms: "Release your entry up to an hour before",
    price: null, currency: "USD", capacity: 36, placesLeft: 4, triedIt: true,
    startsAt: "2026-10-12T13:00:00-04:00", endsAt: "2026-10-12T19:00:00-04:00", timezone: "America/New_York",
    address: "89 Franklin St, Brooklyn, NY 11222", neighborhood: "Greenpoint", city: "New York", country: "United States", x: 60, y: 22, status: "published",
    slots: ["13", "14", "15", "16", "17", "18"].map((h, i) => ({ id: `e15s${h}`, startsAt: `2026-10-12T${h}:00:00-04:00`, capacity: 6, booked: [6, 6, 6, 6, 5, 3][i] })),
    sensory: { energy: "Social", fragrance: "None", group: "Small", groupNote: "Six per entry", touch: "Optional", touchNote: "Swatches on your hand or cheek", setting: "Indoor studio in daylight", music: "Soft" },
    accuracy: { yes: 12, total: 13 }, palette: "peach",
    products: [{ name: "Soft focus blush", price: "$26", palette: "peach" }, { name: "Lip oil", price: "$22", palette: "amber" }],
    articles: ["Meet the Brooklyn brand making clay feel new"], roomMembers: 24,
  },
  // ---------------------------------------------------------------- Paris, June 2027
  {
    ...base, id: "e1", hostId: "maison-lune", title: "Maison Lune pop-up café", category: "brand", accessType: "rsvp_guaranteed",
    description: "Three days of pink oat lattes, a sampling bar for the whole range, and the autumn launch a season early. Pick an entry time so the café never gets crowded.",
    includes: "A pink oat latte, the sampling bar, and a take-home mini", cancellationTerms: "Release your slot up to 2 hours before",
    price: null, currency: "EUR", capacity: 300, placesLeft: 38, plusOneAllowed: true, triedIt: true,
    startsAt: "2027-06-14T10:00:00+02:00", endsAt: "2027-06-16T18:00:00+02:00", timezone: "Europe/Paris",
    address: "14 Rue de Bretagne, 75003 Paris", neighborhood: "Le Marais", city: "Paris", country: "France", x: 58, y: 44, status: "published",
    slots: [
      { id: "e1s1", startsAt: "2027-06-14T10:00:00+02:00", capacity: 50, booked: 50 },
      { id: "e1s2", startsAt: "2027-06-14T14:00:00+02:00", capacity: 50, booked: 44 },
      { id: "e1s3", startsAt: "2027-06-15T10:00:00+02:00", capacity: 50, booked: 39 },
      { id: "e1s4", startsAt: "2027-06-15T14:00:00+02:00", capacity: 50, booked: 47 },
      { id: "e1s5", startsAt: "2027-06-16T10:00:00+02:00", capacity: 50, booked: 41 },
      { id: "e1s6", startsAt: "2027-06-16T14:00:00+02:00", capacity: 50, booked: 41 },
    ],
    sensory: { energy: "Lively", fragrance: "Light", group: "Large", groupNote: "About 50 at a time", touch: "None", setting: "Indoor café", music: "Upbeat, medium volume" },
    accuracy: { yes: 195, total: 214 }, palette: "rose", featured: true,
    products: [{ name: "Peptide lip tint", price: "€24", palette: "rose" }, { name: "Barrier cream", price: "€38", palette: "lilac" }, { name: "Glazing mist", price: "€29", palette: "sea" }],
    articles: ["How Maison Lune went from a kitchen table to a cult following"], roomMembers: 126,
  },
  {
    ...base, id: "e2", hostId: "atelier-verre", title: "Blend your own perfume", category: "beauty", accessType: "paid",
    description: "Sit at the organ with a perfumer, smell forty raw materials, and leave with a 15 ml bottle of your own blend and its formula.",
    includes: "A guided session with a perfumer and a 15 ml bottle of your blend", cancellationTerms: "Full refund up to 48 hours before",
    price: 65, currency: "EUR", capacity: 12, placesLeft: 4,
    startsAt: "2027-06-13T15:00:00+02:00", endsAt: "2027-06-13T17:00:00+02:00", timezone: "Europe/Paris",
    address: "9 Rue Jacob, 75006 Paris", neighborhood: "Saint-Germain", city: "Paris", country: "France", x: 40, y: 60, status: "published",
    sensory: { energy: "Quiet", fragrance: "Strong", fragranceNote: "It's a perfume workshop", group: "Small", groupNote: "12 people", touch: "None", setting: "Indoor studio", music: "None" },
    accuracy: { yes: 85, total: 88 }, palette: "amber",
    products: [{ name: "Fig leaf extrait", price: "€120", palette: "mint" }, { name: "Iris discovery set", price: "€32", palette: "lilac" }, { name: "Travel atomiser", price: "€18", palette: "amber" }],
    articles: ["A perfumer explains how to find your signature scent"], roomMembers: 9,
  },
  {
    ...base, id: "e3", hostId: "bains-opale", title: "Hammam morning", category: "escape", accessType: "paid",
    description: "A slow morning in the hammam with a black soap ritual and mint tea in the courtyard.",
    includes: "Hammam access, a black soap ritual, mint tea", cancellationTerms: "Full refund up to 24 hours before",
    price: 55, currency: "EUR", capacity: 24, placesLeft: 11,
    startsAt: "2027-06-15T09:00:00+02:00", endsAt: "2027-06-15T12:00:00+02:00", timezone: "Europe/Paris",
    address: "18 Rue Milton, 75009 Paris", neighborhood: "9th arrondissement", city: "Paris", country: "France", x: 50, y: 26, status: "published",
    sensory: { energy: "Quiet", fragrance: "Light", fragranceNote: "Eucalyptus", group: "Medium", groupNote: "Up to 24", touch: "Optional", touchNote: "Scrub is an add-on", setting: "Indoor, warm and steamy", music: "Soft" },
    accuracy: { yes: 123, total: 140 }, palette: "sea",
    products: [{ name: "Black soap", price: "€16", palette: "amber" }, { name: "Kessa mitt", price: "€12", palette: "sea" }],
    articles: ["The ritual behind a proper hammam"], roomMembers: 14,
  },
  {
    ...base, id: "e9", hostId: "maison-lune", title: "Founder breakfast", category: "brand", accessType: "apply",
    description: "Breakfast at the long table with Maison Lune's founder and a first look at the autumn launch. Sixteen seats, chosen from applications.",
    includes: "Breakfast with the founder and a first look at the autumn launch", cancellationTerms: "Let the host know if you can't come",
    price: null, currency: "EUR", capacity: 16, placesLeft: 5,
    startsAt: "2027-06-15T09:30:00+02:00", endsAt: "2027-06-15T11:00:00+02:00", timezone: "Europe/Paris",
    address: "14 Rue de Bretagne, 75003 Paris", neighborhood: "Le Marais", city: "Paris", country: "France", x: 62, y: 48, status: "published",
    sensory: { energy: "Social", fragrance: "Light", group: "Small", groupNote: "16 people", touch: "None", setting: "Indoor, one long table", music: "None" },
    palette: "lilac",
    products: [{ name: "Peptide lip tint", price: "€24", palette: "rose" }, { name: "Glazing mist", price: "€29", palette: "sea" }],
    articles: ["How Maison Lune went from a kitchen table to a cult following"], roomMembers: 16,
  },
  // ---------------------------------------------------------------- elsewhere
  {
    ...base, id: "e7", hostId: "sal-pedra", title: "Bathhouse afternoon", category: "escape", accessType: "paid",
    description: "Three pools at different temperatures, a salt room and herbal tea, in an old cistern under the Alfama. Book a two-hour entry.",
    includes: "Three pools, the salt room, herbal tea", cancellationTerms: "Full refund up to 24 hours before",
    price: 42, currency: "EUR", capacity: 30, placesLeft: 12, recurring: "daily",
    startsAt: "2026-10-12T13:00:00+01:00", endsAt: "2026-10-12T19:00:00+01:00", timezone: "Europe/Lisbon",
    address: "Rua de São Miguel 21, 1100-544 Lisboa", neighborhood: "Alfama", city: "Lisbon", country: "Portugal", x: 50, y: 50, status: "published",
    slots: [
      { id: "e7s1", startsAt: "2026-10-12T13:00:00+01:00", capacity: 10, booked: 6 },
      { id: "e7s2", startsAt: "2026-10-12T15:00:00+01:00", capacity: 10, booked: 9 },
      { id: "e7s3", startsAt: "2026-10-12T17:00:00+01:00", capacity: 10, booked: 3 },
    ],
    sensory: { energy: "Quiet", fragrance: "Light", fragranceNote: "Herbal", group: "Small", groupNote: "Up to 10 per entry", touch: "Optional", touchNote: "Massage is an add-on", setting: "Indoor, warm water", music: "None" },
    accuracy: { yes: 271, total: 301 }, palette: "mint", featured: true,
    products: [{ name: "Salt scrub", price: "€22", palette: "mint" }, { name: "Body oil", price: "€34", palette: "amber" }],
    articles: ["Why Lisbon is having a bathhouse moment"], roomMembers: 18,
  },
  {
    ...base, id: "e8", hostId: "casa-sal", title: "Skin and sound retreat", category: "retreat", accessType: "apply",
    description: "Four nights by the cenotes with two facials, daily sound baths and slow breakfasts. Twenty guests, chosen from applications.",
    includes: "4 nights, 2 facials, daily sound baths, all meals", cancellationTerms: "50% refund up to 30 days before",
    price: 1450, priceFrom: true, currency: "USD", capacity: 20, placesLeft: 7,
    startsAt: "2026-11-06T15:00:00-05:00", endsAt: "2026-11-10T11:00:00-05:00", timezone: "America/Cancun",
    address: "Carretera Tulum-Boca Paila km 8, Tulum, Quintana Roo", neighborhood: "Tulum Beach", city: "Tulum", country: "Mexico", x: 50, y: 50, status: "published",
    sensory: { energy: "Reflective", fragrance: "Light", fragranceNote: "Copal and natural oils", group: "Medium", groupNote: "20 guests", touch: "Part of the experience", touchNote: "Facials and massage", setting: "Indoor and outdoor", music: "Live sound baths" },
    treatment: { treatmentType: "facial", practitionerName: "Inés Varela", licenseNumber: "COS-55120", licenseRegion: "Quintana Roo, Mexico", disclosure: "Two facials performed by a licensed esthetician. No medical or injectable treatments are included.", licenseVerifiedAt: "2026-09-02T14:12:00Z", verifiedBy: "Kalea (Plume)" },
    accuracy: { yes: 35, total: 37 }, palette: "sea", featured: true,
    products: [{ name: "Cenote clay mask", price: "$38", palette: "sea" }, { name: "Aloe gel", price: "$22", palette: "mint" }],
    articles: ["Inside a retreat built around skin"], roomMembers: 12,
  },
  {
    ...base, id: "e13", hostId: "dalbit", title: "Glass skin lab pop-up", category: "brand", accessType: "walkin",
    description: "Dalbit's Seongsu warehouse turns into a skin lab for ten days: layering stations, a rice toner bar, and skin readings by the brand's estheticians.",
    includes: "Layering stations, a skin reading, a travel kit while they last", cancellationTerms: "Nothing to cancel",
    price: null, currency: "KRW", capacity: 2000, placesLeft: 2000, triedIt: true,
    startsAt: "2026-10-15T11:00:00+09:00", endsAt: "2026-10-25T20:00:00+09:00", timezone: "Asia/Seoul",
    address: "17 Yeonmujang-gil, Seongdong-gu, Seoul", neighborhood: "Seongsu", city: "Seoul", country: "South Korea", x: 52, y: 46, status: "published",
    sensory: { energy: "Lively", fragrance: "Light", group: "Large", groupNote: "Open crowd", touch: "Optional", touchNote: "Skin reading on request", setting: "Indoor warehouse", music: "Medium" },
    accuracy: { yes: 88, total: 95 }, palette: "lilac",
    products: [{ name: "Rice toner", price: "₩28,000", palette: "lilac" }, { name: "Barley essence", price: "₩34,000", palette: "amber" }],
    articles: ["Seongsu, the neighborhood that runs on pop-ups"], roomMembers: 210,
  },
  {
    ...base, id: "e14", hostId: "hollis-vane", title: "A scent walk through Mayfair", category: "beauty", accessType: "paid",
    description: "A morning walk with a perfumer through Mayfair's old perfumeries and gardens, ending with a blending session at the shop.",
    includes: "The walk, a blending session and a 10 ml bottle", cancellationTerms: "Full refund up to 72 hours before",
    price: 40, currency: "GBP", capacity: 10, placesLeft: 3,
    startsAt: "2026-10-24T10:00:00+01:00", endsAt: "2026-10-24T12:30:00+01:00", timezone: "Europe/London",
    address: "18 Mount Street, London W1K 2RN", neighborhood: "Mayfair", city: "London", country: "United Kingdom", x: 48, y: 50, status: "published",
    sensory: { energy: "Reflective", fragrance: "Strong", group: "Small", groupNote: "10 people", touch: "None", setting: "Outdoor walk, then indoors", music: "None" },
    accuracy: { yes: 21, total: 22 }, palette: "amber",
    products: [{ name: "Mayfair moss", price: "£95", palette: "mint" }, { name: "Discovery set", price: "£28", palette: "amber" }],
    articles: [], roomMembers: 7,
  },
  // ---------------------------------------------------------------- New York, the pilot city
  {
    ...base, id: "e4", hostId: "skin-theory", title: "Glass skin masterclass", category: "beauty", accessType: "rsvp_interest",
    description: "A live demo of layering without pilling, with skin analysis on request and a take-home kit.",
    includes: "Live demo, a skin analysis on request, a sample kit", cancellationTerms: "Cancel any time",
    price: null, currency: "USD", capacity: 30, placesLeft: 6, triedIt: true,
    startsAt: "2026-10-17T14:00:00-04:00", endsAt: "2026-10-17T15:30:00-04:00", timezone: "America/New_York",
    address: "112 Greene St, New York, NY 10012", neighborhood: "SoHo", city: "New York", country: "United States", x: 46, y: 56, status: "published",
    sensory: { energy: "Social", fragrance: "Light", group: "Medium", groupNote: "30 people", touch: "Optional", touchNote: "Skin analysis on request", setting: "Indoor studio", music: "Soft" },
    accuracy: { yes: 57, total: 61 }, palette: "lilac",
    products: [{ name: "Rice toner", price: "$28", palette: "lilac" }, { name: "Ceramide serum", price: "$46", palette: "sea" }, { name: "SPF 50 fluid", price: "$32", palette: "amber" }],
    articles: ["Layering without pilling: an esthetician's order of operations"], roomMembers: 22,
  },
  {
    ...base, id: "e11", hostId: "rosa-clay", title: "The clay cart in Washington Square", category: "brand", accessType: "walkin",
    description: "Rosa Clay's sampling cart parks by the arch for the weekend. Try the clay balms and get a colour match.",
    includes: "Sampling, a colour match, a mini to take home while they last", cancellationTerms: "Nothing to cancel",
    price: null, currency: "USD", capacity: 600, placesLeft: 600, triedIt: true,
    startsAt: "2026-10-17T11:00:00-04:00", endsAt: "2026-10-18T17:00:00-04:00", timezone: "America/New_York",
    address: "Washington Square Park, by the arch, New York, NY", neighborhood: "Greenwich Village", city: "New York", country: "United States", x: 40, y: 46, status: "published",
    sensory: { energy: "Lively", fragrance: "Light", group: "Large", groupNote: "Open crowd", touch: "Optional", touchNote: "Colour match on your hand", setting: "Outdoor", music: "Soft" },
    accuracy: { yes: 6, total: 7 }, palette: "peach",
    products: [{ name: "Clay cleansing balm", price: "$34", palette: "rose" }, { name: "Soft focus blush", price: "$26", palette: "peach" }],
    articles: ["Meet the Brooklyn brand making clay feel new"], roomMembers: 40,
  },
  {
    ...base, id: "e5", hostId: "lumen", title: "Lumen launch night", category: "brand", accessType: "invite",
    description: "The launch of Lumen's recovery line, with drinks, a DJ and consultations with the clinical team in the back room.",
    includes: "Drinks, consultations with the clinical team, a gift bag", cancellationTerms: "Let the host know if you can't come",
    price: null, currency: "USD", capacity: 80, placesLeft: 20,
    startsAt: "2026-10-22T19:00:00-04:00", endsAt: "2026-10-22T22:00:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", neighborhood: "Williamsburg", city: "New York", country: "United States", x: 66, y: 38, status: "published",
    sensory: { energy: "Lively", fragrance: "None", group: "Large", groupNote: "80 people", touch: "Consultations only", setting: "Indoor", music: "DJ, loud" },
    treatment: { treatmentType: "consultation", practitionerName: "Dana Ruiz, RN", licenseNumber: "NY-RN-641208", licenseRegion: "New York, US", disclosure: "Complimentary consultations with licensed nurse injectors. No injectables or treatments are performed at this event.", licenseVerifiedAt: "2026-10-01T16:40:00Z", verifiedBy: "Kalea (Plume)" },
    accuracy: { yes: 5, total: 6 }, palette: "dusk",
    products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Mineral SPF", price: "$36", palette: "amber" }],
    articles: ["What to ask before your first consultation"], roomMembers: 41,
  },
  {
    ...base, id: "e10", hostId: "lumen", title: "Skin recovery workshop", category: "beauty", accessType: "paid",
    description: "An hour with Lumen's estheticians on barrier repair after summer, with a hands-on routine session. No treatments are performed.",
    includes: "The workshop, a recovery kit, a follow-up routine card", cancellationTerms: "Full refund up to 48 hours before",
    price: 35, currency: "USD", capacity: 24, placesLeft: 0, triedIt: true,
    startsAt: "2026-10-28T18:30:00-04:00", endsAt: "2026-10-28T19:30:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", neighborhood: "Williamsburg", city: "New York", country: "United States", x: 62, y: 44, status: "published",
    sensory: { energy: "Quiet", fragrance: "None", group: "Medium", groupNote: "24 people", touch: "None", setting: "Indoor", music: "Soft" },
    palette: "dusk",
    products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Barrier serum", price: "$48", palette: "lilac" }],
    articles: ["Your skin after summer, explained"], roomMembers: 19,
  },
  {
    ...base, id: "e6", hostId: "plume", title: "Founding 50 meetup", category: "brand", accessType: "rsvp_guaranteed",
    description: "Brunch with Plume's founding community, product testing with three of our brands, and a preview of what's coming.",
    includes: "Brunch, product testing, a preview of what's coming", cancellationTerms: "Cancel any time",
    price: null, currency: "USD", capacity: 40, placesLeft: 17, plusOneAllowed: true,
    startsAt: "2026-10-25T11:00:00-04:00", endsAt: "2026-10-25T13:00:00-04:00", timezone: "America/New_York",
    address: "41 Bank St, New York, NY 10014", neighborhood: "West Village", city: "New York", country: "United States", x: 38, y: 50, status: "published",
    sensory: { energy: "Social", fragrance: "Light", group: "Medium", groupNote: "40 people", touch: "None", setting: "Indoor", music: "Soft" },
    palette: "peach", products: [], articles: ["Meet the Founding 50"], roomMembers: 33,
  },
  {
    ...base, id: "d1", hostId: "lumen", title: "Winter recovery breakfast", category: "beauty", accessType: "rsvp_guaranteed",
    description: "A slow breakfast and a short talk on winter skin.", includes: "Breakfast and a talk", cancellationTerms: "Cancel any time",
    price: null, currency: "USD", capacity: 20, placesLeft: 20,
    startsAt: "2026-12-05T09:30:00-05:00", endsAt: "2026-12-05T11:00:00-05:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", neighborhood: "Williamsburg", city: "New York", country: "United States", x: 64, y: 42, status: "draft",
    sensory: { energy: "Quiet", fragrance: "None", group: "Small", touch: "None", setting: "Indoor", music: "None" },
    palette: "lilac", products: [], articles: [], roomMembers: 0,
  },
  {
    ...base, id: "x2", hostId: "lumen", title: "Summer glow breakfast", category: "beauty", accessType: "rsvp_guaranteed",
    description: "A breakfast talk on summer skin. Cancelled when the venue flooded; every guest was told the same day.", includes: "Breakfast and a talk", cancellationTerms: "Cancel any time",
    price: null, currency: "USD", capacity: 30, placesLeft: 30,
    startsAt: "2026-08-08T09:30:00-04:00", endsAt: "2026-08-08T11:00:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", neighborhood: "Williamsburg", city: "New York", country: "United States", x: 64, y: 42, status: "cancelled",
    sensory: { energy: "Quiet", fragrance: "None", group: "Medium", touch: "None", setting: "Indoor", music: "Soft" },
    palette: "amber", products: [], articles: [], roomMembers: 0,
  },
  // ---------------------------------------------------------------- ended: You Missed It and Passport stamps
  {
    ...base, id: "p1", hostId: "rosa-clay", title: "Soft Hour pop-up", category: "brand", accessType: "walkin",
    description: "Rosa Clay's first pop-up: a pink-lit shop on Crosby Street with a clay bar and colour matching.",
    includes: "Sampling, colour match, a mini", cancellationTerms: "Nothing to cancel",
    price: null, currency: "USD", capacity: 1500, placesLeft: 0, triedIt: true,
    startsAt: "2026-09-26T11:00:00-04:00", endsAt: "2026-09-28T19:00:00-04:00", timezone: "America/New_York",
    address: "63 Crosby St, New York, NY 10012", neighborhood: "SoHo", city: "New York", country: "United States", x: 48, y: 58, status: "ended",
    sensory: { energy: "Lively", fragrance: "Light", group: "Large", touch: "Optional", touchNote: "Colour match", setting: "Indoor shop", music: "Medium" },
    accuracy: { yes: 140, total: 158 }, palette: "peach",
    products: [{ name: "Clay cleansing balm", price: "$34", palette: "rose" }, { name: "Soft focus blush", price: "$26", palette: "peach" }, { name: "Lip oil", price: "$22", palette: "amber" }],
    articles: ["Meet the Brooklyn brand making clay feel new"], roomMembers: 310,
    recap: { attendance: 1240, photos: ["peach", "rose", "amber", "lilac"], quotes: [
      { text: "The colour match alone was worth the queue.", by: "Priya S." },
      { text: "I went for the clay balm and left with three things.", by: "Hana T." },
      { text: "Small enough that the team had time to talk to you.", by: "Grace B." },
    ] },
  },
  {
    ...base, id: "p2", hostId: "lumen", coHostId: "rosa-clay", title: "Clay and glow evening", category: "brand", accessType: "rsvp_guaranteed",
    description: "Lumen and Rosa Clay's co-hosted evening: a sampling bar by the entrance and consultations in the back room.",
    includes: "Drinks, a sampling bar, consultations, a gift bag", cancellationTerms: "Let the host know if you can't come",
    price: null, currency: "USD", capacity: 700, placesLeft: 0, triedIt: true,
    startsAt: "2026-09-17T18:00:00-04:00", endsAt: "2026-09-17T21:30:00-04:00", timezone: "America/New_York",
    address: "212 Wythe Ave, Brooklyn, NY 11249", neighborhood: "Williamsburg", city: "New York", country: "United States", x: 64, y: 40, status: "ended",
    sensory: { energy: "Lively", fragrance: "Light", group: "Large", touch: "Consultations only", setting: "Indoor", music: "Medium" },
    accuracy: { yes: 88, total: 97 }, palette: "dusk",
    products: [{ name: "Recovery balm", price: "$42", palette: "dusk" }, { name: "Clay cleansing balm", price: "$34", palette: "rose" }, { name: "Mineral SPF", price: "$36", palette: "amber" }],
    articles: ["What to ask before your first consultation"], roomMembers: 260,
    recap: { attendance: 412, photos: ["dusk", "rose", "lilac", "peach"], quotes: [{ text: "The consultation was the most useful twenty minutes of my month.", by: "Léa M." }, { text: "Loved that nobody pushed a treatment.", by: "Jordan K." }] },
  },
  {
    ...base, id: "p7", hostId: "maison-lune", title: "Winter tea salon", category: "brand", accessType: "rsvp_guaranteed",
    description: "Maison Lune's winter salon: spiced tea, the cold-weather range and a lip tint bar.",
    includes: "Tea, the lip tint bar, a mini", cancellationTerms: "Release your slot up to 2 hours before",
    price: null, currency: "EUR", capacity: 400, placesLeft: 0, triedIt: true,
    startsAt: "2026-02-06T10:00:00+01:00", endsAt: "2026-02-08T18:00:00+01:00", timezone: "Europe/Paris",
    address: "14 Rue de Bretagne, 75003 Paris", neighborhood: "Le Marais", city: "Paris", country: "France", x: 58, y: 44, status: "ended",
    sensory: { energy: "Social", fragrance: "Light", group: "Large", touch: "None", setting: "Indoor salon", music: "Soft" },
    accuracy: { yes: 101, total: 110 }, palette: "rose",
    products: [{ name: "Peptide lip tint", price: "€24", palette: "rose" }, { name: "Barrier cream", price: "€38", palette: "lilac" }],
    articles: [], roomMembers: 190,
    recap: { attendance: 860, photos: ["rose", "lilac", "peach", "amber"], quotes: [{ text: "The lip tint bar was the cosiest thing in Paris that week.", by: "Camille D." }] },
  },
  {
    ...base, id: "p3", hostId: "atelier-verre", title: "Summer scent garden", category: "beauty", accessType: "walkin",
    description: "Atelier Verre's courtyard of fig, tomato leaf and neroli, open for one week in August.",
    includes: "The garden, a blotter wall, a scent consultation", cancellationTerms: "Nothing to cancel",
    price: null, currency: "EUR", capacity: 500, placesLeft: 0, triedIt: true,
    startsAt: "2026-08-24T11:00:00+02:00", endsAt: "2026-08-30T19:00:00+02:00", timezone: "Europe/Paris",
    address: "9 Rue Jacob, 75006 Paris", neighborhood: "Saint-Germain", city: "Paris", country: "France", x: 40, y: 60, status: "ended",
    sensory: { energy: "Quiet", fragrance: "Strong", group: "Medium", touch: "None", setting: "Outdoor courtyard", music: "None" },
    accuracy: { yes: 61, total: 66 }, palette: "amber",
    products: [{ name: "Fig leaf extrait", price: "€120", palette: "mint" }, { name: "Neroli water", price: "€58", palette: "amber" }, { name: "Iris discovery set", price: "€32", palette: "lilac" }],
    articles: [], roomMembers: 88,
    recap: { attendance: 380, photos: ["amber", "mint", "lilac", "rose"], quotes: [{ text: "Like walking through the inside of a perfume.", by: "Sofia R." }] },
  },
  {
    ...base, id: "p4", hostId: "sal-pedra", title: "Midsummer bathhouse night", category: "escape", accessType: "paid",
    description: "The pools by candlelight for one night only, with a salt ritual at midnight.",
    includes: "The pools, a salt ritual, herbal tea", cancellationTerms: "Full refund up to 24 hours before",
    price: 55, currency: "EUR", capacity: 60, placesLeft: 0, triedIt: true,
    startsAt: "2026-06-24T19:00:00+01:00", endsAt: "2026-06-24T23:30:00+01:00", timezone: "Europe/Lisbon",
    address: "Rua de São Miguel 21, 1100-544 Lisboa", neighborhood: "Alfama", city: "Lisbon", country: "Portugal", x: 50, y: 50, status: "ended",
    sensory: { energy: "Reflective", fragrance: "Light", group: "Medium", touch: "Optional", setting: "Indoor, warm water", music: "Soft" },
    accuracy: { yes: 52, total: 55 }, palette: "mint",
    products: [{ name: "Salt scrub", price: "€22", palette: "mint" }, { name: "Body oil", price: "€34", palette: "amber" }],
    articles: [], roomMembers: 60, recap: { attendance: 60, photos: ["mint", "sea", "lilac", "amber"], quotes: [] },
  },
  {
    ...base, id: "p6", hostId: "dalbit", title: "Hanok tea and skin ritual", category: "beauty", accessType: "paid",
    description: "An afternoon in a restored hanok: barley tea, a layering ritual and a skin reading.",
    includes: "Tea, the ritual, a skin reading", cancellationTerms: "Full refund up to 48 hours before",
    price: 45000, currency: "KRW", capacity: 16, placesLeft: 0, triedIt: true,
    startsAt: "2026-05-09T14:00:00+09:00", endsAt: "2026-05-09T16:30:00+09:00", timezone: "Asia/Seoul",
    address: "Bukchon-ro 11-gil, Jongno-gu, Seoul", neighborhood: "Bukchon", city: "Seoul", country: "South Korea", x: 46, y: 40, status: "ended",
    sensory: { energy: "Quiet", fragrance: "Light", group: "Small", touch: "Optional", setting: "Indoor, a hanok", music: "None" },
    accuracy: { yes: 15, total: 16 }, palette: "lilac",
    products: [{ name: "Rice toner", price: "₩28,000", palette: "lilac" }, { name: "Barley essence", price: "₩34,000", palette: "amber" }],
    articles: [], roomMembers: 16, recap: { attendance: 16, photos: ["lilac", "amber", "mint", "rose"], quotes: [] },
  },
  {
    ...base, id: "p5", hostId: "skin-theory", title: "Glass skin masterclass, spring edition", category: "beauty", accessType: "rsvp_guaranteed",
    description: "The spring edition of Skin Theory's layering class.",
    includes: "Live demo and a sample kit", cancellationTerms: "Cancel any time",
    price: null, currency: "USD", capacity: 30, placesLeft: 0, triedIt: true,
    startsAt: "2026-04-18T14:00:00-04:00", endsAt: "2026-04-18T15:30:00-04:00", timezone: "America/New_York",
    address: "112 Greene St, New York, NY 10012", neighborhood: "SoHo", city: "New York", country: "United States", x: 46, y: 56, status: "ended",
    sensory: { energy: "Social", fragrance: "Light", group: "Medium", touch: "Optional", setting: "Indoor studio", music: "Soft" },
    accuracy: { yes: 28, total: 30 }, palette: "sea",
    products: [{ name: "Rice toner", price: "$28", palette: "lilac" }, { name: "Ceramide serum", price: "$46", palette: "sea" }],
    articles: [], roomMembers: 30, recap: { attendance: 30, photos: ["sea", "lilac", "mint", "amber"], quotes: [] },
  },
  // ---------------------------------------------------------------- awaiting license verification
  {
    ...base, id: "x1", hostId: "skin-theory", title: "Barrier repair facial class", category: "beauty", accessType: "paid",
    description: "A small class where one guest at a time receives a barrier repair facial while the others learn the steps.",
    includes: "The class, one facial per guest, a take-home kit", cancellationTerms: "Full refund up to 48 hours before",
    price: 85, currency: "USD", capacity: 8, placesLeft: 8,
    startsAt: "2026-11-07T11:00:00-05:00", endsAt: "2026-11-07T14:00:00-05:00", timezone: "America/New_York",
    address: "112 Greene St, New York, NY 10012", neighborhood: "SoHo", city: "New York", country: "United States", x: 46, y: 56, status: "pending_verification",
    sensory: { energy: "Quiet", fragrance: "Light", group: "Small", touch: "Part of the experience", touchNote: "A facial for each guest", setting: "Indoor", music: "Soft" },
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
  { id: "bk0", experienceId: "e12", slotId: "e12s14", userId: ME.id, guestName: ME.name, status: "checked_in", plusOne: false, shareOutcomesConsent: true, stripePaymentIntent: null, amountPaid: null, code: "PT-4R8M-LUMN", createdAt: "2026-10-09", checkedInAt: "2026-10-12T18:06:00Z" },
  { id: "bk2", experienceId: "e15", slotId: "e15s16", userId: ME.id, guestName: ME.name, status: "waitlisted", plusOne: false, shareOutcomesConsent: false, stripePaymentIntent: null, amountPaid: null, waitlistPosition: 2, code: "PT-9C2L-ROSA", createdAt: "2026-10-11" },
  { id: "bk1", experienceId: "e1", slotId: "e1s2", userId: ME.id, guestName: ME.name, status: "booked", plusOne: false, shareOutcomesConsent: false, stripePaymentIntent: null, amountPaid: null, code: "PT-7Q4K-LUNE", createdAt: "2026-10-02" },
];

export const SEED_ATTENDANCE: Attendance[] = [
  { experienceId: "e12", checkedInAt: "2026-10-12T18:06:00Z", sharedWithHost: true },
  { experienceId: "p3", checkedInAt: "2026-08-27T13:10:00Z", sharedWithHost: true },
  { experienceId: "p4", checkedInAt: "2026-06-24T18:20:00Z", sharedWithHost: false },
  { experienceId: "p6", checkedInAt: "2026-05-09T05:02:00Z", sharedWithHost: true },
  { experienceId: "p5", checkedInAt: "2026-04-18T18:01:00Z", sharedWithHost: false },
];

export const SEED_TRIED: TriedProduct[] = [
  { id: "tp0", experienceId: "e12", product: "Barrier serum", reaction: "loved", note: "Sinks in fast, no shine.", at: "2026-10-12" },
  { id: "tp1", experienceId: "p3", product: "Fig leaf extrait", reaction: "loved", note: "Smells like the garden after rain.", at: "2026-08-27" },
  { id: "tp2", experienceId: "p3", product: "Neroli water", reaction: "not_for_me", note: "Too sharp on my skin.", at: "2026-08-27" },
  { id: "tp3", experienceId: "p3", product: "Iris discovery set", reaction: "loved", note: "", at: "2026-08-27" },
  { id: "tp4", experienceId: "p4", product: "Salt scrub", reaction: "loved", note: "Bought two on the way out.", at: "2026-06-24" },
  { id: "tp5", experienceId: "p6", product: "Rice toner", reaction: "loved", note: "Layers without pilling.", at: "2026-05-09" },
  { id: "tp6", experienceId: "p6", product: "Barley essence", reaction: "loved", note: "", at: "2026-05-09" },
  { id: "tp7", experienceId: "p5", product: "Rice toner", reaction: "loved", note: "", at: "2026-04-18" },
  { id: "tp8", experienceId: "p5", product: "Ceramide serum", reaction: "not_for_me", note: "Pilled under my SPF.", at: "2026-04-18" },
];

export const SEED_BRING_BACK: BringItBack[] = [
  { experienceId: "p1", counts: { Lisbon: 212, London: 188, Paris: 164, "Los Angeles": 140, Miami: 96 }, mine: null },
  { experienceId: "p2", counts: { Paris: 96, London: 74, Miami: 51, "Los Angeles": 38, Toronto: 22 }, mine: null },
  { experienceId: "p7", counts: { London: 140, "New York": 121, Lisbon: 58 }, mine: null },
];

export const SEED_TRIPS: Trip[] = [
  { id: "it-paris", name: "My Paris weekend", city: "Paris", from: "2027-06-12", to: "2027-06-18", shareToken: null,
    items: [{ experienceId: "e2", status: "saved" }, { experienceId: "e1", status: "booked" }, { experienceId: "e3", status: "saved" }] },
  { id: "it-ny", name: "New York in October", city: "New York", from: "2026-10-12", to: "2026-10-25", shareToken: null,
    items: [{ experienceId: "e12", status: "booked" }, { experienceId: "e4", status: "saved" }, { experienceId: "e6", status: "saved" }] },
];

export const SEED_FOLLOWS: Follow[] = [
  { id: "f0", targetType: "city", target: "New York", alertsEmail: false, alertsInApp: true },
  { id: "f1", targetType: "city", target: "Paris", alertsEmail: true, alertsInApp: true },
  { id: "f2", targetType: "host", target: "skin-theory", alertsEmail: false, alertsInApp: true },
];

export const SEED_SAVED_SEARCHES: SavedSearch[] = [
  { id: "ss1", place: "Seoul", label: "Seoul", from: "2026-10-20", to: "2026-10-25", timeOfDay: "any", alerts: true },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: "n0", kind: "live", text: "Recovery lounge open house is happening now", detail: "You're checked in. Tap the products you try to save them to your Passport.", to: { experienceId: "e12" }, at: "2026-10-12T18:07:00Z", read: false },
  { id: "n1", kind: "new_experience", text: "New in Paris: Founder breakfast with Maison Lune", detail: "Because you follow Paris. Applications are open.", to: { experienceId: "e9" }, at: "2026-10-11T09:10:00Z", read: false },
  { id: "n2", kind: "host_update", text: "Skin Theory Studio posted an update in the Glass skin masterclass room", detail: "\"We're bringing extra sample kits.\"", to: { experienceId: "e4" }, at: "2026-10-10T17:30:00Z", read: true },
];

export const SEED_ROOM_POSTS: RoomPost[] = [
  { id: "r1", experienceId: "e1", kind: "update", author: "Maison Lune", fromHost: true, text: "We've added a second entry time each afternoon, so the 14:00 slots have more room. The café is step-free through the courtyard door.", at: "2026-10-09T10:00:00Z" },
  { id: "r2", experienceId: "e1", kind: "question", author: "Léa M.", fromHost: false, text: "Can I bring a friend who hasn't booked?", at: "2026-10-09T13:20:00Z" },
  { id: "r3", experienceId: "e1", kind: "answer", author: "Maison Lune", fromHost: true, text: "Yes, if you add a plus one to your booking. Each slot is capped so the café stays comfortable.", at: "2026-10-09T15:02:00Z" },
  { id: "r4", experienceId: "e1", kind: "intro", author: "Sofia R.", fromHost: false, text: "Visiting from Lisbon and going alone on the Monday afternoon. Happy to share a table.", at: "2026-10-10T08:45:00Z" },
  { id: "r9", experienceId: "e12", kind: "update", author: "Lumen Aesthetics", fromHost: true, text: "We're open. The 16:00 entry is full; join the waitlist on the listing and we'll hold any place that opens for 10 minutes.", at: "2026-10-12T16:02:00Z" },
  { id: "r10", experienceId: "e12", kind: "question", author: "Hana T.", fromHost: false, text: "Is the testing bar fragrance-free?", at: "2026-10-12T16:40:00Z" },
  { id: "r11", experienceId: "e12", kind: "answer", author: "Lumen Aesthetics", fromHost: true, text: "Yes, every product on the bar is unscented.", at: "2026-10-12T16:52:00Z" },
  { id: "r5", experienceId: "p1", kind: "update", author: "Rosa Clay", fromHost: true, text: "Thank you, New York. 1,240 of you came through in three days. The clay balm is back in stock.", at: "2026-09-29T12:00:00Z" },
  { id: "r6", experienceId: "p1", kind: "photo", author: "Rosa Clay", fromHost: true, text: "The clay bar on Saturday afternoon", at: "2026-09-29T12:05:00Z", palette: "peach" },
  { id: "r8", experienceId: "e4", kind: "update", author: "Skin Theory Studio", fromHost: true, text: "We're bringing extra sample kits. Seats are confirmed 48 hours before, by email.", at: "2026-10-10T17:30:00Z" },
  { id: "r12", experienceId: "p3", kind: "photo", author: "Atelier Verre", fromHost: true, text: "The fig tree on the last afternoon", at: "2026-08-31T09:00:00Z", palette: "amber" },
];

/** Rooms the beauty lover chose to join, and how many posts she'd seen when she last opened each. */
export const SEED_ROOMS_JOINED = ["e12", "e1", "e4", "p3"];
export const SEED_ROOM_SEEN: Record<string, number> = { e12: 1, e1: 4, e4: 0, p3: 1 };

export type AttendeeRow = { name: string; status: "guaranteed" | "plus_one" | "waitlist" | "paid"; position?: number; code: string; slot?: string };
export const SAMPLE_ATTENDEES: Record<string, AttendeeRow[]> = {
  e12: [
    { name: "Léa Martin", status: "guaranteed", code: "PT-12AA", slot: "e12s12" }, { name: "Jordan Kim", status: "guaranteed", code: "PT-12AB", slot: "e12s13" },
    { name: "Priya Shah", status: "guaranteed", code: "PT-12AC", slot: "e12s14" }, { name: "Hana Sato", status: "guaranteed", code: "PT-12AD", slot: "e12s15" },
    { name: "Grace Bello", status: "plus_one", code: "PT-12AE", slot: "e12s15" }, { name: "Chloe Park", status: "guaranteed", code: "PT-12AF", slot: "e12s16" },
    { name: "Ines Duarte", status: "guaranteed", code: "PT-12AG", slot: "e12s17" },
    { name: "Sofia Reyes", status: "waitlist", position: 1, code: "PT-12W1", slot: "e12s16" }, { name: "Naomi Fox", status: "waitlist", position: 2, code: "PT-12W2", slot: "e12s16" },
  ],
  e10: [
    { name: "Léa Martin", status: "paid", code: "PT-91AA" }, { name: "Jordan Kim", status: "paid", code: "PT-91AB" }, { name: "Priya Shah", status: "paid", code: "PT-91AC" },
    { name: "Hana Sato", status: "paid", code: "PT-91AD" }, { name: "Grace Bello", status: "paid", code: "PT-91AE" }, { name: "Marisol Diaz", status: "plus_one", code: "PT-91AF" },
    { name: "Sofia Reyes", status: "waitlist", position: 1, code: "PT-91W1" }, { name: "Naomi Fox", status: "waitlist", position: 2, code: "PT-91W2" },
  ],
  e5: [
    { name: "Amara Okafor", status: "guaranteed", code: "PT-51AA" }, { name: "Léa Martin", status: "guaranteed", code: "PT-51AB" }, { name: "Jordan Kim", status: "plus_one", code: "PT-51AC" },
    { name: "Priya Shah", status: "guaranteed", code: "PT-51AD" }, { name: "Sofia Reyes", status: "waitlist", position: 1, code: "PT-51W1" },
  ],
};

// ---------------------------------------------------------------- partnership board
export const BOARD_POSTS: BoardPost[] = [
  { id: "b1", businessId: "casa-sal", kind: "seeking", title: "A skincare brand for a spa weekend", partnerType: "Skincare brand", city: "Tulum", startDate: "2026-11-20", endDate: "2026-11-22", deadline: "2026-10-30", audienceSize: "40 resort guests",
    story: "A long weekend around skin and sound. We want one brand to own the facial menu and the in-room amenities, and to teach one class.", weBring: "Rooms for two of your team, our spa treatment rooms, and our guest list", weNeed: "Product for 40 facials and in-room amenities, and one class",
    requirements: "Clean formulas with full ingredient lists. Someone from the brand on site.", deliverables: ["Product for 40 facials", "Amenities for 20 rooms", "One 45-minute class"], dealType: "Revenue share", terms: "15% of spa revenue that weekend, plus rooms and meals for two",
    category: "retreat", visibility: "everyone", status: "open", palette: "sea", postedAt: "2026-10-04" },
  { id: "b6", businessId: "maison-lune", kind: "seeking", title: "A New York host for our first US café", partnerType: "Venue or co-host", city: "New York", startDate: "2027-04-09", endDate: "2027-04-11", deadline: "2026-12-15", audienceSize: "About 900 over three days",
    story: "Our pink café comes to New York for the first time: three days of lattes, a sampling bar and the spring launch.", weBring: "The café concept, product, staff and press", weNeed: "A street-level space and a local co-host",
    requirements: "Street-level, at least 1,200 sq ft, step-free entrance.", deliverables: ["The space for three days", "Local promotion with approval"], dealType: "Co-host", terms: "Shared costs; we cover product, staff and fit-out",
    category: "brand", visibility: "invited", invited: ["lumen", "skin-theory"], status: "open", palette: "rose", postedAt: "2026-10-09" },
  { id: "b11", businessId: "maison-aube", kind: "seeking", title: "A skincare ritual for a slower weekend", partnerType: "Independent skincare brand", city: "Lisbon", startDate: "2026-11-14", endDate: "2026-11-15", deadline: "2026-10-28", audienceSize: "24 adult retreat guests",
    story: "A small weekend around rest, thoughtful skincare and time outdoors. We'd love a founder who makes learning feel personal.", weBring: "A treatment space, two nights for two of your team, and a paid workshop budget", weNeed: "Lead two 45-minute skincare rituals and provide 24 clearly labeled sample kits",
    requirements: "A founder or educator who can teach in English. Labeled ingredients.", deliverables: ["Two guided skincare workshops", "24 sample kits with ingredient information", "One planning call"], dealType: "Paid fee", terms: "€1,200 to €2,000, plus two nights",
    category: "retreat", visibility: "everyone", status: "open", palette: "mint", postedAt: "2026-10-06" },
  { id: "b2", businessId: "atelier-verre", kind: "seeking", title: "A quiet venue for three perfume workshops", partnerType: "Venue", city: "Lisbon", startDate: "2027-02-12", endDate: "2027-02-14", deadline: "2026-12-01", audienceSize: "12 per session",
    story: "Three small blending workshops while our perfumers are in Lisbon.", weBring: "A perfumer, all materials, an audience of 18,000", weNeed: "A calm room with natural light, three afternoons",
    requirements: "Good ventilation and a large table.", deliverables: ["The room for three afternoons", "Water and seating for 12"], dealType: "Paid fee", terms: "€300 per afternoon",
    category: "beauty", visibility: "everyone", status: "open", palette: "amber", postedAt: "2026-09-30" },
  { id: "b4", businessId: "still-water", kind: "seeking", title: "A licensed facialist for a five-day retreat", partnerType: "Licensed practitioner", city: "Sintra", startDate: "2027-03-08", endDate: "2027-03-12", deadline: "2026-12-20", audienceSize: "16 guests",
    story: "Five days in the hills with daily treatments and long walks.", weBring: "Travel, lodging, a full-day schedule", weNeed: "Daily facials for 16 guests, one a day each",
    requirements: "A current license in Portugal or the EU, and your own insurance.", deliverables: ["Up to 16 facials a day", "A short morning talk"], dealType: "Paid fee", terms: "€2,400 for the week, travel and lodging included",
    category: "retreat", visibility: "everyone", status: "open", palette: "mint", postedAt: "2026-09-26" },
  { id: "b9", businessId: "dalbit", kind: "seeking", title: "A New York stockist to co-host a Seongsu-style pop-up", partnerType: "Venue or stockist", city: "New York", startDate: "2026-12-11", endDate: "2026-12-13", deadline: "2026-11-06", audienceSize: "About 600 over a weekend",
    story: "Our layering stations, in New York for one weekend before the holidays.", weBring: "Product, layering stations, two estheticians from Seoul", weNeed: "A space in Manhattan or Brooklyn and local press",
    requirements: "Space for four stations and a queue indoors.", deliverables: ["The space for a weekend", "Help with local press"], dealType: "Co-funded", terms: "We cover product and staff; we split rent and promotion 50/50",
    category: "brand", visibility: "everyone", status: "open", palette: "lilac", postedAt: "2026-10-08" },
  { id: "b3", businessId: "lumen", kind: "offering", title: "Our Williamsburg space for brand launch evenings", partnerType: "Skin health brand", city: "New York", startDate: "2026-11-02", endDate: "2026-12-18", deadline: "2026-11-20", audienceSize: "Up to 80 a night",
    story: "Our front room hosts a launch evening most weeks. We'd like more brands focused on skin health.", weBring: "The space on weekday evenings, a licensed clinical team for consultations, and our 2,400 clients", weNeed: "A brand to run the sampling bar and the evening's talk",
    requirements: "Skin health focus. No injectables or treatments at the event.", deliverables: ["A sampling bar for up to 80", "A 20-minute talk", "Gift bags if you'd like"], dealType: "Co-host", terms: "No venue fee; you bring product and gift bags",
    category: "brand", visibility: "everyone", status: "open", palette: "dusk", postedAt: "2026-09-20" },
  { id: "b5", businessId: "rosa-clay", kind: "offering", title: "Product for gift bags and sampling bars", partnerType: "Event host", city: "Any city", startDate: "2026-11-01", endDate: "2027-06-30", deadline: "2027-05-31", audienceSize: "Up to 500 units",
    story: "We send clay balms and minis to events with a skin-curious audience.", weBring: "Full-size and mini products, display materials", weNeed: "Events with a skin-curious audience, and photos after",
    requirements: "A sampling table or gift bags.", deliverables: ["Up to 500 minis", "Display materials"], dealType: "Product exchange", terms: "Products valued at up to $4,000; no cash fee",
    category: "brand", visibility: "everyone", status: "open", palette: "peach", postedAt: "2026-09-12" },
  { id: "b10", businessId: "hollis-vane", kind: "offering", title: "A perfumer to lead scent sessions at your event", partnerType: "Venue or event host", city: "London", startDate: "2026-11-07", endDate: "2027-03-28", deadline: "2027-02-28", audienceSize: "Up to 30 per session",
    story: "A perfumer and a scent organ for your guests, on weekends.", weBring: "A perfumer, a scent organ, raw materials", weNeed: "Venues and brands hosting London events",
    requirements: "A ventilated room.", deliverables: ["One or two 45-minute sessions"], dealType: "Paid fee", terms: "£450 per session, materials included",
    category: "beauty", visibility: "everyone", status: "open", palette: "amber", postedAt: "2026-10-02" },
  { id: "b7", businessId: "lumen", kind: "seeking", title: "A partner for a weekend wellness morning", partnerType: "Movement or breathwork host", city: "New York", startDate: "2027-01-16", endDate: "2027-01-16", deadline: "2026-12-15", audienceSize: "About 40",
    story: "A slow Saturday morning: breathwork, then skin consultations and tea.", weBring: "Our space and clinical team", weNeed: "A movement or breathwork host to lead 45 minutes",
    requirements: "", deliverables: ["One 45-minute session"], dealType: "Paid fee", terms: "",
    category: "escape", visibility: "everyone", status: "draft", palette: "mint", postedAt: "2026-10-11" },
  { id: "b8", businessId: "lumen", kind: "seeking", title: "A clay or colour brand for an autumn evening", partnerType: "Clay or colour brand", city: "New York", startDate: "2026-09-17", endDate: "2026-09-17", deadline: "2026-08-10", audienceSize: "Up to 700 across the evening",
    story: "An evening for our clients and theirs: sampling by the entrance, consultations in the back.", weBring: "Space, consultations, our client list", weNeed: "A brand to run the sampling bar",
    requirements: "Product for 700 guests.", deliverables: ["A sampling bar", "Gift bags"], dealType: "Co-host", terms: "No venue fee; partner supplies product and gift bags",
    category: "brand", visibility: "everyone", status: "closed", closedAt: "2026-08-12", palette: "peach", postedAt: "2026-07-28" },
];

export const SEED_PROPOSALS: BoardProposal[] = [
  { id: "pr1", postId: "b3", fromBusinessId: "skin-theory", toBusinessId: "lumen", person: "Mina Cho, lead esthetician", availability: "Thursday evenings in November", terms: "No fee; we bring sample kits for 80",
    pitch: "A glass skin evening in your space: our estheticians teach in the front room while your clinical team runs consultations in the back. We'd bring our class audience of about 3,000 New Yorkers.", portfolio: "Skin Theory Studio on Plume", status: "new", at: "2026-10-10" },
  { id: "pr9", postId: "b3", fromBusinessId: "linen-skin", toBusinessId: "lumen", person: "Maya Reyes, founder", availability: "Weekday evenings from Nov 9", terms: "$1,100 workshop fee, including materials",
    pitch: "A gentle texture workshop for your clients, with 80 labeled discovery sets. We're new to Plume and would love to start with you.", portfolio: "linenskin.example (sample)", status: "new", at: "2026-10-11" },
  { id: "pr3", postId: "b3", fromBusinessId: "hollis-vane", toBusinessId: "lumen", person: "Theo Hollis, perfumer", availability: "Nov 18 to 20, flying in", terms: "£450 per session, travel at our cost",
    pitch: "A scent bar at one of your launch evenings: our perfumer blends with guests while they wait for consultations.", portfolio: "Hollis & Vane on Plume", status: "shortlisted", reviewed: true, at: "2026-10-08" },
  { id: "pr7", postId: "b3", fromBusinessId: "rosa-clay", toBusinessId: "lumen", person: "Rosa Lin, founder", availability: "Thu, Dec 10", terms: "No venue fee; Rosa Clay supplies 80 gift bags",
    pitch: "Clay and glow again, for winter: our sampling bar by the entrance and gift bags for every guest.", portfolio: "Rosa Clay on Plume", status: "accepted", reviewed: true, decidedAt: "2026-10-06",
    agreement: { scope: "A co-hosted winter evening at Lumen on Dec 10 for 80 guests: Rosa Clay runs the sampling bar and gift bags, Lumen hosts and runs consultations.", terms: "No venue fee. Rosa Clay supplies product for 80 gift bags. Each brand keeps its own sales.", poster: true, applicant: true }, collaborationId: "c1", at: "2026-10-05" },
  { id: "pr4", postId: "b8", fromBusinessId: "rosa-clay", toBusinessId: "lumen", person: "Rosa Lin, founder", availability: "Sep 17", terms: "Product for 700 and gift bags",
    pitch: "Our clay bar by your entrance, gift bags for every guest, and our Brooklyn community on the guest list.", portfolio: "Rosa Clay on Plume", status: "accepted", reviewed: true, decidedAt: "2026-08-04",
    agreement: { scope: "Co-hosted autumn evening at Lumen, Sep 17.", terms: "No venue fee; Rosa Clay supplies product and gift bags.", poster: true, applicant: true }, collaborationId: "c0", at: "2026-08-02" },
  { id: "pr5", postId: "b8", fromBusinessId: "dalbit", toBusinessId: "lumen", person: "Jiwoo Han, partnerships", availability: "Sep 17", terms: "Product exchange",
    pitch: "A rice toner bar for your autumn evening, with two estheticians from our Seoul team.", status: "declined", reviewed: true, decisionReason: "We'd already chosen a partner", decidedAt: "2026-08-12", archived: true, at: "2026-08-04" },
  { id: "pr2", postId: "b4", fromBusinessId: "lumen", toBusinessId: "still-water", person: "Dana Ruiz, RN, clinical lead", availability: "Mar 8 to 12", terms: "€2,400 for the week as posted",
    pitch: "Our licensed esthetician could lead daily facials for your Sintra retreat, with products from our recovery line.", status: "new", at: "2026-10-06" },
  { id: "pr6", postId: "b1", fromBusinessId: "lumen", toBusinessId: "casa-sal", person: "Dana Ruiz, RN, clinical lead", availability: "Nov 20 to 22", terms: "Revenue share as posted",
    pitch: "Our recovery line for in-room amenities and a facial menu for your spa weekend.", status: "declined", decisionReason: "Dates didn't work for the brand's team", decidedAt: "2026-10-09", at: "2026-10-05" },
];

export const SIGNALFLOW_MATCHES: { hostId: string; overlap: number }[] = [
  { hostId: "maison-lune", overlap: 64 },
  { hostId: "skin-theory", overlap: 58 },
  { hostId: "dalbit", overlap: 53 },
  { hostId: "rosa-clay", overlap: 51 },
];

export const SEED_COLLABORATIONS: Collaboration[] = [
  {
    id: "c1", title: "Clay and glow, winter edition", aId: "lumen", bId: "rosa-clay", postId: "b3", proposalId: "pr7",
    scope: "A co-hosted winter evening at Lumen on Dec 10 for 80 guests: Rosa Clay runs the sampling bar and gift bags, Lumen hosts and runs consultations.",
    terms: "No venue fee. Rosa Clay supplies product for 80 gift bags. Each brand keeps its own sales.",
    eventDate: "2026-12-10", city: "New York", status: "planning",
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
  { id: "c0", title: "Clay and glow evening", aId: "lumen", bId: "rosa-clay", postId: "b8", proposalId: "pr4", scope: "Co-hosted autumn evening at Lumen, Sep 17.", terms: "No venue fee; Rosa Clay supplies product and gift bags.", eventDate: "2026-09-17", city: "New York", status: "ended", tasks: [], messages: [], assets: [], approvals: { a: true, b: true }, experienceId: "p2", rating: null },
];

// ---------------------------------------------------------------- SignalFlow (sample numbers, view-only)
export interface OutcomeWindow {
  rsvps: number; attended: number; sales: number; treatments: number; consented: number;
  funnel: [string, number][];
  samples: { name: string; sampled: number; tried: number; saved: number; bought: number }[];
}
export const OUTCOMES: Record<string, { currency: "USD"; windows: Record<7 | 30 | 60, OutcomeWindow>; demand: [string, number][]; locals: number; suggestion: string }> = {
  p2: {
    currency: "USD", locals: 79,
    demand: [["Paris", 96], ["London", 74], ["Miami", 51], ["Los Angeles", 38], ["Toronto", 22]],
    suggestion: "Guests visiting from London and Paris saved three times as many products as locals, and 96 people asked for this evening in Paris. A co-hosted evening in Paris with Maison Lune, whose audience overlaps with yours by 64%, is worth testing.",
    windows: {
      7: { rsvps: 640, attended: 412, sales: 2180, treatments: 9, consented: 298,
        funnel: [["Viewed the listing", 4812], ["RSVP'd or booked", 640], ["Attended", 412], ["Tried It taps", 286], ["Saved a product", 121], ["Bought", 41], ["Booked a treatment", 9]],
        samples: [{ name: "Recovery balm", sampled: 230, tried: 168, saved: 70, bought: 33 }, { name: "Clay cleansing balm", sampled: 198, tried: 140, saved: 52, bought: 25 }, { name: "Mineral SPF", sampled: 150, tried: 96, saved: 31, bought: 12 }] },
      30: { rsvps: 640, attended: 412, sales: 6240, treatments: 31, consented: 298,
        funnel: [["Viewed the listing", 4812], ["RSVP'd or booked", 640], ["Attended", 412], ["Tried It taps", 286], ["Saved a product", 188], ["Bought", 96], ["Booked a treatment", 31]],
        samples: [{ name: "Recovery balm", sampled: 230, tried: 168, saved: 101, bought: 60 }, { name: "Clay cleansing balm", sampled: 198, tried: 140, saved: 79, bought: 47 }, { name: "Mineral SPF", sampled: 150, tried: 96, saved: 44, bought: 23 }] },
      60: { rsvps: 640, attended: 412, sales: 8930, treatments: 44, consented: 298,
        funnel: [["Viewed the listing", 4812], ["RSVP'd or booked", 640], ["Attended", 412], ["Tried It taps", 286], ["Saved a product", 214], ["Bought", 131], ["Booked a treatment", 44]],
        samples: [{ name: "Recovery balm", sampled: 230, tried: 168, saved: 112, bought: 79 }, { name: "Clay cleansing balm", sampled: 198, tried: 140, saved: 88, bought: 61 }, { name: "Mineral SPF", sampled: 150, tried: 96, saved: 50, bought: 31 }] },
    },
  },
};

/** Turnout Prediction lookup (mocked from Lumen's past show-up rates, then NYC category averages). */
export const TURNOUT: Record<string, Record<"morning" | "afternoon" | "evening", number>> = {
  Mon: { morning: 41, afternoon: 48, evening: 63 }, Tue: { morning: 43, afternoon: 50, evening: 66 }, Wed: { morning: 44, afternoon: 51, evening: 67 },
  Thu: { morning: 45, afternoon: 53, evening: 68 }, Fri: { morning: 40, afternoon: 55, evening: 61 }, Sat: { morning: 58, afternoon: 71, evening: 57 },
  Sun: { morning: 62, afternoon: 66, evening: 44 },
};

export const BRING_BACK_FOR_HOST: Record<string, number> = { lumen: 281 };
