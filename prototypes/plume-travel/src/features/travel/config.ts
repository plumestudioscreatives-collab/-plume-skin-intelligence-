// Plume Travel configuration. Pricing lives here (and in travel_hosts.travel_plan) so a
// paid host plan can be switched on later without a rebuild.

/**
 * On plumestudioscreatives.com: false while Plume Travel is a design preview. Every visitor sees
 * the sample data and the "View as" switcher, and nothing is saved beyond their own browser.
 * Set to true once Travel runs on real accounts and data (the backend build steps).
 */
export const TRAVEL_LAUNCHED = false;

/** Monthly price of the host plan. Free during launch. */
export const TRAVEL_HOST_PRICE_MONTHLY = 0;

/** Plume's application fee on ticket sales. Commission-free: always 0. */
export const PLATFORM_APPLICATION_FEE_PERCENT = 0;

/** Show "x% of n past attendees said this was accurate" only from this many votes. */
export const SENSORY_MIN_VOTES = 10;

/** How long a waitlist offer stays open before it passes to the next person. */
export const WAITLIST_OFFER_HOURS = 2;

/** During a live event (Happening Now) an opened place is held for this many minutes. */
export const LIVE_OFFER_MINUTES = 10;

/** Fixed "today" and "now" for the mock-data preview so sample dates read consistently.
 *  NOW is 3:00 pm in New York, while two Brooklyn events are happening. */
export const TODAY = "2026-10-12";
export const NOW = "2026-10-12T19:00:00Z";

export type Currency = "EUR" | "USD" | "GBP" | "KRW";

/**
 * Rough Stripe processing-fee estimates for the host payout preview only.
 * Stripe sets the real fee; it varies by card, country and account.
 */
export const STRIPE_FEE_ESTIMATE: Record<Currency, { percent: number; fixed: number }> = {
  EUR: { percent: 1.5, fixed: 0.25 },
  USD: { percent: 2.9, fixed: 0.3 },
  GBP: { percent: 1.5, fixed: 0.2 },
  KRW: { percent: 3.4, fixed: 0 },
};
