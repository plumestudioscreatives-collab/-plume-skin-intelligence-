// Feature names and one-line descriptions shown in the interface, under each feature's title
// and in the How it works guide. Edit them here.

export type FeatureKey =
  | "discover" | "getIn" | "sensory" | "planTrip" | "happeningNow" | "triedIt" | "rooms" | "trips" | "stamps" | "missed" | "bringBack"
  | "board" | "outcomes" | "turnout" | "treatment";

export interface Feature { key: FeatureKey; name: string; description: string; audience: "lover" | "host"; to: string }

export const FEATURES: Feature[] = [
  { key: "discover", audience: "lover", to: "/travel", name: "Near Me and I'm Traveling", description: "Type any city, country or area, pick the days and times you're free, and see every brand activation, wellness event and class happening there." },
  { key: "getIn", audience: "lover", to: "/travel/e/e1", name: "How to Get In", description: "Every listing tells you up front whether it's walk-in, RSVP, ticketed, by application or by invitation, with times, price and cancellation." },
  { key: "sensory", audience: "lover", to: "/travel/e/e1", name: "Sensory", description: "Hosts describe how an experience feels. Sensory Match compares it with how you like to feel and scores it out of 10." },
  { key: "planTrip", audience: "lover", to: "/travel", name: "Plan My Trip", description: "Enter a destination and dates. Plume builds a trip around your sensory profile and the brands you follow." },
  { key: "happeningNow", audience: "lover", to: "/travel/e/e12", name: "Happening Now", description: "During an event: live wait times, places left, your ticket and your waitlist position." },
  { key: "triedIt", audience: "lover", to: "/travel/e/e12", name: "Tried It", description: "At an event, tap the tag on any product you sample. It's saved to your Passport with your note." },
  { key: "rooms", audience: "lover", to: "/travel/rooms", name: "Rooms", description: "An optional group for each event, for updates and questions before, and photos after." },
  { key: "trips", audience: "lover", to: "/travel/itinerary", name: "My itinerary", description: "Your personal itinerary: saved and booked experiences by day, on a map, private until you share." },
  { key: "stamps", audience: "lover", to: "/travel/passport", name: "Stamps", description: "Every experience you attend adds a stamp to your Plume Passport, with the products you tried there." },
  { key: "missed", audience: "lover", to: "/travel/missed", name: "You Missed It", description: "See what you missed: the products featured, shop the activation, photos and what people said." },
  { key: "bringBack", audience: "lover", to: "/travel/e/p1", name: "Bring It Back", description: "Missed an event? Ask for it in your city. Hosts see where people want them next." },
  { key: "board", audience: "host", to: "/travel/board", name: "Partnership board", description: "Brands, med spas, resorts and venues find partners to create experiences together. Plume takes no cut." },
  { key: "outcomes", audience: "host", to: "/travel/studio/results", name: "Event Outcome Intelligence", description: "What happened after your event: attendance, which samples sold, and where demand is. Powered by SignalFlow." },
  { key: "turnout", audience: "host", to: "/travel/studio/create", name: "Turnout Prediction", description: "Before you publish, SignalFlow predicts how many people will show up for the day and time you choose." },
  { key: "treatment", audience: "host", to: "/travel/studio/create", name: "Treatment Safety", description: "Experiences involving treatments need a verified practitioner license before they go live." },
];

export const feature = (k: FeatureKey) => FEATURES.find((f) => f.key === k)!;
