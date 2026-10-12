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

## Where each piece goes in the Plume app

Everything lives under `src/features/travel/` and moves across as-is. Routes become TanStack
Start file routes (each with `ssr: false` and the same auth `beforeLoad` the app already uses).

| Preview route | File route in the app | Screen |
| --- | --- | --- |
| `/travel` | `travel.index.tsx` | Discover: Near Me / I'm Traveling, worldwide search, calendar, By day / All together, Atmosphere, Plan My Trip |
| `/travel/e/$experienceId` | `travel.e.$experienceId.tsx` | Listing (How to Get In, Happening Now, Tried It, What it feels like, Room), or the recap once ended |
| `/travel/e/$experienceId/room` | `travel.e.$experienceId.room.tsx` | An event Room |
| `/travel/missed` | `travel.missed.tsx` | You Missed It with Bring It Back |
| `/travel/itinerary` | `travel.itinerary.tsx` | My itinerary: named itineraries, by day, map, sharing |
| `/travel/i/$token` | `travel.i.$token.tsx` | View-only shared itinerary |
| `/travel/passport` | `travel.passport.tsx` | Passport stamps |
| `/travel/rooms` | `travel.rooms.tsx` | Rooms hub (joined Rooms, unread state) |
| `/travel/following` | `travel.following.tsx` | Alerts, followed places and hosts, trip alerts |
| `/travel/board` | `travel._host.board.index.tsx` | Host Studio: the partnership board |
| `/travel/board/o/$postId` | `travel._host.board.o.$postId.tsx` | An opportunity, with the proposal form |
| `/travel/board/brief` | `travel._host.board.brief.tsx` | Post, edit or reopen an opportunity |
| `/travel/board/opportunities` | `travel._host.board.opportunities.tsx` | My opportunities |
| `/travel/board/applications` | `travel._host.board.applications.tsx` | Applications, Received / Sent, with history |
| `/travel/board/workspaces` | `travel._host.board.workspaces.tsx` | Shared workspaces |
| `/travel/board/c/$collabId` | `travel._host.board.c.$collabId.tsx` | One workspace: agreement, event draft review, approvals, publish |
| `/travel/studio/events` | `travel._host.studio.events.tsx` | My events (drafts, upcoming, completed, cancelled; list or calendar) |
| `/travel/studio/create` | `travel._host.studio.create.tsx` | Create or edit an experience (Turnout Prediction, Treatment Safety) |
| `/travel/studio/results` | `travel._host.studio.results.tsx` | Results: Event Outcome Intelligence |
| `/travel/studio/checkin` | `travel._host.studio.checkin.tsx` | Check-in with the live wait control |
| `/travel/admin` | `travel.admin.tsx` | Admin: licenses, treatment rules, brokering |

`_host` is a pathless layout route holding the Host Studio sidebar.

Styles are scoped: tokens are prefixed `--tv-*` and utilities `bg-tv-*`, `text-tv-*`, so they
can't collide with the app's shadcn tokens. The host area adds a `.tv-host` scope with the
reference's ivory, plum and lavender, so consumer pages keep their own palette. The app logo
import becomes `@/assets/plume-logo.png`.

Changes outside Plume Travel that will need your OK at integration: a "Travel" entry in the app
navigation (`AppShell` / `PlumeAppSidebar`), and the regenerated `routeTree.gen.ts`.

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
