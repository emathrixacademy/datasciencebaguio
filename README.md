# DICT Hands-On Seminar — Data Science, Web Scraping & EDA

**DICT** · Baguio (CAR Region) · June 14, 2026

A three-activity, hands-on workshop introducing **Data Science / Data Analysis** and
**Data Engineering** through Google Colab. Participants go from collecting their own data,
to scraping data off the web, to running a full exploratory data analysis.

---

## Contents

| File | Activity | Topic |
|------|----------|-------|
| `Activity1_DataScience_Colab.ipynb` | Activity 1 | Data Science — live Google Form → Sheet → Colab charts |
| `Activity2_WebScraping_Colab.ipynb` | Activity 2 | Web Scraping — live website + local HTML dataset (Data Engineering) |
| `Activity3_EDA_Colab.ipynb` | Activity 3 | Exploratory Data Analysis on the scraped tourism data |
| `car_data.html` | shared dataset | Simulated CAR-region data (weather, schools, tourism) |
| `Day1_Presentation.html` | slides | Intro slide deck for Day 1 |
| `guides/` | student guides | Step-by-step copy-paste guides (HTML + PDF) for each activity |

All notebooks are designed to run in **Google Colab**. Run cells top to bottom with **Shift + Enter**.

### Student guides (PDF)

Printable, beginner-friendly walkthroughs with the exact code to copy-paste:

- `guides/Activity1_Guide.pdf` — Data Science with Google Colab
- `guides/Activity2_Guide.pdf` — Web Scraping with Python
- `guides/Activity3_Guide.pdf` — Exploratory Data Analysis

The matching `.html` versions can be re-printed to PDF (Ctrl + P → Save as PDF) after any edit.

---

## Activity 1 — Data Science with Google Colab

Connect a **Google Form** (with linked Sheet) to Colab and turn live survey responses into charts.

**Flow:** make a short Google Form → collect a few responses → copy the Sheet ID →
connect Colab → build charts.

**What it covers:** `gspread`/`google-auth` connection, Google login (`auth.authenticate_user()`),
pulling sheet data into pandas, then bar chart, pie chart, two-question crosstab, and a full
pie-chart dashboard. The chart question is selected with a single `question_column` variable.

**Requirements per participant:**
- Their **own** Google Form with a linked response Sheet, filled out 5–6 times.
- The Colab Google account must be the **same account that owns the form**.
- Paste your own `SHEET_ID` into Step 4.

---

## Activity 2 — Web Scraping with Python

Two parts:

- **Part A — Live website:** scrape current Hacker News headlines with `requests` +
  `BeautifulSoup` (selector `.titleline > a`), build a table, then analyze headline length
  (histogram) and most-common words (bar chart).
- **Part B — Local dataset:** upload `car_data.html`, use `pd.read_html` to read all three
  tables (weather, schools, tourism), then build a six-chart analysis dashboard.

**Requirement:** upload `car_data.html` into the Colab file panel before Step 8.

---

## Activity 3 — Exploratory Data Analysis (EDA)

Picks up the **tourism table** from `car_data.html` and runs a full EDA:
load → data types & `describe` → missing/duplicate checks → categorical breakdowns →
key metrics → group comparisons (province & type) → top/bottom performers →
correlation heatmap → six-chart seaborn dashboard → written findings.

**Requirement:** upload `car_data.html` first (the notebook re-scrapes it so it runs standalone).

---

## The dataset — `car_data.html`

**Simulated sample data** for the Cordillera Administrative Region, created for training.
The numbers are realistic but invented — they are **not** official statistics. Three tables:

| Table | Rows | Key columns |
|-------|------|-------------|
| Weather Stations | 46 | Temperature_C, Humidity_pct, Rainfall_mm, Condition, Elevation_m |
| Schools | 50 | Type, Enrollment, Teachers, Student_Teacher_Ratio, Year_Established |
| Tourism Sites | 40 | Type, Annual_Visitors, Entry_Fee_PHP, Rating, Accessibility |

Because the tourism numbers are randomly generated, correlations come out near zero — which
Activity 3 uses as a deliberate teaching point about reading correlations honestly.

---

## Python libraries used

`pandas`, `matplotlib`, `seaborn`, `numpy`, `requests`, `beautifulsoup4`,
`gspread`, `google-auth` (Colab installs these via `!pip install` inside the notebooks).

## Teaching notes

- Notebook instructions are bilingual (English + Tagalog).
- Always state clearly whether data is **real or simulated** — repeated throughout.
- Remind participants to check a site's terms before scraping it (Activity 2).
