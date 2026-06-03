# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is

Single Node.js/Express API (`server.js`) for **Plume Skin Intelligence** — CRUD for clients, skin assessments, treatments, and environment data in Supabase, plus an AI recommendation route via Anthropic Claude.

### Services

| Service | Required | Notes |
|---------|----------|--------|
| **API** (`npm run dev` / `npm start`) | Yes | Default port **3000** (`PORT` env). |
| **Supabase (Postgres + REST)** | Yes | Cloud project or local `supabase start` (see below). |
| **Anthropic API** | For `GET /clients/:id/recommendation` only | Other routes work without a valid key. |

### Standard commands

See `package.json` scripts:

- **Install:** `npm install`
- **Dev server:** `npm run dev` (nodemon)
- **Production run:** `npm start`
- **Database DDL:** run `/workspace/schema.sql` in the Supabase SQL editor (or against local Postgres after `supabase start`).

There is no ESLint, test runner, or Makefile in this repo.

### Environment variables

Create `/workspace/.env` (not committed):

- `SUPABASE_URL` — e.g. `https://<project>.supabase.co` or `http://127.0.0.1:54321` for local Supabase
- `SUPABASE_SERVICE_KEY` — service role JWT (local default is in `supabase status -o env` as `SERVICE_ROLE_KEY`)
- `ANTHROPIC_API_KEY` — required only for the recommendation endpoint
- `PORT` — optional (default 3000)

The process **exits on startup** if `SUPABASE_URL` is missing (Supabase client validation).

### Local Supabase (optional, no cloud secrets)

If Docker is available:

1. `chmod 666 /var/run/docker.sock` (or add your user to the `docker` group and start a new shell).
2. `mkdir -p /tmp/plume-supabase && cd /tmp/plume-supabase && npx supabase init --force && npx supabase start`
3. Apply schema: `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f /workspace/schema.sql`
4. Point `.env` at `API_URL` and `SERVICE_ROLE_KEY` from `npx supabase status -o env` in that directory.

Supabase local stack is **not** started by the VM update script; start it manually when you need DB-backed tests.

### Gotchas

- **No health route** — use `GET /clients/:id` or `POST /clients` to verify the API.
- **Detached HEAD** — check out `main` (or your feature branch) before committing.
- **Recommendation route** needs a real `ANTHROPIC_API_KEY` and client history in the DB.
