# AGENTS.md

## Cursor Cloud specific instructions

### Role

Optional **Living Skin Intelligence** REST API. The main Plume app (`petal-connect-commerce`) does not call this service; skin features there use Supabase + in-app AI.

### Setup (run from this directory)

```bash
npm install
```

Create a local `.env` (not committed) with:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` (service role)
- `ANTHROPIC_API_KEY` (for recommendation endpoint)

### Run

```bash
npm start   # PORT or default 3000
```

If the process is listening, `GET /clients/:id` returns JSON errors from Supabase when keys or IDs are invalid (e.g. `{"error":"Client not found"}`), which is enough to verify the server is up.

### tmux on Cloud VMs

`tmux -f /exec-daemon/tmux.portal.conf`, session name e.g. `skin-api-dev`.
