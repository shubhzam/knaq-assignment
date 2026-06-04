# SOLUTION.md - Knaq IoT Alert Triage System

I spent roughly 10 hours on this. Here is what I built, why I made the calls I made, and where I would go next.

---

## What is here

Two services, one repo:

```
knaq/
  api/    Express + TypeScript + Prisma 7 + PostgreSQL
  web/    Next.js 14 App Router + MUI + Redux Toolkit + RTK Query
  data/   provided devices.json + sensor_messages.json
  docker-compose.yml
```

The backend ingests the raw message file and serves a company-scoped REST API. The frontend is a triage console talking directly to the live API - no mock data anywhere.

---

## Why PostgreSQL

The data is relational. The dominant access patterns are things like "alerts for this company", "readings for this device in a time window", "alerts assigned to this user" - joins and filters, not time-series aggregations. Postgres handles all of that cleanly and Prisma gives us a typed client and a clean migration/seed story.

I used `Json` columns for two things: `timeline` (audit trail on each alert) and `thresholds` (device config). Both are genuinely unstructured and always read as a whole, so a JSON column made more sense than extra tables.

---

## Why triage state lives inline on the Alert row

Every alert has exactly one triage lifecycle - it is a 1:1 relationship. Inlining the triage columns (`status`, `assigned_to`, `acknowledged_at`, `resolved_at`, the `resolution_*` fields) avoids a join on the hottest read path (`GET /alerts`). A separate triage table would have been more "correct" in a purely relational sense, but it would have added complexity for no real gain at this scale.

The `timeline` is a JSON array on the same row for the same reason - it is append-only, always read alongside its alert, and there is no need to query into individual timeline entries from SQL.

---

## How duplicates are handled

There is no message ID in the data, so duplicates are defined by natural key uniqueness enforced at the DB level:

- **Readings:** `@@unique([device_id, timestamp, input_name])` - same device, same input, same instant = same reading
- **Alerts:** `@@unique([device_id, triggered_at, alert_type])` - same alert type, same device, same instant = same alert

Ingest catches Prisma `P2002` unique-violation and counts it as a duplicate rather than crashing. Deduplication lives in the DB constraint, not in memory, so re-running ingest is safe and future real-time ingestion would be protected too.

---

## How malformed messages are handled

The ingest loop never crashes on a single bad record. In order:

1. Missing `message_type` or `device_id` → logged, counted as unknown, skipped
2. Unknown `device_id` → logged, skipped
3. Unknown `message_type` → logged, skipped
4. Any unexpected throw → caught, logged with the payload, counted as error, processing continues

At the end the script prints a full summary so the ingest result is auditable.

---

## How threshold breach flagging works

Each reading is checked against the device `alert_thresholds` after it is stored. `checkThreshold()` looks for `<input>_high` / `<input>_low` keys and compares the value. On a breach, it creates a new `Alert` with `status = "new"` and a `created` timeline entry.

The reading is stored regardless - a breach does not discard the data point.

One honest gap: threshold-breach alerts get `severity = "warning"` as a default since readings do not carry severity. A better approach would derive severity from how far past the threshold the value is. Device-originated alert messages keep their own severity.

---

## Where transition enforcement lives

Server-side, in one place: `api/src/utils/transitions.ts`. The rules are declared once:

```
new          → acknowledged
acknowledged → resolved
resolved     → terminal
```

`validateTransition()` throws a `409 Conflict` on an illegal move. The frontend renders buttons based on current status, but it is not trusted - the server rejects anything illegal regardless of what the UI shows.

This was one of those decisions where I wanted to make sure there was a single source of truth. Scattering `if` checks across routes would have been easy to get wrong.

---

## How Redux and RTK Query are split

This was the trickiest part of the frontend to get right.

- **Server state → RTK Query.** `alertsApi` and `devicesApi` own everything that comes from the API. Queries provide the `"Alert"` cache tag; every mutation `invalidatesTags: ["Alert"]`, so after any acknowledge / assign / resolve / note, the affected lists and detail views refetch automatically. No alert data is hand-copied into a Redux slice.
- **Client-only state → plain slices.** `filtersSlice` holds the queue filter selections. `authSlice` holds the active bearer token - `prepareHeaders` reads it from the store, so the User Switcher changes the active token at runtime and all subsequent requests follow without a page reload.

---

## Pessimistic over optimistic updates

Updates wait for server confirmation before the UI changes. I made this call deliberately - triage state is mission-critical and a failed optimistic update that does not roll back cleanly is worse than a 200ms delay. If the server rejects a transition with a 409, the UI simply does not advance because nothing was mutated locally first.

---

## Timezone handling

The readings endpoint (`GET /devices/:id/readings?start=X&end=Y`) was the one place that needed real care.

- `start`/`end` arrive as device local time strings
- `fromZonedTime(input, device.timezone)` converts them to UTC for the DB query (all timestamps stored UTC)
- Results are converted back to device-local strings with `toZonedTime` before returning

No `toLocaleString()` fudging. The conversion happens at the query boundary and nowhere else.

---

## What I would improve with another week

In order of what I would actually prioritize:

1. **Tests.** Minimum: an API integration test driving `new → acknowledged → resolved` and asserting the 409 on an illegal jump; a resolve dialog form test; an ingest test over a dirty fixture with dupes and malformed messages.
2. **Recovery correlation.** Right now recoveries are logged but not persisted - they do not auto-resolve the matching open alert. That is real work (matching alert ↔ recovery by device + type + time ordering, handling out-of-order delivery) and I scoped it out in favour of the human resolve flow.
3. **Optimistic updates** with correct 409 rollback.
4. **Analytics backend.** Right now the analytics page derives everything client-side from the full alert list. Fine for 35 alerts, does not scale. A proper `GET /alerts/stats` endpoint would fix that.
5. **Filter parity.** Multi-value status filter, `assigned_to` filter, pagination.
6. **Light/dark theme toggle** - the theme is structured for it, just not wired.
7. **Reading type validation** on ingest.

---

## Known gaps

- No automated tests
- Recoveries logged but not stored or correlated
- Analytics charts use Recharts (faster to compose) rather than ECharts as stated in the spec - honest deviation
- Dark mode only
- Single-value status filter (not multi-select)
- No `dismiss`/`reopen` endpoints

---

## AI disclosure

I used Claude (Anthropic) as a coding assistant throughout - scaffolding the Prisma schema, Express routes, RTK Query layer, and MUI components. Architectural decisions (storage choice, inline triage vs separate table, timeline as JSON, pessimistic updates, where transition enforcement lives) were mine. The assistant sped up the typing, not the thinking.

---

## Running it

### Docker (easiest)

```bash
docker compose up --build
```

Brings up Postgres, then the API (migrate → seed → ingest → serve), then the web app.
- API: `http://localhost:8000`
- Web: `http://localhost:3000`

### Local dev

```bash
# api
cd api
cp .env.example .env  # set DATABASE_URL
npm install
npx prisma migrate deploy
npx tsx src/scripts/seed.ts
npx tsx src/scripts/ingest.ts
npm run dev

# web (separate terminal)
cd web
npm install
npm run dev
```

### Default login

The frontend defaults to `token-sarah` (Sarah Chen, Brookfield Properties). Use the User Switcher in the top right to switch between all 6 seeded users across 3 companies and see tenant isolation live.