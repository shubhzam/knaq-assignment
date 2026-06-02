# Knaq Take-Home - Tech Spec

Paste this at the start of any new chat to give full context.

---

## What we're building

Full-stack IoT alert triage system. Devices in the field (elevators, escalators, compressors) push sensor messages to the cloud. We ingest those messages, store them, and expose a dashboard where building managers can triage alerts.

Two services, one repo:
```
knaq-submission/
  api/                  ← Node.js + Express + Prisma (TypeScript)
  web/                  ← Next.js 14 App Router (TypeScript)
  data/
    devices.json        ← 10 devices, 4 companies
    sensor_messages.json ← 816 raw messages
  README.md
  SOLUTION.md
```

---

## The data

### devices.json - 10 devices across 4 companies

| device_id | type       | company               | timezone            |
|-----------|------------|-----------------------|---------------------|
| ELV-001   | elevator   | Brookfield Properties | America/New_York    |
| ELV-002   | elevator   | Brookfield Properties | America/Chicago     |
| ELV-003   | elevator   | Hines                 | America/Los_Angeles |
| ELV-004   | elevator   | Hines                 | America/Denver      |
| ESC-001   | escalator  | Mitsui Fudosan        | Asia/Tokyo          |
| ESC-002   | escalator  | Brookfield Properties | America/New_York    |
| CMP-001   | compressor | Brookfield Properties | America/New_York    |
| CMP-002   | compressor | Hines                 | America/Chicago     |
| CMP-003   | compressor | Mitsui Fudosan        | Europe/London       |
| CMP-004   | compressor | Hines                 | America/Los_Angeles |

Each device has:
- `reading_types` - what inputs it measures (current, frequency, temperature, motor_status)
- `alert_thresholds` - e.g. `{ current_high: 180, current_low: 5, frequency_high: 65 }`

### sensor_messages.json - 816 messages, 3 types

```
reading   774  routine sensor data
alert      26  device-detected threshold breach
recovery   15  condition returned to normal
unknown     1  intentionally malformed - must handle without crashing
```

Message shapes:

```json
// reading
{ "device_id": "ELV-001", "message_type": "reading", "timestamp": 1770737458000,
  "inputs": [{ "input_name": "current", "input_value": 58.94 }] }

// alert
{ "device_id": "CMP-001", "message_type": "alert", "timestamp": 1770924235000,
  "alert_type": "high_temperature", "severity": "critical",
  "threshold": 130, "reading_value": 136.51, "reading_name": "temperature" }

// some alerts omit threshold/reading_value (door_fault, vibration_anomaly)
{ "device_id": "CMP-002", "message_type": "alert", "timestamp": 1770728082000,
  "alert_type": "vibration_anomaly", "severity": "critical" }

// recovery
{ "device_id": "CMP-001", "message_type": "recovery", "timestamp": 1770927835000,
  "alert_type": "high_temperature", "severity": "critical",
  "threshold": 130, "reading_value": 118.42 }
```

All timestamps are epoch milliseconds UTC.

---

## Tech stack

### Backend (api/)
```
Node.js + Express    HTTP server and routing
TypeScript           strict mode
Prisma               ORM and migrations
PostgreSQL           database
zod                  request body validation
jsonwebtoken         not needed - just use hardcoded bearer token lookup
```

### Frontend (web/)
```
Next.js 14           App Router
TypeScript           strict, no any
MUI v5               UI components
Redux Toolkit        global state management
RTK Query            server data fetching + caching
Formik + Yup         form state and validation
```

### Brand colors
```
Primary:   #EFC01A  (gold)
Secondary: #4B8189  (teal)
Error:     #F44336
Warning:   #FFA726
Info:      #29B6F6
Success:   #66BB6A
```

---

## Database schema (Prisma)

```prisma
model Device {
  device_id      String    @id
  type           String
  company        String
  name           String
  location       String
  timezone       String
  floor_count    Int?
  installed_date String
  reading_types  String[]
  thresholds     Json      // { current_high: 180, current_low: 5, ... }
  readings       Reading[]
  alerts         Alert[]
}

model Reading {
  id         Int      @id @default(autoincrement())
  device_id  String
  timestamp  DateTime
  input_name String
  input_value Float
  device     Device   @relation(fields: [device_id], references: [device_id])

  @@unique([device_id, timestamp, input_name]) // dedup constraint
}

model User {
  id      Int     @id @default(autoincrement())
  name    String
  role    String
  company String
  token   String  @unique
  email   String
  alerts  Alert[] @relation("AssignedAlerts")
}

model Alert {
  id           Int       @id @default(autoincrement())
  
  // immutable - what the device reported
  device_id    String
  alert_type   String
  severity     String    // critical | warning | info
  triggered_at DateTime
  threshold    Float?
  reading_value Float?
  reading_name  String?
  
  // mutable - triage state
  status              String    @default("new") // new | acknowledged | resolved | dismissed
  assigned_to         Int?
  acknowledged_at     DateTime?
  resolved_at         DateTime?
  resolution_type     String?   // fixed | false_alarm | known_issue | deferred | cannot_reproduce
  root_cause          String?
  action_taken        String?
  preventive_measures String?
  time_spent_minutes  Int?
  
  // audit trail
  timeline    Json      @default("[]") // TimelineEntry[]

  device      Device    @relation(fields: [device_id], references: [device_id])
  assignee    User?     @relation("AssignedAlerts", fields: [assigned_to], references: [id])
  
  @@unique([device_id, triggered_at, alert_type]) // dedup constraint
}
```

### Timeline entry shape
```typescript
interface TimelineEntry {
  action: string       // "created" | "acknowledged" | "assigned" | "resolved" | "note_added"
  user: string         // user.name or "system"
  timestamp: string    // ISO string
  details?: string
  note?: string
}
```

---

## Seeded users

```typescript
const users = [
  { id: 1, name: "Sarah Chen",   role: "manager",  company: "Brookfield Properties", token: "token-sarah",  email: "sarah@brookfield.com" },
  { id: 2, name: "James Park",   role: "engineer", company: "Brookfield Properties", token: "token-james",  email: "james@brookfield.com" },
  { id: 3, name: "Nina Torres",  role: "engineer", company: "Brookfield Properties", token: "token-nina",   email: "nina@brookfield.com" },
  { id: 4, name: "Raj Patel",    role: "manager",  company: "Hines",                 token: "token-raj",    email: "raj@hines.com" },
  { id: 5, name: "Lisa Wong",    role: "engineer", company: "Hines",                 token: "token-lisa",   email: "lisa@hines.com" },
  { id: 6, name: "Kenji Mori",   role: "manager",  company: "Mitsui Fudosan",        token: "token-kenji",  email: "kenji@mitsui.com" },
]

// default user for frontend testing (set in .env)
// NEXT_PUBLIC_TOKEN=token-sarah
// this logs in as Sarah Chen, Brookfield Properties
// she sees ELV-001, ELV-002, ESC-002, CMP-001
```

---

## Auth pattern

Every request carries a bearer token:
```
Authorization: Bearer token-sarah
```

Express middleware resolves it to a user:
```typescript
// api/src/middleware/auth.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "")
  if (!token) return res.status(401).json({ error: "missing token" })
  
  const user = await prisma.user.findUnique({ where: { token } })
  if (!user) return res.status(401).json({ error: "invalid token" })
  
  req.user = user  // attach to request
  next()
}
```

Every route uses `req.user.company` to scope all queries. This never changes.

---

## Ingest pipeline

File: `api/src/scripts/ingest.ts`
Run once at startup: `npx ts-node src/scripts/ingest.ts`

```
read sensor_messages.json (816 messages)
        ↓
for each message:
  ├── reading  → store in readings table
  │              check against device thresholds
  │              if breach → create alert with status="new"
  ├── alert    → store in alerts table
  │              status="new", timeline=[{action:"created", user:"system"}]
  ├── recovery → store as reading or log
  └── unknown  → log to console, continue (don't crash)

dedup:
  readings → @@unique([device_id, timestamp, input_name])
  alerts   → @@unique([device_id, triggered_at, alert_type])
  on conflict → skip, continue
```

### Threshold checking logic
```typescript
// for each reading input, check device thresholds
const checkThresholds = (device, inputName, inputValue) => {
  const thresholds = device.thresholds as Record<string, number>
  const highKey = `${inputName}_high`
  const lowKey  = `${inputName}_low`
  
  if (thresholds[highKey] && inputValue > thresholds[highKey]) {
    return { breached: true, direction: "high", threshold: thresholds[highKey] }
  }
  if (thresholds[lowKey] && inputValue < thresholds[lowKey]) {
    return { breached: true, direction: "low", threshold: thresholds[lowKey] }
  }
  return { breached: false }
}
```

---

## REST API

### Base URL
```
api runs on: http://localhost:8000
web runs on: http://localhost:3000
```

### All endpoints require auth header
```
Authorization: Bearer <token>
```

### Read endpoints

```
GET /devices
  → returns devices where company = req.user.company

GET /devices/:id
  → returns single device (must belong to user's company)

GET /devices/:id/readings?start=<datetime>&end=<datetime>
  → start and end are in DEVICE LOCAL TIMEZONE (not UTC)
  → response timestamps are in DEVICE LOCAL TIMEZONE
  → CRITICAL: convert to UTC for DB query, convert back for response

GET /users
  → returns users where company = req.user.company

GET /alerts
  query params (all optional):
    severity   = "critical" | "warning" | "info"
    status     = "new" | "acknowledged" | "resolved" | "dismissed"
    device_id  = "ELV-001"
    q          = search string (matches alert_type or device name)
    from       = ISO datetime
    to         = ISO datetime
  → results scoped to req.user.company

GET /alerts/:id
  → full alert + timeline
  → must belong to user's company
```

### Mutation endpoints

```
POST /alerts/:id/acknowledge
  body: none
  transition: new → acknowledged
  side effects: sets acknowledged_at, appends timeline entry

POST /alerts/:id/assign
  body: { assignee_id: number, note?: string }
  allowed in: any non-terminal status
  does NOT change status
  side effects: sets assigned_to, appends timeline entry

POST /alerts/:id/resolve
  body: {
    resolution_type: "fixed" | "false_alarm" | "known_issue" | "deferred" | "cannot_reproduce"
    root_cause: string           (required)
    action_taken: string         (required)
    preventive_measures?: string
    time_spent_minutes?: number
  }
  transition: acknowledged → resolved
  side effects: sets resolved_at + all resolution fields, appends timeline entry

POST /alerts/:id/notes
  body: { note: string }
  allowed in: any status
  does NOT change status
  side effects: appends timeline entry only
```

### Status transition rules (enforce server-side, return 409 on violation)

```
new            → acknowledged  (via /acknowledge)
acknowledged   → resolved      (via /resolve)
resolved       → terminal, no transitions allowed
assign         → allowed in new, acknowledged (not resolved)
notes          → allowed in any status
```

```typescript
// api/src/utils/transitions.ts
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new:          ["acknowledged"],
  acknowledged: ["resolved"],
  resolved:     [],
}

export const validateTransition = (currentStatus: string, targetStatus: string) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(targetStatus)) {
    throw new ApiError(409, `cannot transition from ${currentStatus} to ${targetStatus}`)
  }
}
```

---

## Frontend architecture

### Folder structure
```
web/src/
  app/
    alerts/
      page.tsx          ← Alert Queue (Screen 1)
    alerts/[id]/
      page.tsx          ← Alert Detail (Screen 2)
    layout.tsx
  features/
    alerts/
      api/
        alertsApi.ts    ← RTK Query endpoints
      components/
        AlertTable.tsx
        AlertRow.tsx
        ResolveDialog.tsx
        AssignDialog.tsx
        Timeline.tsx
        AddNoteForm.tsx
      hooks/
        useAlertFilters.ts   ← custom hook over Redux slice
      slices/
        filtersSlice.ts      ← client state (filters, selected rows)
      types/
        index.ts             ← Alert, Device, User, TimelineEntry types
    devices/
      api/
        devicesApi.ts
  components/
    StatusBadge.tsx
    SeverityChip.tsx
    LoadingSkeleton.tsx
    EmptyState.tsx
    ErrorState.tsx
  lib/
    store/
      index.ts          ← Redux store setup
    theme/
      index.ts          ← MUI theme with brand colors
    auth/
      index.ts          ← token handling from env
```

### State split

```
RTK Query (server state):
  alerts list, alert detail, devices, users
  - cached automatically
  - invalidated after mutations
  - provides loading/error states

Redux slice (client state):
  filter values (severity, status, device_id, search)
  selected alert IDs for bulk actions
  - survives navigation
  - components read via useSelector
  - components write via useDispatch (or custom hooks)
```

### RTK Query - tag invalidation pattern

```typescript
// after any mutation, invalidate Alert tag → auto-refetch list + detail
getAlerts:       providesTags: ["Alert"]
getAlert:        providesTags: ["Alert"]
acknowledgeAlert: invalidatesTags: ["Alert"]
assignAlert:      invalidatesTags: ["Alert"]
resolveAlert:     invalidatesTags: ["Alert"]
addNote:          invalidatesTags: ["Alert"]
```

### Optimistic vs pessimistic

Use **pessimistic updates** - wait for server confirmation before updating UI.
Triage state is mission-critical. A failed optimistic update that doesn't roll back correctly
is worse than a 200ms delay. Document this decision in SOLUTION.md.

---

## TypeScript types (shared contract)

```typescript
// shared between api responses and frontend consumption

interface TimelineEntry {
  action: string
  user: string
  timestamp: string
  details?: string
  note?: string
}

interface Alert {
  id: number
  device_id: string
  alert_type: string
  severity: "critical" | "warning" | "info"
  triggered_at: string
  threshold?: number
  reading_value?: number
  reading_name?: string
  status: "new" | "acknowledged" | "resolved" | "dismissed"
  assigned_to?: number
  acknowledged_at?: string
  resolved_at?: string
  resolution_type?: string
  root_cause?: string
  action_taken?: string
  preventive_measures?: string
  time_spent_minutes?: number
  timeline: TimelineEntry[]
  device: Device
  assignee?: User
}

interface Device {
  device_id: string
  type: string
  company: string
  name: string
  location: string
  timezone: string
  floor_count?: number
  reading_types: string[]
  thresholds: Record<string, number>
}

interface User {
  id: number
  name: string
  role: string
  company: string
  email: string
}

interface Reading {
  id: number
  device_id: string
  timestamp: string  // device local time on GET /devices/:id/readings
  input_name: string
  input_value: number
}
```

---

## Timezone handling (critical correctness requirement)

`GET /devices/:id/readings?start=X&end=Y`
- `start` and `end` come in as ISO strings representing DEVICE LOCAL TIME
- DB stores all timestamps as UTC
- You must convert both ways

```typescript
import { fromZonedTime, toZonedTime } from "date-fns-tz"

// convert device local time → UTC for DB query
const startUTC = fromZonedTime(start, device.timezone)
const endUTC   = fromZonedTime(end, device.timezone)

// query DB with UTC range
const readings = await prisma.reading.findMany({
  where: {
    device_id,
    timestamp: { gte: startUTC, lte: endUTC }
  }
})

// convert results back to device local time for response
const localReadings = readings.map(r => ({
  ...r,
  timestamp: toZonedTime(r.timestamp, device.timezone).toISOString()
}))
```

---

## Required screens

### Screen 1 - Alert Queue (/alerts)

```
┌─────────────────────────────────────────────────────────┐
│ Summary bar: [New: 12] [Acknowledged: 5] [Resolved: 48] │
├─────────────────────────────────────────────────────────┤
│ Filters: [Critical] [Warning]  [Device ▼]  [Search...]  │
├─────────────────────────────────────────────────────────┤
│ ☐ │ SEV  │ ALERT TYPE       │ DEVICE   │ TIME  │ STATUS │
│ ☐ │ CRIT │ high_temperature │ CMP-001  │ 5m ago│ new    │
│ ☐ │ WARN │ vibration_anomaly│ ELV-002  │ 12m   │ ack'd  │
└─────────────────────────────────────────────────────────┘
```

- clicking a row → navigate to /alerts/:id
- quick action: Acknowledge button inline (only if status=new)
- loading skeleton, empty state, error state all required

### Screen 2 - Alert Detail (/alerts/:id)

```
┌─────────────────────────────────────────────────────────┐
│ high_temperature  [CRITICAL]  [new]                      │
│ CMP-001 · HVAC Compressor Unit A · One World Trade Ctr  │
├────────────────────┬────────────────────────────────────┤
│ Reading: 136.51°C  │ Threshold: 130°C                   │
├────────────────────┴────────────────────────────────────┤
│ [Acknowledge]  [Assign]                                  │
├─────────────────────────────────────────────────────────┤
│ TIMELINE                                                 │
│ ● system · created · 5 mins ago                         │
├─────────────────────────────────────────────────────────┤
│ Add note: [___________________________] [Submit]         │
└─────────────────────────────────────────────────────────┘
```

Action buttons change based on status:
- new          → Acknowledge, Assign
- acknowledged → Resolve, Assign
- resolved     → read only

### Screen 3 - Resolve Dialog (modal)

```
Resolution Type*  [Fixed ▼]
Root Cause*       [___________________________]
Action Taken*     [___________________________]
                  [___________________________]
Preventive Meas.  [___________________________]
Time Spent (min)  [____]

[Cancel]  [Resolve Alert]  ← disabled until form valid
```

Formik + Yup validation. Required fields block submit.

### Screen 4 - Assign Dialog (modal)

```
Search teammates  [_______________]

● Sarah Chen    Manager    [current]
○ James Park    Engineer
○ Nina Torres   Engineer

Note (optional)   [___________________________]

[Cancel]  [Assign]
```

---

## Environment variables

### api/.env
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knaq"
PORT=8000
```

### web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TOKEN=token-sarah
```

---

## Build order (feature sequence)

```
Phase 1 - Backend foundation
  1. Prisma schema + migrations
  2. Seed script (devices + users)
  3. Ingest script (816 messages)
  4. Auth middleware

Phase 2 - Backend API
  5. GET /devices, GET /devices/:id
  6. GET /users
  7. GET /alerts, GET /alerts/:id
  8. GET /devices/:id/readings (with timezone)
  9. POST acknowledge, assign, resolve, notes (with transition enforcement)

Phase 3 - Frontend foundation
  10. MUI theme setup (brand colors, dark/light toggle)
  11. Redux store + RTK Query base
  12. filtersSlice + useAlertFilters hook
  13. Shared TypeScript types

Phase 4 - Frontend screens
  14. Alert Queue - table + filters + loading/empty/error states
  15. Alert Detail - header + metric card + action buttons
  16. Timeline component
  17. Add Note form
  18. Resolve Dialog (Formik + Yup)
  19. Assign Dialog

Phase 5 - Polish + submission
  20. Wire end-to-end, test all transitions
  21. Error states (409 on bad transition, 401 on bad token)
  22. README + SOLUTION.md
```

---

## SOLUTION.md must cover

1. Why PostgreSQL (relational triage state, JSONB for timeline)
2. Why triage fields are inline on alerts table (not a separate table)
3. How duplicates are handled (unique constraints, on conflict skip)
4. How malformed messages are handled (log + continue)
5. How threshold breach flagging works (backend checks every reading)
6. Where transition enforcement lives (server-side, single validateTransition fn)
7. How Redux/RTK Query state is split (server vs client)
8. Optimistic vs pessimistic choice (pessimistic, why)
9. Timezone approach (date-fns-tz, convert at query boundary)
10. Trade-offs made under time cap
11. What you'd improve with another week
12. AI tools used (disclose Claude, Cursor, etc.)