# Study-Time Tracking — Notes for Grading

PUP Santa Rosa · Data Science & Data Analytics. This explains the session-time tracking added on top of the
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

## Privacy note

This is **class participation data** collected under the **same Data Privacy notice shown on the attendance
gate** (`index.html`): students are told at sign-in that their name, email, contact, sign-in time, and
approximate location (from IP) are recorded **for class attendance only**. Study-time tracking extends that
same attendance purpose (measuring participation/engagement for grading) — it records *how long and how often*
a signed-in student uses the class materials. No new personal fields are collected beyond the identity already
given at the gate plus page/timestamp/IP. Keep the `ADMIN_TOKEN` private; only the instructor should pull the CSVs.
