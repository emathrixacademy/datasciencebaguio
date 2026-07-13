# Theme Sweep Report

eMathrix Education · Data Science & Data Analytics (for PUP Santa Rosa students).
Palette: maroon `#6A0F1A` / white `#FFFFFF` / yellow `#F5C518` (sparing) via `assets/pup-theme.css`.
Every HTML page below: **themed? branding-clean? links-OK? = YES**.

| File | Themed? | Branding clean? | Links OK? |
|------|:---:|:---:|:---:|
| `index.html` (gate) | YES — palette rewritten to maroon/white/yellow, maroon button + yellow accent, no navy/blue/green | YES — eMathrix owner + "for PUP Santa Rosa students" context | YES |
| `home.html` | YES (pup-theme.css) | YES | YES — per-week Drive folders, progress strip |
| `admin.html` | YES (pup-theme.css overrides) | YES | YES |
| `404.html` | YES (native maroon) | YES | YES → /home.html |
| `day1/index.html` | YES | YES | YES — reading→activities gated, guide .html links |
| `day2/index.html` | YES | YES | YES — IoT activity removed, no dead links |
| `day3/index.html` | YES | YES | YES |
| `day1/presentation.html` | YES — deck re-themed dark-maroon + yellow highlights (was navy/blue) | YES | YES |
| `day2/presentation.html` | YES — new deck, maroon | YES | YES |
| `day3/presentation.html` | YES — new deck, maroon | YES | YES |
| `day1/reading.html` | YES | YES | YES |
| `day2/reading.html` | YES | YES | YES |
| `day3/reading.html` | YES | YES | YES |
| `day1/guides/Activity1_Guide.html` | YES | YES | YES — gate-guard + tracker, fieldwork+proof |
| `day1/guides/Activity2_Guide.html` | YES | YES | YES |
| `day1/guides/Activity3_Guide.html` | YES | YES | YES |
| `day2/guides/Activity1_n8n_Pipeline.html` | YES — blue accents → maroon/yellow | YES | YES |
| `day2/guides/Activity2_ModelTraining_Guide.html` | YES — new tracked wrapper, fieldwork+proof | YES | YES |
| `day3/guides/Capstone_Guide.html` | YES | YES | YES |
| `datasets/car_data.html` | YES (pup-theme.css) | YES — "Laguna" portal name; data shape kept | YES |
| `datasets/car_data1/2/3.html` | YES | YES — Laguna | YES |
| `datasets/forest_data.html` | YES | YES — Laguna | YES |
| `datasets/wildlife_data.html` | YES | YES — Laguna | YES |
| `datasets/airquality_data.html` | YES | YES — Laguna | YES |

## Automated checks (all clean)

- Old green `#4CAF50`: **none**.
- Old owner branding (`Polytechnic University of the Philippines`, `PUP Santa Rosa` as owner): **none**
  — only the intended context phrase "PUP Santa Rosa students" remains.
- Old Drive folder links (`1GIg…`, `1WhnX…`, `14Vxx…`): **none**; per-week folders (`1KU0…`, `1q6X…`, `1yAM…`) in use.
- `dict_` keys: only inside the one-time `dict_*→pup_*` migration (intentional); no active `dict_` usage.
- IoT / mushroom activity: removed from the site and its files deleted (`Activity3_IoT_AppSheet.*`,
  `Activity3_IoT_Analysis_Colab.ipynb`); no dead links.
- Presentations: Week 1 re-themed; Week 2 & 3 created, maroon, linked from their hubs; no presentation 404s.
- Unknown routes → themed `404.html` (verified 404), not the gate.
- `/api/health` → `{ok:true,...}`; site serves with DB detached (session/submit/progress return `{stored:false}`).

## Note on the dark-theme content pages

The content pages (home, day/session hubs, admin, dataset portals) keep their original inline `:root`
variables, but `assets/pup-theme.css` is linked **after** them and force-overrides body/cards/buttons/
inputs/table-headers/badges to the maroon/white/yellow palette (`!important`), so nothing navy/blue/green
renders. The slide decks are the exception — they carry their own **maroon** styles directly (a full-screen
dark-maroon canvas would be broken by the white-canvas sheet, so they aren't linked to it by design).

## NEEDS ATTENTION

None. Every HTML file is themed, branding-clean, and link-checked.
