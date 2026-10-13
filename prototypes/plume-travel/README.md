# Plume Travel front end (UI approval stage)

Front end for Plume Travel with mock data only. Nothing here talks to Supabase or Stripe.
It is built on the same stack and versions as the Plume app (`petal-connect-commerce`):
React 19.2, TypeScript, Tailwind v4, TanStack Router 1.170, lucide-react.
No file in the Plume app has been changed.

This version combines the two prototypes: Claude's Discover, itinerary, listing and admission
flows, with the reference prototype's host sidebar, partnership board presentation,
Applications, My opportunities and Shared workspaces, plus a central Rooms page and an explicit
Atmosphere control.

## Run it

```bash
cd prototypes/plume-travel
npm install
npm run dev              # http://localhost:5173/travel/board
npm run typecheck
npm run build:artifact   # single-file preview in dist-artifact/plume-travel.html
```

The preview opens as the host (Lumen Aesthetics) on Host Studio → Partnership board. Use
"View as" at the top to switch to the beauty lover (Amara) or a Plume admin. "Reset preview"
restores the sample data. The preview clock is fixed at Monday, Oct 12, 2026, 3:00 pm in New York,
while two Brooklyn events are happening.

## On plumestudioscreatives.com

`prototypes/plume-lovable` holds the package for the site: this module copied as-is into
`src/features/travel`, the site adapter (`app/TravelLayout.tsx`), and the TanStack Start file routes
for every page under `/travel`, all inside the site's `AppShell` sidebar. Its README lists the files,
the three site files that change, and how to get them into Lovable.

| Preview route | Screen |
| --- | --- |
| `/travel` | Discover: Near Me / I'm Traveling, worldwide search, calendar, By day / All together, Atmosphere, Plan My Trip |
| `/travel/e/$experienceId` | Listing (How to Get In, Happening Now, Tried It, What it feels like, Room), or the recap once ended |
| `/travel/e/$experienceId/room` | An event Room |
| `/travel/missed` | You Missed It with Bring It Back |
| `/travel/itinerary`, `/travel/i/$token` | My itinerary; a view-only shared itinerary |
| `/travel/passport`, `/travel/rooms`, `/travel/following` | Passport stamps; Rooms; alerts and follows |
| `/travel/board/...` | Host Studio: the partnership board, an opportunity, post a brief, My opportunities, Applications, Shared workspaces, one workspace |
| `/travel/studio/...` | Host Studio: My events, create or edit, Results, Check-in |
| `/travel/admin` | Admin: licenses, treatment rules, brokering |

Styles are scoped: tokens are prefixed `--tv-*` and utilities `bg-tv-*`, `text-tv-*`
(`src/features/travel/travel.css`), so they can't collide with the site's tokens.

## Files

| Path | Holds |
| --- | --- |
| `src/features/travel/types.ts` | Domain types mirroring the proposed tables (`experiences`, `bookings`, `board_posts`, `board_proposals`, `collaborations`…) |
| `src/features/travel/config.ts` | `TRAVEL_HOST_PRICE_MONTHLY = 0`, 0% platform fee, hold times, the fixed preview clock |
| `src/features/travel/copy.ts` | The 15 feature names and one-line descriptions shown under titles and in How it works |
| `src/features/travel/data/` | Demo content, and worldwide places for the location search |
| `src/features/travel/state/store.tsx` | Mock state. Each action is commented with the Supabase query or server function it becomes |
| `src/features/travel/lib/` | Time zones, Sensory Match, discovery filters, publication checks, labels |
| `src/features/travel/components/` | Shell, host layout, cards, dialogs, location search, calendar, live panel, recap |
| `src/features/travel/pages/` | One file per screen; `board/` and `studio/` for Host Studio |

## Simulated in this stage

- Accounts and roles: a preview switcher, not real auth or business membership.
- Data: kept in the browser (`localStorage`), not Supabase. No RLS yet.
- Payments: Stripe test-mode card form only; no PaymentIntent, no Connect account, no webhook.
- The other business's side of every two-sided step (confirming an agreement, approving a
  co-hosted draft) is a labeled "Simulate" button. In production each business confirms from
  its own account.
- Proposals, messages, alerts, waitlist offers and host updates: created in local state; nothing is sent.
- License verification: a button for the admin; no document upload or registry check.
- Profile-check badges, partner ratings, SignalFlow match percentages, Turnout Prediction,
  results analytics, accuracy votes and quotes: sample values, labeled as such in the interface.
- Happening Now: the wait time is set by the host in Check-in; there's no Realtime channel.
- "Use my current location": returns a sample location (Williamsburg) instead of asking the browser.
- Location search: a built-in list of every continent and country, about 230 cities and 50
  neighborhoods. Production uses a places API, and any typed place can still be searched.
- Photo and file uploads: previewed in the browser only.
- Ticket code: a QR-like pattern, not a signed, scannable token.
- Maps: a stylized map from stored positions, not a map provider.
