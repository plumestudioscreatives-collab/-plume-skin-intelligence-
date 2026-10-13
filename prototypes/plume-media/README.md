# Plume Media prototype

Interactive design prototype for **Plume Media**, the Learn · Read · Watch part of Plume.
It is for design review in Claude. It is **not** production code and is not connected to the
Plume API, Supabase, Stripe, or the Lovable app.

- The same source runs on plumestudioscreatives.com: `prototypes/plume-lovable` copies it into the site
  with a scoped stylesheet (`scripts/scope-css.mjs`). Nothing else imports it.
- Sample data only. Every creator, credential, price, enrollment and film is fictional.
- Artwork is illustrated placeholder art drawn in code (`src/art.jsx`). The Plume logo comes from the
  Plume Design System and is used as supplied.

## Build

```bash
cd prototypes/plume-media
npm install
npm run build        # writes dist/plume-media.html (single file, React bundled in)
```

Open `dist/plume-media.html` in a browser, or publish it as a Claude artifact.

## Source map

| Path | What it holds |
| --- | --- |
| `src/data.js` | Sample channels, demo accounts, articles, courses, quizzes, videos, transcripts |
| `src/store.js` | Local demo state (reducer), persistence to `localStorage`, selectors |
| `src/ui.jsx` | Shared components: icons, buttons, chips, tabs, labels, cards, fields, modal |
| `src/art.jsx` | Placeholder illustration system (skin tones, hair textures, still life) |
| `src/App.jsx` | The app root (`PlumeMediaApp`): routing, shared context, the optional `launch` stop for paid checkout. `src/main.jsx` mounts it for the standalone page |
| `src/shell.jsx` | Preview bar (demo switcher, journeys, frame toggle, reset), header, tabs, footer |
| `src/player.jsx` | Video player with honest no-file state, captions preview, transcript |
| `src/screens/*.jsx` | Home, Search, Channel, Read, Article, Learn, Course, Checkout, Classroom, Watch, Video, Series, My Collection, Studio and its editors |
| `src/styles.css` | Design tokens (light and dark) and all styles; responsive rules use container queries |

## What is simulated

| Area | In this prototype | Needs to be built for production |
| --- | --- | --- |
| Accounts and roles | Demo switcher with four fictional accounts; channel roles from sample memberships | Real auth, profiles, organization membership, server-side permissions |
| Publishing | Drafts, preview, publish and unpublish saved in this browser only | Persistent content, publication states, moderation, safe rendering |
| Paid classes | Checkout accepts only test numbers; nothing is charged or sent | Server-created checkout, verified payment events, entitlements, payouts |
| Lessons and video | Catalog films have no video file; the player says so | Media storage, transcoding, captions, protected playback |
| Uploads | Files stay in the browser; progress is simulated | Real uploads with limits, processing and failure handling |
| Assignments | Private by convention in local state | Server-enforced privacy for learner and course staff |
| Search | Client-side filter over sample data, with a brief loading state | Server search and ranking |
| Reports, verification, invites, downloads, sharing | Confirmation messages only | Moderation queue, credential checks, member invites, files, share links |

State is stored under the `localStorage` key `plume-media-demo:v1`. **Reset demo** clears it.
