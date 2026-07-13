# eMathrix Education — Drive & Google Classroom Setup Checklist

**Data Science & Data Analytics** · Manual setup guide (you build the folders + Classrooms by hand).

**Canonical per-week Drive folders** (these match Google Classroom and the website):
- Week 1: https://drive.google.com/drive/folders/1KU0iJm5X_InzAx-r_M67oGqCOq2gECku
- Week 2: https://drive.google.com/drive/folders/1q6XNr2UT-uZybCjIDowSuCuPLnK9AYRH
- Week 3: https://drive.google.com/drive/folders/1yAMg_b0UAqKXff_PQoeDakTPazuSvNAG

You will build the **same tree twice** — once per section:

| Class | Name | Schedule |
|-------|------|----------|
| **A** | IT Electives 3 | Mon 5:00–8:00 PM · Thu 7:30 AM–1:30 PM & 2:00–8:00 PM |
| **B** | BSIT 3-2 / IT Elective 3 | Mon 2:00–5:00 PM · Fri 7:30 AM–1:30 PM & 2:00–5:00 PM |

> Repo file paths below are relative to the site root. "Portal (live)" links are the Railway-served
> dataset pages — students open them in a browser; you don't need to copy the HTML into Drive, but the
> **Download-CSV** button on each portal is what they use in Activity 3.

---

## PART A — Google Drive folder tree

Create this nested structure **inside the parent folder above**, once per class. Drop the listed
files into each **individual activity folder**.

### Per-activity file drop map

| Activity folder | Notebook(s) to upload | Guide(s) to upload | Dataset / link |
|-----------------|-----------------------|--------------------|----------------|
| **S1 / Activity 1 — Data Science** | `day1/notebooks/Activity1_DataScience_Colab.ipynb` | `day1/guides/Activity1_Guide.pdf` | **Class intake form (Step 1):** https://forms.gle/Z2AJpKTMx5CZcdFq7 — students answer this first; then they build their **own** Google Form → Sheet |
| **S1 / Activity 2 — Web Scraping + Cleaning** | `day1/notebooks/Activity2_WebScraping_Colab.ipynb` | `day1/guides/Activity2_Guide.pdf` | Portals (live): `/datasets/car_data` + practice `/datasets/car_data1`, `/car_data2`, `/car_data3` |
| **S1 / Activity 3 — Exploratory Data Analysis** | `day1/notebooks/Activity3_EDA_Colab.ipynb` | `day1/guides/Activity3_Guide.pdf` | Pick one portal → **Download CSV**: `/datasets/forest_data`, `/datasets/wildlife_data`, `/datasets/airquality_data` |
| **S2 / Activity 1 — Stock Analysis** | `day2/notebooks/Activity1_StockAnalysis_Colab.ipynb` | `day2/guides/Activity1_n8n_Pipeline.pdf` | Student's own Google Sheet (filled by the n8n + Polygon.io pipeline) |
| **S2 / Activity 2 — Signature Detection** | `day2/notebooks/Activity2_ImageClassifier_Colab.ipynb` | `day2/guides/Activity2_ModelTraining_Guide.pdf` | Teachable Machine model `.zip` + a Google Drive folder of document images |
| **S3 / Capstone — Form to AI** | `day3/notebooks/Capstone_FormToAI_Colab.ipynb` (+ optional puzzle: `Capstone_FormToAI_SCRAMBLED.ipynb`) | `day3/guides/Capstone_Guide.pdf` | Student's own Google Form (with image upload) → Sheet + Teachable Machine model |

### Folder tree — Class A (IT Electives 3)

```
IT Electives 3/
├── Week 1 — Foundations/
│   ├── Activity 1 — Data Science/
│   │     • Activity1_DataScience_Colab.ipynb
│   │     • Activity1_Guide.pdf
│   │     • (link) Class intake form → https://forms.gle/Z2AJpKTMx5CZcdFq7
│   ├── Activity 2 — Web Scraping + Cleaning/
│   │     • Activity2_WebScraping_Colab.ipynb
│   │     • Activity2_Guide.pdf
│   └── Activity 3 — Exploratory Data Analysis/
│         • Activity3_EDA_Colab.ipynb
│         • Activity3_Guide.pdf
├── Week 2 — Automation & AI/
│   ├── Activity 1 — Stock Analysis/
│   │     • Activity1_StockAnalysis_Colab.ipynb
│   │     • Activity1_n8n_Pipeline.pdf
│   └── Activity 2 — Signature Detection/
│         • Activity2_ImageClassifier_Colab.ipynb
│         • Activity2_ModelTraining_Guide.pdf
└── Week 3 — Capstone/
    └── Capstone — Form to AI/
          • Capstone_FormToAI_Colab.ipynb
          • Capstone_FormToAI_SCRAMBLED.ipynb  (optional puzzle)
          • Capstone_Guide.pdf
```

### Folder tree — Class B (BSIT 3-2 / IT Elective 3)

```
BSIT 3-2 — IT Elective 3/
├── Week 1 — Foundations/
│   ├── Activity 1 — Data Science/
│   │     • Activity1_DataScience_Colab.ipynb
│   │     • Activity1_Guide.pdf
│   │     • (link) Class intake form → https://forms.gle/Z2AJpKTMx5CZcdFq7
│   ├── Activity 2 — Web Scraping + Cleaning/
│   │     • Activity2_WebScraping_Colab.ipynb
│   │     • Activity2_Guide.pdf
│   └── Activity 3 — Exploratory Data Analysis/
│         • Activity3_EDA_Colab.ipynb
│         • Activity3_Guide.pdf
├── Week 2 — Automation & AI/
│   ├── Activity 1 — Stock Analysis/
│   │     • Activity1_StockAnalysis_Colab.ipynb
│   │     • Activity1_n8n_Pipeline.pdf
│   └── Activity 2 — Signature Detection/
│         • Activity2_ImageClassifier_Colab.ipynb
│         • Activity2_ModelTraining_Guide.pdf
└── Week 3 — Capstone/
    └── Capstone — Form to AI/
          • Capstone_FormToAI_Colab.ipynb
          • Capstone_FormToAI_SCRAMBLED.ipynb  (optional puzzle)
          • Capstone_Guide.pdf
```

### Build checklist (tick per class)

- [ ] Class A root folder created inside the parent
- [ ] Class A — Week 1 + its 3 activity subfolders, files dropped
- [ ] Class A — Week 2 + its 2 activity subfolders, files dropped
- [ ] Class A — Week 3 + Capstone subfolder, files dropped
- [ ] Class A — set each folder's sharing to **"Anyone with the link — Viewer"**
- [ ] Class B root folder created inside the parent
- [ ] Class B — Week 1 + its 3 activity subfolders, files dropped
- [ ] Class B — Week 2 + its 2 activity subfolders, files dropped
- [ ] Class B — Week 3 + Capstone subfolder, files dropped
- [ ] Class B — set each folder's sharing to **"Anyone with the link — Viewer"**

---

## PART B — Google Classroom

Create **two Classrooms** (one per section). Coursework **must be created manually** in the browser —
API/automation for Classroom coursework is unreliable, so use this as a copy/paste checklist.
For each class, create the **Topics** below, then add each **assignment** under its topic, and paste the
matching Drive folder link (from Part A) into the assignment's "Add → Google Drive" attachment.

### Class A — "IT Electives 3"

| Topic | Assignment title | Drive folder link (paste here) |
|-------|------------------|--------------------------------|
| Week 1 — Foundations | Reading — Foundations primer | ______________________ |
| Week 1 — Foundations | Activity 1 — Data Science (Step 1: intake form → Colab) | ______________________ |
| Week 1 — Foundations | Activity 2 — Web Scraping + Cleaning | ______________________ |
| Week 1 — Foundations | Activity 3 — Exploratory Data Analysis | ______________________ |
| Week 2 — Automation & AI | Reading — Automation & AI primer | ______________________ |
| Week 2 — Automation & AI | Activity 1 — Stock Analysis | ______________________ |
| Week 2 — Automation & AI | Activity 2 — Signature Detection | ______________________ |
| Week 3 — Capstone | Reading — Capstone primer | ______________________ |
| Week 3 — Capstone | Capstone — Form to AI | ______________________ |

### Class B — "BSIT 3-2 / IT Elective 3"

| Topic | Assignment title | Drive folder link (paste here) |
|-------|------------------|--------------------------------|
| Week 1 — Foundations | Reading — Foundations primer | ______________________ |
| Week 1 — Foundations | Activity 1 — Data Science (Step 1: intake form → Colab) | ______________________ |
| Week 1 — Foundations | Activity 2 — Web Scraping + Cleaning | ______________________ |
| Week 1 — Foundations | Activity 3 — Exploratory Data Analysis | ______________________ |
| Week 2 — Automation & AI | Reading — Automation & AI primer | ______________________ |
| Week 2 — Automation & AI | Activity 1 — Stock Analysis | ______________________ |
| Week 2 — Automation & AI | Activity 2 — Signature Detection | ______________________ |
| Week 3 — Capstone | Reading — Capstone primer | ______________________ |
| Week 3 — Capstone | Capstone — Form to AI | ______________________ |

### Classroom checklist (tick per class)

- [ ] Class A Classroom created, students invited
- [ ] Class A — 3 Topics created (Week 1 / 2 / 3)
- [ ] Class A — 9 coursework items added, Drive links pasted
- [ ] Class B Classroom created, students invited
- [ ] Class B — 3 Topics created (Week 1 / 2 / 3)
- [ ] Class B — 9 coursework items added, Drive links pasted

---

## Notes

- **Reading before activities:** each session opens with a **Reading primer**, then the activities in
  order. The intake form (https://forms.gle/Z2AJpKTMx5CZcdFq7) is **Step 1 of Week 1 / Activity 1**,
  after the Week 1 reading.
- **Live site:** the Railway site already links every notebook (Open-in-Colab) and guide; Drive is the
  offline/backup copy and the Classroom attachment source.
- **Datasets** stay on the live site (simulated CAR training data) — no need to copy them to Drive.
