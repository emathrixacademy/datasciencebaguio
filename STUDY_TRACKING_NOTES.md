# Study-Time Tracking — Notes for Grading

eMathrix Education · Data Science & Data Analytics. This explains the session-time tracking added on top of the
existing attendance system, how to pull it for grading, and the privacy basis.

## What is logged

Two Postgres tables (both auto-created on server boot, like the original `attendance` table):

- **`attendance`** (unchanged) — one row per sign-in at the gate: name, email, contact, timestamp, IP + city/region/country.
- **`study_sessions`** (new) — one row per *study session* on a content page:
  - `student_email`, `student_name` — reused from the attendance gate identity (localStorage `dict_attendee`).
  - `session_start`, `session_end`, `last_heartbeat` — timestamps.
  - `duration_seconds` — filled in when the session ends cleanly.
  - `page` — the path the session was opened on (e.g. `/day1/reading.html`).
  - `ip`, `city`, `country`.

The browser client (`assets/study-tracker.js`, included on every content page — home, all session/activity
pages, readings, and dataset portals) does:

1. **On load**, if the student is identified in `localStorage`, `POST /api/session/start` → gets a `session_id`.
2. **Every 60 s while the tab is visible**, `POST /api/session/heartbeat` (updates `last_heartbeat`).
3. **On tab hide / close** (`visibilitychange`→hidden, `beforeunload`), `navigator.sendBeacon` → `POST /api/session/end`.

If no database is attached, every endpoint returns `{stored:false}` and the site keeps working (same graceful
behavior as the original attendance API).

## How duration is computed

- **Clean close:** when `/api/session/end` fires, `duration_seconds = now() − session_start`.
- **Abandoned tab (no end event):** heartbeats stop as soon as the tab is hidden/closed, so `last_heartbeat`
  naturally freezes near the moment the student stopped using the page. A session is therefore considered
  effectively closed once `last_heartbeat` is older than ~5 minutes.
- **In the `study_totals` rollup**, if `session_end` is NULL we fall back to
  `last_heartbeat − session_start` (never the wall-clock "now"), so an idle/abandoned tab **does not inflate**
  a student's total time. `GREATEST(0, …)` guards against clock skew.

## The `study_totals` view (per student)

Aggregates `study_sessions` by `student_email`:

| column | meaning |
|--------|---------|
| `total_seconds` | total effective study time (sum of clean + fallback durations) |
| `session_count` | number of study sessions |
| `first_seen` / `last_seen` | earliest start / latest activity |
| `active_days` | distinct calendar days active (computed in Asia/Manila time) |

## How to pull the data for grading

The server exposes token-guarded admin exports (same guard as the existing `/admin/attendance.csv`):

- **Per-student study totals (for grading):**
  `GET /admin/study.csv?token=YOUR_ADMIN_TOKEN`
  → columns: `student_email, student_name, total_seconds, total_minutes, session_count, active_days, first_seen, last_seen`.
- **Raw attendance sign-ins (unchanged):** `GET /admin/attendance.csv?token=YOUR_ADMIN_TOKEN`
- The admin viewer page `admin.html` still shows sign-ins; the study CSV is fetched directly by URL.

`ADMIN_TOKEN` is the same environment variable used by the existing attendance export. Set it on Railway.

Example (browser or curl):
```
https://<your-app>.up.railway.app/admin/study.csv?token=<ADMIN_TOKEN>
```

## Admin access & security (hardened)

Admin data is protected **server-side on every request** — there is no client-only check and no data is
embedded in `admin.html` (view-source shows only the empty shell + code). Access requires **one** of:

- **Instructor login** at `/admin.html`: `POST /admin/login {email,password}` verified server-side with a
  **constant-time** SHA-256 compare; on success it sets a signed **HttpOnly** admin cookie `pup_admin`
  (8h). `admin.html` fetches data (attendance / study time / activity submissions) only after that cookie
  exists; the JSON/CSV feeds return **403** without it.
- **`ADMIN_TOKEN`** (for curl/CSV), compared **constant-time** (`crypto.timingSafeEqual` over SHA-256 of
  the token). **Fail closed:** if `ADMIN_TOKEN` is not set, the token path grants nothing (login path still works).

Every admin route — `/admin/attendance.(csv|json)`, `/admin/study.(csv|json)`,
`/admin/submissions.(csv|json)`, `POST /admin/purge-test` — goes through one `requireAdmin(req,res)`
guard. Wrong/missing credential → `403`, no rows. Verified: no-token, wrong-token, and wrong-login all
return 403/401 with empty bodies; only a valid login or the correct token returns data.

**Credentials & secrets (set these in Railway env for production):**
- `ADMIN_EMAIL_SHA256` / `ADMIN_PASSWORD_SHA256` — SHA-256 of the instructor email/password (defaults are
  baked in as **hashes**, never plaintext; override to rotate the password).
- `ADMIN_SECRET` (or `SESSION_SECRET`) — **must** be a strong, dedicated secret. It signs the admin cookie;
  if left at the built-in dev fallback, an attacker who reads the public repo could forge an admin cookie.
  Setting it is required to keep the admin login trustworthy.
- `ADMIN_TOKEN` — strong, dedicated value if you use the CSV/curl path.

## Server-side attendance gate (cookie session)

Attendance is enforced **on the server**, not in the browser. Opening a content URL in a fresh incognito
window (no cookie) **cannot** see content — it bounces to the sign-in gate. localStorage alone never
unlocks anything.

**Flow:**
1. On successful sign-in (`POST /api/attendance`), the server sets a **signed, HttpOnly** cookie
   `pup_sess` (HMAC-SHA256 over `email + issuedAt`, `SameSite=Lax`, `Secure` on https, `Max-Age = 3h`).
   The attendance row is still written as before — the cookie is set in addition.
2. **Gate middleware** guards every content route. Public (no cookie needed): the gate (`/`, `/index.html`),
   `/404.html`, `/assets/*`, `/api/*`, `/admin/*`, `/datasets/*` (+ the short dataset aliases), and static
   assets by extension. Everything else (home, week hubs, readings, activity pages, guides, presentations,
   orientation) requires a valid `pup_sess` cookie; otherwise → **302 to `/index.html?return=<original>`**,
   so after signing in the student lands back on the page they wanted.
   - `/datasets/*` is intentionally **public** because the Week 1 notebooks fetch the portal
     programmatically (`requests.get` / `urllib`) with no cookie — gating it would break the live-scrape lesson.
3. **Returning device:** the gate page re-establishes the cookie silently via `POST /api/session/resume`
   (trusts the stored identity; does not insert a new attendance row), then continues — no re-typing, no
   redirect loop.
4. **Idle auto-logout (3h):** the client clears localStorage **and** calls `POST /api/session/logout` to
   clear the cookie, and the cookie's own `Max-Age` also expires at 3h — so an idle student must sign in
   again, keeping attendance honest.
5. **Secret:** `SESSION_SECRET` env (falls back to `ADMIN_TOKEN`, then a dev default). Set `SESSION_SECRET`
   on Railway for production.

**Degraded mode:** cookie signing/verification is self-contained (no DB needed), and sign-in sets the
cookie even when the DB is detached — so the gate keeps working and no one is locked out. In a DB outage,
attendance/study rows just aren't *recorded* (endpoints return `{stored:false}`), but the cookie gate still
enforces sign-in. **Normal operation is DB-attached and fully enforced.**

## Purging test/junk rows (clean grading)

Test entries (e.g. from audits) shouldn't pollute grading. A token-guarded endpoint deletes them from
**all three** tables (`attendance`, `study_sessions`, `submissions`):

```
# delete everything with an @example.com email (default test pattern):
POST /admin/purge-test?token=<ADMIN_TOKEN>

# or purge one specific student:
POST /admin/purge-test?token=<ADMIN_TOKEN>&email=someone@x.com
```

Returns `{ok:true, deleted:{attendance, study_sessions, submissions}}`. It's a no-op with a 503 if no DB
is attached, and 403 without the correct `ADMIN_TOKEN`. Use `@example.com` addresses when generating any
test data so they're easy to purge in one call.

## Privacy note

This is **class participation data** collected under the **same Data Privacy notice shown on the attendance
gate** (`index.html`): students are told at sign-in that their name, email, contact, sign-in time, and
approximate location (from IP) are recorded **for class attendance only**. Study-time tracking extends that
same attendance purpose (measuring participation/engagement for grading) — it records *how long and how often*
a signed-in student uses the class materials. No new personal fields are collected beyond the identity already
given at the gate plus page/timestamp/IP. Keep the `ADMIN_TOKEN` private; only the instructor should pull the CSVs.
