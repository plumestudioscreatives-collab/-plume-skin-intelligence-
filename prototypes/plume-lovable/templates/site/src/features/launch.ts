// When Plume opens. Until then Plume Media and Plume Travel on this site are fully interactive
// previews with sample data, but buying a class, booking a place, joining an event waitlist and
// claiming a place stop with "opens October 30" and a link to the waitlist (no card details are
// ever asked for). Keep the date in step with the sidebar card in src/plume/components/AppShell.tsx.
// Set to null when Plume opens and the real booking and payment steps are connected.
export const PLUME_LAUNCH: { opensOn: string; waitlistHref: string } | null = {
  opensOn: "October 30",
  waitlistHref: "/about#waitlist",
};
