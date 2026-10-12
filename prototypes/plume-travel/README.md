# Plume Travel front end (UI approval stage)

Front end for Plume Travel with mock data only. Nothing here talks to Supabase or Stripe.
It is built on the same stack and versions as the Plume app (`petal-connect-commerce`):
React 19.2, TypeScript, Tailwind v4, TanStack Router 1.170, lucide-react.
No file in the Plume app has been changed.

## Run it

```bash
cd prototypes/plume-travel
npm install
npm run dev              # http://localhost:5173/travel
npm run typecheck
npm run build:artifact   # single-file preview in dist-artifact/plume-travel.html
```

Use the "View as" switch at the top to move between a beauty lover, a host (Lumen Aesthetics)
and a Plume admin. "Reset preview" restores the sample data. Screenshots of every screen at
desktop and phone widths are in `screenshots/` (not committed).

## Where each piece goes in the Plume app

Everything lives under `src/features/travel/` and moves across as-is. Routes become TanStack
Start file routes (each with `ssr: false` and the same auth `beforeLoad` the app already uses):

| Preview route | File route in the app | Screen |
| --- | --- | --- |
| `/travel` | `src/routes/travel.index.tsx` | Discover (Near me / I'm traveling) |
| `/travel/e/$experienceId` | `src/routes/travel.e.$experienceId.tsx` | Listing, or the recap once it has ended |
| `/travel/e/$experienceId/room` | `src/routes/travel.e.$experienceId.room.tsx` | Event room |
| `/travel/itinerary` | `src/routes/travel.itinerary.tsx` | Itineraries and map |
| `/travel/i/$token` | `src/routes/travel.i.$token.tsx` | View-only shared itinerary |
| `/travel/following` | `src/routes/travel.following.tsx` | Alerts and follows |
| `/travel/board` | `src/routes/travel.board.index.tsx` | Partnership board |
| `/travel/board/c/$collabId` | `src/routes/travel.board.c.$collabId.tsx` | Collaboration workspace |
| `/travel/studio` | `src/routes/travel.studio.tsx` | Host studio (Results, Create, Check-in) |
| `/travel/admin` | `src/routes/travel.admin.tsx` | Admin (licenses, treatment rules, brokering) |

Styles are scoped: tokens are prefixed `--tv-*` and utilities `bg-tv-*`, `text-tv-*`, so they
can't collide with the app's shadcn tokens. The app logo import becomes `@/assets/plume-logo.png`.

Changes outside Plume Travel that will need your OK at integration: a "Travel" entry in the app
navigation (`AppShell` / `PlumeAppSidebar`), and the regenerated `routeTree.gen.ts`.

## Files

| Path | Holds |
| --- | --- |
| `src/features/travel/types.ts` | Domain types mirroring the proposed tables (`experiences`, `bookings`, `board_posts`…) |
| `src/features/travel/config.ts` | `TRAVEL_HOST_PRICE_MONTHLY = 0`, 0% platform fee, waitlist hold time, sensory vote threshold |
| `src/features/travel/data/seed.ts` | Demo content matching the reference file |
| `src/features/travel/state/store.tsx` | Mock state. Each action is commented with the Supabase query or server function it becomes |
| `src/features/travel/lib/` | Time-zone formatting ("10:00 to 18:00, Paris time"), trip overlap, labels, ticket pattern |
| `src/features/travel/components/` | Shell, cards, sensory panel, booking and ticket dialogs, itinerary map |
| `src/features/travel/pages/` | One file per screen |

## Simulated in this stage

- Accounts and roles: a preview switcher, not real auth or business membership.
- Data: kept in the browser (`localStorage`), not Supabase. No RLS yet.
- Payments: Stripe test-mode card form only; no PaymentIntent, no Connect account, no webhook.
- Waitlist offers, alerts and host updates: created in local state; no email is sent.
- License verification: a button for the admin; no document upload or registry check.
- SignalFlow results and match percentages: sample numbers.
- Photo and file uploads: previewed in the browser only.
- Ticket code: a QR-like pattern, not a signed, scannable token. Scanning is typed or simulated.
- Maps: a stylized map from stored positions, not a map provider.
