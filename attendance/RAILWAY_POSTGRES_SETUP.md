# Attendance — Railway Postgres setup

The site is now an Express server (`server.js`) that stores each sign-in in a **Postgres** database
on Railway. Do this once in the Railway dashboard.

## 1. Add a Postgres database
- Open your Railway **project** → **New** → **Database** → **Add PostgreSQL**.
- Railway creates a `Postgres` service with a `DATABASE_URL`.

## 2. Give the web service the database URL
- Open your **web service** (datasciencebaguio) → **Variables** → **New Variable**.
- Add: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`  (reference the Postgres service).
- This uses Railway's private network — **no SSL needed**.
  - If you ever use the **public** Postgres URL instead, also add `DATABASE_SSL=true`.

## 3. (Optional) Protect the CSV export
- Add a variable `ADMIN_TOKEN` = some long secret string.
- Download attendance any time at:
  `https://datasciencebaguio-production.up.railway.app/admin/attendance.csv?token=YOUR_ADMIN_TOKEN`

## 4. Redeploy
- Railway redeploys on the next push (or click **Deploy**).
- On boot the server runs `CREATE TABLE IF NOT EXISTS attendance (...)` automatically — no migration needed.

## How it works
```
Gate (index.html)  --POST /api/attendance-->  Express (server.js)  -->  Postgres "attendance" table
```
Columns: `id, created_at, full_name, email, contact, client_timestamp, sign_date, sign_time,
ip, city, region, country, user_agent`.

The browser sends name/email/contact + client time + IP/city/region/country (from ipapi.co); the
server also captures the real client IP from the proxy headers. Until `DATABASE_URL` is set the site
still works — `/api/attendance` just returns `{stored:false}` and records nothing.

## Quick checks
- `GET /api/health` → `{"ok":true,"db":true}` once the DB is attached.
- Sign in once, then open the CSV export (or the Railway Postgres "Data" tab) to see the row.
