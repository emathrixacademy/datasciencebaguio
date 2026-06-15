# CLAUDE.md

Guidance for Claude Code when working in this folder. Keep this file updated as the seminar materials change.

## What this folder is

Hands-on seminar materials for a **DICT** event run by **Emathrix Training Center**
(Baguio, CAR region, June 14 2026). Audience: beginners learning **Data Science / Data
Analysis** and **Data Engineering**. Deliverables are **Google Colab notebooks** plus a
shared HTML dataset.

## Files

- `Activity1_DataScience_Colab.ipynb` — Google Form → Sheet → Colab charts (gspread).
- `Activity2_WebScraping_Colab.ipynb` — web scraping the **live** CAR portal
  (`…up.railway.app/car_data`) + a first-pass **data cleaning** demo (nulls + duplicates).
- `Activity3_EDA_Colab.ipynb` — exploratory data analysis on the tourism table from `car_data.html`.
- `car_data.html` — **simulated** CAR-region dataset: 3 tables. **INTENTIONALLY messy**:
  the weather and schools tables contain a few blank cells and one duplicate row each
  (so Activity 2 can teach cleaning). The **tourism table is kept perfectly clean** so
  Activity 3's "0 missing, clean data" narrative stays correct. Do NOT "fix" the nulls in
  weather/schools — they are deliberate. Raw scrape: weather 47, schools 51, tourism 40;
  after Activity 2's cleaning pass: weather 46, schools 50, tourism 40.
- `README.md` — participant-facing overview.

## How activities connect

- Activities 2 and 3 both depend on `car_data.html`. `pd.read_html` returns the tables in
  order: `[0]` weather, `[1]` schools, `[2]` tourism.
- Column names in the notebooks must match the `<th>` headers in `car_data.html` exactly
  (e.g. `Annual_Visitors`, `Entry_Fee_PHP`, `Student_Teacher_Ratio`, `Site ID`, `Site Name`).
  If you edit one, update the other.

## Conventions to preserve

- These are **teaching** notebooks. Favor clarity over cleverness; keep step-by-step
  markdown cells and `Shift + Enter`, top-to-bottom flow.
- Instructions are intentionally **bilingual (English + Tagalog)** — keep that voice.
- Always keep the **"simulated vs real data"** disclaimers. They are a core teaching point,
  not boilerplate.
- Notebooks target **Google Colab** (Colab-specific bits: `google.colab.auth`, file-upload
  panel, `!pip install`). Don't replace with local-only assumptions.
- Each notebook should run standalone (Activity 3 re-scrapes the HTML rather than depending
  on Activity 2's runtime state).

## When editing

- Run a quick consistency check between any changed column name and `car_data.html`.
- Sign-off line in notebooks is "— Emathrix Training Center"; keep it.
- If you add a new activity or dataset, update both `README.md` and this file.
