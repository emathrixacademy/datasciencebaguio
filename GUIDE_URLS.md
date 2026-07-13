# Guide URLs (Railway) — paste into Google Classroom

Base: `https://datasciencebaguio-production.up.railway.app`
The `/day1/`, `/day2/`, `/day3/` URL slugs are **unchanged** — only the page CONTENT reads Week 1/2/3.

## Every guide file found

`ls day1/guides day2/guides day3/guides`:

| Week | Activity | Guide file | Railway URL |
|------|----------|-----------|-------------|
| 1 | Activity 1 — Data Science (Form → Colab) | `day1/guides/Activity1_Guide.html` | https://datasciencebaguio-production.up.railway.app/day1/guides/Activity1_Guide.html |
| 1 | Activity 2 — Web Scraping + Cleaning | `day1/guides/Activity2_Guide.html` | https://datasciencebaguio-production.up.railway.app/day1/guides/Activity2_Guide.html |
| 1 | Activity 3 — Exploratory Data Analysis (EDA) | `day1/guides/Activity3_Guide.html` | https://datasciencebaguio-production.up.railway.app/day1/guides/Activity3_Guide.html |
| 2 | Activity 1 — Stock Analysis | `day2/guides/Activity1_n8n_Pipeline.html` | https://datasciencebaguio-production.up.railway.app/day2/guides/Activity1_n8n_Pipeline.html |
| 2 | Activity 2 — Signature Detection | `day2/guides/Activity2_ModelTraining_Guide.pdf` | https://datasciencebaguio-production.up.railway.app/day2/guides/Activity2_ModelTraining_Guide.pdf |
| 3 | Capstone — Form to AI | `day3/guides/Capstone_Guide.html` | https://datasciencebaguio-production.up.railway.app/day3/guides/Capstone_Guide.html |

> All guides also exist as `.pdf` (same path, `.pdf` extension) for offline download — e.g.
> `.../day1/guides/Activity1_Guide.pdf`. The `.pdf` is a static file: it **cannot** run JavaScript, so it is
> **not** tracked and **not** gated. For the tracked + gated experience, link the **`.html`** guide URL.

## Ready-to-paste "Guide:" lines (per the assignment-append request)

Append these to each existing assignment's Instructions (both classes), keeping existing text:

- **Week 1 — Activity 1:** `Guide: https://datasciencebaguio-production.up.railway.app/day1/guides/Activity1_Guide.html  (You'll sign in once, then it opens the guide.)`
- **Week 1 — Activity 2:** `Guide: https://datasciencebaguio-production.up.railway.app/day1/guides/Activity2_Guide.html`
- **Week 1 — Activity 3:** `Guide: https://datasciencebaguio-production.up.railway.app/day1/guides/Activity3_Guide.html`
- **Week 2 — Activity 1:** `Guide: https://datasciencebaguio-production.up.railway.app/day2/guides/Activity1_n8n_Pipeline.html`
- **Week 2 — Activity 2:** `Guide: https://datasciencebaguio-production.up.railway.app/day2/guides/Activity2_ModelTraining_Guide.pdf`
- **Week 3 — Capstone:** `Guide: https://datasciencebaguio-production.up.railway.app/day3/guides/Capstone_Guide.html`

## Confirmation

**(a) Study-session tracking JS** — every guide **HTML** page now includes
`../../assets/study-tracker.js` (verified on all 6 HTML guides). The Week 2 / Activity 2 guide exists only as a
**PDF** (`Activity2_ModelTraining_Guide.pdf`); a PDF cannot run JS, so tracking there happens on the Week 2
page and the Colab notebook instead.

**(b) Gate return-redirect** — every guide HTML page now includes `../../assets/gate-guard.js`, which, over
http(s), bounces a **logged-out** visitor to `/index.html?return=<this guide path>`. The sign-in gate
(`index.html`) reads the `?return=` value (same-origin paths only) and, after sign-in — or immediately if the
device is already signed in — lands the student **back on that exact guide**. The guard is a no-op under
`file://`, so headless PDF regeneration is unaffected (all guide PDFs still render multi-page).

> **Note on Google Classroom:** I can't operate the Classroom browser UI from here, so I could not click
> *Edit assignment → append → Save* on the live assignments. The exact append lines are provided above so you
> (or a browser session) can paste them into each of the 6 assignments in both classes.
