# Sequential Activity Gating — Notes

eMathrix Education · Data Science & Data Analytics (for PUP Santa Rosa students).

## Activity key map & unlock order

Readings are **never** gated. Only the activities gate, in this order — each unlocks the next:

| Key | Activity |
|-----|----------|
| `w1a1` | Week 1 · Activity 1 — Data Science (Form → Colab) |
| `w1a2` | Week 1 · Activity 2 — Web Scraping / Observe & Count |
| `w1a3` | Week 1 · Activity 3 — Exploratory Data Analysis (EDA) |
| `w2a1` | Week 2 · Activity 1 — Stock Analysis |
| `w2a2` | Week 2 · Activity 2 — Signature Detection |
| `w3cap` | Week 3 · Capstone — Form to AI |

An activity is **unlocked** only when **every prior key** in this order has a submission.

## How a submission is recorded (completion)

Completion = the student pastes **their work's Google Drive/Colab link** into the box at the bottom of
the activity and clicks Submit. Client (`assets/gating.js`) → `POST /api/submit {activity_key, link, email, name}`.
Server validates the link is `http(s)` (warns but still accepts if it's not a Drive/Colab link), then
**upserts** one row per `(student_email, activity_key)` into the `submissions` table and returns
`{ok:true, unlocked_next}`. The next activity unlocks live on the page and persists server-side.

DB (auto-created on boot, like the other tables):
`submissions(id, student_email, student_name, activity_key, submitted_link, submitted_at, ip, city, country)`
with `UNIQUE(student_email, activity_key)`; plus a `student_progress` view (completed keys per email).

## Server-side enforcement (can't skip by editing the URL)

Activity "open" links don't point straight at Colab — they go through the server launcher
**`GET /go?key=<key>&e=<email>`**. The server recomputes the student's completed keys from the
`submissions` table and:
- if all priors are done → **302 redirect** to the real Colab URL;
- if a prior is missing → **302 redirect** to that week page with `?locked=<key>&need=<prior>`, which
  shows a themed notice *"Finish and submit [previous activity] first."*

So even if a student un-greys a card in devtools or types the `/go` URL, the **server** refuses out-of-order
launches. `GET /api/progress?email=` returns the caller's completed/unlocked keys so pages render the
correct lock state on load — this is **server-side state**, so it persists across reloads and on a second
device with the same signed-in identity.

> Inherent limit: a *public* Colab notebook URL typed directly is outside our control (external Google
> Colab). And submitting any valid link marks completion — that's the defined completion mechanism; the
> instructor sees every `submitted_link` for grading.

## No-DB fallback

If `DATABASE_URL` isn't attached, `/api/progress` and `/api/submit` return `{stored:false}`, `gating.js`
**does not lock anything** (shows everything + a small "progress not being saved" note), and `/go`
redirects straight to the activity. The class still runs — same philosophy as the existing attendance
`{stored:false}` behavior.

## Pull submissions for grading

Token-guarded (same `ADMIN_TOKEN` as the other admin exports):
```
GET /admin/submissions.csv?token=<ADMIN_TOKEN>
→ student_email, student_name, activity_key, submitted_link, submitted_at
```

## Fieldwork proof

Each activity guide now requires **photo AND video proof of real fieldwork** plus the **raw collected
data** as deliverables (pasted into the same submission box). No proof = not accepted (reduced desk-based
data only with the teacher's prior permission). See each guide's "Proof & Submit" block.

## Privacy

This is class-participation data under the **same DPA notice shown on the attendance gate**
(`index.html`). Submitted links + identity are recorded for grading only. Students are reminded in each
guide to collect only data people agree to give and to ask permission before photographing/recording people.
Keep `ADMIN_TOKEN` private.
