# CLAUDE.md

Guidance for Claude Code when working in this folder. Keep this file updated as the seminar materials change.

## What this folder is

Materials for a **DICT** 3-day Data Science seminar (Baguio, CAR region, June 2026). Audience:
beginners learning **Data Science / Data Analysis** and **Data Engineering**. Deliverables are
**Google Colab notebooks** + a static website (deployed on Railway via `serve`).

## Folder structure

```
index.html            ATTENDANCE GATE — name/email/contact + IP/geo, POSTs to /api/attendance
home.html             Hub page — links to Day 1 / 2 / 3 + per-day Google Drive links
server.js             Express server: serves the site + /api/attendance -> Postgres
package.json          Node app: `node server.js` (express + pg)
attendance/RAILWAY_POSTGRES_SETUP.md   How to attach Railway Postgres (DATABASE_URL)
datasets/             Shared, live-served data (portals + csv/)
day1/  index.html · presentation.html · notebooks/ · guides/
day2/  index.html · notebooks/ · guides/   (Automation & AI)
day3/  index.html · guides/   (Capstone: jigsaw group project, no new notebooks)
```

## Day 3 — Capstone

`day3/index.html` is the capstone page ("From Data to Decision"): a 3-hour **jigsaw** group project
(4 roles in parallel — Collector / Scraper-Cleaner / Analyst / AI-Builder — each a slice of an earlier
activity, all feeding one shared Google Sheet). `day3/guides/Capstone_Guide.html(+pdf)` is the printable
guide with role cards, the 3-hour timetable, copy-paste snippets, deliverables, and a 20-point scoring
rubric. It **reuses** existing assets (practice portals, the generic EDA notebook, the image classifier)
— no new notebooks. Hour 4 is presentations + closing.

## Day 2 notebooks (`day2/notebooks/`)

- `Activity1_StockAnalysis_Colab.ipynb` — analyzes stock data an **n8n + Polygon.io** pipeline writes
  to a Google Sheet (loads the sheet via CSV-export URL, falls back to sample data). The n8n workflow
  itself is documented in `day2/guides/Activity1_n8n_Pipeline.html` (5 JS Code-node steps).
- `Activity2_SignatureDetection_Colab.ipynb` — runs a **Teachable Machine** SavedModel over a Google
  Drive folder to classify signed/unsigned documents, saves a results CSV, then does EDA on confidence.

**SECURITY:** the source material contained a live Polygon.io API key — it is **NOT** in the repo;
all API keys / Sheet IDs are placeholders (`YOUR_POLYGON_API_KEY`, `PASTE_YOUR_SHEET_ID_HERE`).
Never commit real keys; if one is pasted in, replace with a placeholder before committing.

When adding Day 2 / Day 3 content, mirror the Day 1 layout (its own `index.html`, `notebooks/`,
`guides/`, and reuse `datasets/` or add new ones there). Update the hub `index.html` cards.

## Day 1 notebooks (`day1/notebooks/`)

- `Activity1_DataScience_Colab.ipynb` — Google Form → Sheet → Colab charts (gspread). No data dep.
- `Activity2_WebScraping_Colab.ipynb` — scrapes the **live** CAR portal
  (`…up.railway.app/datasets/car_data`), then a first-pass **cleaning** demo (drop dup, fillna
  mean/mode), a 2-variable **correlation** (elevation vs temperature), and a dashboard.
- `Activity3_EDA_Colab.ipynb` — **generic / config-driven** EDA. Student uploads a CSV and sets 8
  labels (`DATA_FILE, GROUP_COL, TYPE_COL, MAIN_NUM, SECOND_NUM, SCORE_COL, NAME_COL, ID_COL`);
  every step runs unchanged. Step 10 is a "your turn" **questions** cell (not auto-printed findings).

## Datasets (`datasets/`) — all simulated, served live

- `car_data.html` — 3 tables (`pd.read_html` order: `[0]` weather, `[1]` schools, `[2]` tourism).
  **INTENTIONALLY messy**: weather & schools have blank cells + 1 duplicate row each; **tourism is
  kept clean**. Do NOT "fix" the weather/schools nulls — they drive Activity 2's cleaning lesson.
  Raw scrape: weather 47, schools 51, tourism 40; after cleaning: 46 / 50 / 40.
- `car_data1/2/3.html` — Activity 2 practice sets, same shape, different data (seeds 2026/27/28).
- `forest_data.html`, `wildlife_data.html`, `airquality_data.html` — Activity 3 themed datasets
  (single table, ~40 rows, clean). Same generic shape: ID, Name, Location, Province, a Category
  column, two numeric columns, a 0–5 score, a status column. Each has a **Download CSV** button →
  `datasets/csv/<name>.csv`. Seeds 11/22/33.
- `datasets/csv/*.csv` — CSV exports (weather/schools/tourism + forest/wildlife/airquality),
  generated FROM the matching HTML so they stay identical.

## URLs & serve.json

The portals moved under `datasets/`, so live URLs are now `…/datasets/car_data`, `/datasets/forest_data`,
etc. `serve.json` keeps the **old short URLs** (`/car_data`, `/forest_data`, …) working via rewrites,
so already-downloaded notebooks don't break. If you move a dataset, add/adjust its rewrite.

## Attendance gate + Postgres

`index.html` is a sign-in form (full name, email, contact). On submit it fetches IP + city/region/country
from `ipapi.co`, stamps the time, and POSTs JSON to the **same-origin** `/api/attendance` endpoint in
`server.js`, which inserts a row into **Railway Postgres** (`attendance` table, auto-created on boot).
Sets `localStorage.dict_attendance` so a returning device skips straight to `home.html`. The site still
works before the DB is attached — `/api/attendance` returns `{stored:false}`.

`server.js` (Express) also serves all static pages, replicates the old clean-URLs + `/car_data`→
`/datasets/...` rewrites, exposes `/api/health`, and `/admin/attendance.csv?token=ADMIN_TOKEN` for export.
Env vars: `DATABASE_URL` (required to store), `DATABASE_SSL=true` only for the public PG URL,
`ADMIN_TOKEN` for the CSV export. Setup steps: `attendance/RAILWAY_POSTGRES_SETUP.md`.
Per-day **Google Drive** links live on `home.html` and each day page.

## Conventions to preserve

- **Teaching** notebooks: clarity over cleverness; step-by-step markdown, `Shift + Enter` top to bottom.
- Bilingual **English + Tagalog** voice in the notebooks — keep it.
- Always keep the **"simulated vs real data"** disclaimers — a core teaching point.
- Target **Google Colab** (`google.colab` upload panel, `!pip install`). No local-only assumptions.
- Branding is **DICT** (not Emathrix) across the website and presentation.
- Column names in notebooks must match the dataset `<th>` headers exactly. If you edit one, update the other.

## When editing

- After moving/renaming a dataset, check: the notebook URL(s), the portal Download-CSV `href`, the
  `serve.json` rewrite, and the day page links.
- If you add an activity, dataset, or day, update the hub `index.html`, the relevant day page,
  `README.md`, and this file.
- Guide PDFs are generated from the matching `*.html` via headless Edge with a **proper Windows
  `file://` URI** (spaces URL-encoded) — an MSYS `/c/...` path silently produces a "file not found"
  PDF. Verify a regenerated PDF has multiple `/Page` objects, not a single error page.
