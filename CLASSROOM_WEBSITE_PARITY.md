# Classroom ↔ Website Parity Check

PUP Santa Rosa · Data Science & Data Analytics. Google Classroom is the **source of truth**; the website
below is realigned to match it exactly. Applies identically to **both** classes:
- **Class 1:** Data Science & Analytics — IT Electives 3
- **Class 2:** Data Science & Analytics — BSIT 3-2 (IT Elective 3)

Reading is shown **first** on both the hub (`home.html`) and each week page, then the activities in the exact
order below.

## Week 1 — Foundations

| Item | Classroom shows | Website shows | Match? |
|------|-----------------|---------------|--------|
| Reading (first) | Foundations: What is Data Science & Data Analytics | Foundations: What is Data Science & Data Analytics (`day1/reading.html`, shown first) | YES |
| Activity 1 | Activity 1 — Data Science (Form → Colab) | Activity 1 — Data Science (Form → Colab) · Step 1 intake form, Step 2 Colab | YES |
| Activity 2 | Activity 2 — Web Scraping + Cleaning | Activity 2 — Web Scraping + Cleaning | YES |
| Activity 3 | Activity 3 — Exploratory Data Analysis (EDA) | Activity 3 — Exploratory Data Analysis (EDA) | YES |
| Intake form link | https://forms.gle/Z2AJpKTMx5CZcdFq7 | https://forms.gle/Z2AJpKTMx5CZcdFq7 (Activity 1 Step 1, home hub, notebook, guide) | YES |
| Week folder link | https://drive.google.com/drive/folders/1KU0iJm5X_InzAx-r_M67oGqCOq2gECku | Same link on `day1/index.html` + home hub "Week 1 Drive" | YES |

## Week 2 — Automation & AI

| Item | Classroom shows | Website shows | Match? |
|------|-----------------|---------------|--------|
| Reading (first) | Automation & AI: Pipelines and Machine Learning basics | Automation & AI: Pipelines and Machine Learning basics (`day2/reading.html`, shown first) | YES |
| Activity 1 | Activity 1 — Stock Analysis | Activity 1 — Stock Analysis | YES |
| Activity 2 | Activity 2 — Signature Detection | Activity 2 — Signature Detection | YES |
| Week folder link | https://drive.google.com/drive/folders/1q6XNr2UT-uZybCjIDowSuCuPLnK9AYRH | Same link on `day2/index.html` + home hub "Week 2 Drive" | YES |

> Note: the old "Activity 3 — Smart Mushroom Farm IoT App" card was **removed** from the Week 2 page so the
> website lists exactly the two activities Classroom shows. (The notebook/guide files remain in the repo,
> just unlinked, in case they're reused later.)

## Week 3 — Capstone

| Item | Classroom shows | Website shows | Match? |
|------|-----------------|---------------|--------|
| Reading (first) | Capstone: From Data Collection to AI, end to end | Capstone: From Data Collection to AI, end to end (`day3/reading.html`, shown first) | YES |
| Capstone activity | Capstone — Form to AI | Capstone — Form to AI (`day3/index.html`) | YES |
| Week folder link | https://drive.google.com/drive/folders/1yAMg_b0UAqKXff_PQoeDakTPazuSvNAG | Same link on `day3/index.html` + home hub "Week 3 Drive" | YES |

## Ordering parity (reading before activities)

| Page | Order shown | Match? |
|------|-------------|--------|
| `home.html` hub | Each week card: ① Reading → ② activities; plus intake-form CTA labeled "after the Week 1 reading" | YES |
| `day1/index.html` | "Start here — read first" (Reading + presentation) → "Then do the activities (in order)": Act 1 (Step 1 form → Step 2 Colab), Act 2, Act 3 | YES |
| `day2/index.html` | "Start here — read first" (Reading) → Activity 1 — Stock Analysis → Activity 2 — Signature Detection | YES |
| `day3/index.html` | "Start here — read first" (Reading) → "Then build the capstone" | YES |

## Automated checks

- `Day 1/2/3` labels remaining in site text: **none** (all relabeled to Week; `day1/` folder paths kept so old links/serve.json rewrites don't 404).
- Old DICT / Baguio / Cordillera **branding**: **none** (remaining "CAR/Cordillera/Baguio" strings are legitimate simulated **dataset content**, per the training-data disclaimer).
- Stale form links: **none** — the only intake form URL is `https://forms.gle/Z2AJpKTMx5CZcdFq7`.
- Week folder links: all three per-week Drive folders wired; no leftover parent-folder links in the week pages/hub.
- Old theme color `#4CAF50`: **none**.
- `/api/health`: responds `{ok:true, db:...}`; site serves with DB detached (session/attendance APIs return `{stored:false}`).

**Result: every parity row = YES. No NEEDS ATTENTION items.**
