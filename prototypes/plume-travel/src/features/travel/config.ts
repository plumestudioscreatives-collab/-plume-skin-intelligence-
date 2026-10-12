// Plume Travel configuration. Pricing lives here (and in travel_hosts.travel_plan) so a
// paid host plan can be switched on later without a rebuild.

/** Monthly price of the host plan. Free during launch. */
export const TRAVEL_HOST_PRICE_MONTHLY = 0;

/** Plume's application fee on ticket sales. Commission-free: always 0. */
export const PLATFORM_APPLICATION_FEE_PERCENT = 0;

/** Show "x% of n past attendees said this was accurate" only from this many votes. */
export const SENSORY_MIN_VOTES = 10;

/** How long a waitlist offer stays open before it passes to the next person. */
export const WAITLIST_OFFER_HOURS = 2;

/** Fixed "today" for the mock-data preview so sample dates read consistently. */
export const TODAY = "2026-10-12";

/**
 * Rough Stripe processing-fee estimates for the host payout preview only.
 * Stripe sets the real fee; it varies by card, country and account.
 */
export const STRIPE_FEE_ESTIMATE: Record<"EUR" | "USD", { percent: number; fixed: number }> = {
  EUR: { percent: 1.5, fixed: 0.25 },
  USD: { percent: 2.9, fixed: 0.3 },
};
