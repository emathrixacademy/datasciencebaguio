# DICT Data Science Seminar — CAR Region

**DICT** · CAR Region · June 2026 · 3-day hands-on workshop

A beginner-friendly, hands-on workshop on **Data Science / Data Analysis** and **Data Engineering**
using Google Colab. Deployed as a static site; the landing page links to each day's materials.

## Structure

```
index.html            Hub — links to Day 1 / 2 / 3
serve.json            Backward-compatible URL rewrites
package.json          Static hosting (serve)
datasets/             Shared, live-served data
  *.html                CAR portals (scraped / browsed by students)
  csv/*.csv             CSV exports (Download CSV buttons)
day1/
  index.html            Day 1 landing page
  presentation.html     Day 1 slide deck
  notebooks/            Activity 1–3 Colab notebooks
  guides/               Activity 1–3 step-by-step guides (HTML + PDF)
day2/  index.html       (in preparation)
day3/  index.html       (in preparation)
```

## Day 1 — Foundations

- **Activity 1 — Data Science:** connect a live Google Form → Sheet → Colab, chart the responses.
- **Activity 2 — Web Scraping + Cleaning:** scrape the live CAR Open Data Portal, do a first pass of
  data cleaning (missing values + duplicates), check a correlation, and build a dashboard.
- **Activity 3 — Exploratory Data Analysis:** a **generic** notebook — pick a dataset (forest,
  wildlife, or air quality), download its CSV, upload to Colab, set a few labels, analyze, and
  answer the built-in questions.

## Datasets (all simulated for training)

Served live at `…up.railway.app/datasets/…` (old short URLs like `/car_data` still work via `serve.json`):

| File | Used by | Notes |
|------|---------|-------|
| `datasets/car_data.html` | Activity 2 | 3 tables; weather/schools have intentional nulls + a duplicate, tourism clean |
| `datasets/car_data1–3.html` | Activity 2 practice | same shape, different data |
| `datasets/forest_data.html` | Activity 3 | + Download CSV button → `csv/forest.csv` |
| `datasets/wildlife_data.html` | Activity 3 | + Download CSV button → `csv/wildlife.csv` |
| `datasets/airquality_data.html` | Activity 3 | + Download CSV button → `csv/airquality.csv` |

All notebooks run in **Google Colab**. Run cells top to bottom with **Shift + Enter**.
