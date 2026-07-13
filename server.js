// PUP Santa Rosa — Data Science & Data Analytics — static site + attendance API (Express + Postgres)
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
app.set('trust proxy', true);            // Railway sits behind a proxy -> real client IP
app.use(express.json({ limit: '1mb' }));

const ROOT = __dirname;

// ---- Server-side attendance session (signed, HttpOnly cookie) ----
// Enforcement lives on the SERVER: content pages require a valid attendance cookie.
// localStorage is only a UX fast-path; it never grants access on its own.
const SESSION_COOKIE = 'pup_sess';
const SESSION_MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3h — matches the client idle auto-logout
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_TOKEN || 'pup-emathrix-dev-secret';
const b64u = (s) => Buffer.from(s).toString('base64url');

function signSession(email) {
  const payload = b64u(String(email || '')) + '.' + Date.now();
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payload = parts[0] + '.' + parts[1];
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(parts[2]); const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const issued = Number(parts[1]);
  if (!issued || (Date.now() - issued) > SESSION_MAX_AGE_MS) return null; // expired
  try { return Buffer.from(parts[0], 'base64url').toString() || 'ok'; } catch (e) { return null; }
}
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((c) => {
    const i = c.indexOf('='); if (i < 0) return;
    out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
function setSessionCookie(req, res, email) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https'; // Secure on https (Railway), not local http
  const bits = [
    `${SESSION_COOKIE}=${signSession(email)}`,
    'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${Math.floor(SESSION_MAX_AGE_MS / 1000)}`,
  ];
  if (secure) bits.push('Secure');
  res.append('Set-Cookie', bits.join('; '));
}
function clearSessionCookie(res) {
  res.append('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

// ================= ADMIN AUTH (constant-time, fail-closed) =================
// Admin access requires EITHER a valid signed admin cookie (from /admin/login with the
// instructor email+password) OR a correct ADMIN_TOKEN (for curl/CSV). No valid credential ⇒
// 403 and NO data, on EVERY admin data request. Credentials are stored as SHA-256 (no plaintext
// in the repo); override any of these via Railway env vars in production.
const ADMIN_COOKIE = 'pup_admin';
const ADMIN_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8h admin session
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.SESSION_SECRET || process.env.ADMIN_TOKEN || 'pup-emathrix-dev-secret';
const ADMIN_EMAIL_SHA = (process.env.ADMIN_EMAIL_SHA256 || '4846660c32484aedc0ccf0f25dcaae49e8c68a0c874d2881ea133ca3d246457e').toLowerCase();
const ADMIN_PW_SHA = (process.env.ADMIN_PASSWORD_SHA256 || '4fa2ecd8a9ebf4e2cdd0f5d8d644e9bd7e0fd993a716efb420747cdbd43676b1').toLowerCase();

const sha256hex = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
function ctEqHex(a, b) { // constant-time compare of two equal-length hex strings
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch (e) { return false; }
}
function signAdmin() {
  const payload = 'admin.' + Date.now();
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}
function verifyAdminCookie(tok) {
  if (!tok || typeof tok !== 'string') return false;
  const p = tok.split('.'); if (p.length !== 3 || p[0] !== 'admin') return false;
  const payload = p[0] + '.' + p[1];
  const exp = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(p[2]); const b = Buffer.from(exp);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const iss = Number(p[1]);
  return !!iss && (Date.now() - iss) <= ADMIN_MAX_AGE_MS;
}
function adminTokenOk(req) {
  // Fail closed: if no ADMIN_TOKEN is configured, the token path grants nothing.
  if (!process.env.ADMIN_TOKEN) return false;
  const t = (req.query.token || req.get('x-admin-token') || '').toString().trim();
  if (!t) return false;
  return ctEqHex(sha256hex(t), sha256hex(process.env.ADMIN_TOKEN)); // hash → equal length → constant-time
}
// Gate for every admin DATA route. Returns true if authorized; else sends 403 and returns false.
function requireAdmin(req, res) {
  if (verifyAdminCookie(parseCookies(req)[ADMIN_COOKIE])) return true;
  if (adminTokenOk(req)) return true;
  res.status(403).json({ error: 'forbidden' });
  return false;
}
function setAdminCookie(req, res) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const bits = [`${ADMIN_COOKIE}=${signAdmin()}`, 'HttpOnly', 'Path=/', 'SameSite=Lax',
    `Max-Age=${Math.floor(ADMIN_MAX_AGE_MS / 1000)}`];
  if (secure) bits.push('Secure');
  res.append('Set-Cookie', bits.join('; '));
}

// ---- Backward-compatible short URLs (datasets moved under /datasets) ----
const REWRITES = {
  // old short URLs (keep working so already-downloaded notebooks don't break)
  '/car_data': '/datasets/car_data.html',
  '/car_data1': '/datasets/car_data1.html',
  '/car_data2': '/datasets/car_data2.html',
  '/car_data3': '/datasets/car_data3.html',
  '/forest_data': '/datasets/forest_data.html',
  '/wildlife_data': '/datasets/wildlife_data.html',
  '/airquality_data': '/datasets/airquality_data.html',
  // new student-facing Laguna aliases -> same underlying files (data shape unchanged)
  '/laguna_data': '/datasets/car_data.html',
  '/laguna_data1': '/datasets/car_data1.html',
  '/laguna_data2': '/datasets/car_data2.html',
  '/laguna_data3': '/datasets/car_data3.html',
  '/datasets/laguna_data': '/datasets/car_data.html',
  '/datasets/laguna_data1': '/datasets/car_data1.html',
  '/datasets/laguna_data2': '/datasets/car_data2.html',
  '/datasets/laguna_data3': '/datasets/car_data3.html',
};

// ---- Database ----
const hasDb = !!process.env.DATABASE_URL;
const pool = hasDb
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    })
  : null;

async function initDb() {
  if (!pool) {
    console.warn('[attendance] DATABASE_URL not set — sign-ins will NOT be stored yet.');
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      full_name TEXT,
      email TEXT,
      contact TEXT,
      client_timestamp TEXT,
      sign_date TEXT,
      sign_time TEXT,
      ip TEXT,
      city TEXT,
      region TEXT,
      country TEXT,
      user_agent TEXT
    );
  `);
  // Section + Student Number (added later; existing rows get NULL). Auto-migrate on boot.
  await pool.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS section TEXT;`);
  await pool.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS student_no TEXT;`);

  // Event-based study-time tracking (how long / how often each student uses the system).
  await pool.query(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id SERIAL PRIMARY KEY,
      student_email TEXT,
      student_name TEXT,
      session_start TIMESTAMPTZ DEFAULT now(),
      session_end TIMESTAMPTZ,
      last_heartbeat TIMESTAMPTZ DEFAULT now(),
      duration_seconds INT,
      page TEXT,
      ip TEXT,
      city TEXT,
      country TEXT
    );
  `);

  // Sequential activity gating: one row per (student, activity) once they submit their work link.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      student_email TEXT,
      student_name TEXT,
      activity_key TEXT,
      submitted_link TEXT,
      submitted_at TIMESTAMPTZ DEFAULT now(),
      ip TEXT,
      city TEXT,
      country TEXT,
      UNIQUE (student_email, activity_key)
    );
  `);

  // Which activity_keys each student has completed.
  await pool.query(`
    CREATE OR REPLACE VIEW student_progress AS
    SELECT student_email,
           array_agg(DISTINCT activity_key) AS completed_keys,
           COUNT(DISTINCT activity_key) AS completed_count
    FROM submissions
    GROUP BY student_email;
  `);

  // Per-student rollup for grading. If a student abandons a tab without firing 'end'
  // (session_end stays NULL), we fall back to (last_heartbeat - session_start) so idle
  // time after the last heartbeat (which stops after ~5 min of no visible tab) doesn't
  // inflate the total. GREATEST(0, ...) guards against clock skew.
  await pool.query(`
    CREATE OR REPLACE VIEW study_totals AS
    SELECT
      student_email,
      MAX(student_name) AS student_name,
      SUM(COALESCE(duration_seconds,
                   GREATEST(0, EXTRACT(EPOCH FROM (last_heartbeat - session_start)))::int)) AS total_seconds,
      COUNT(*) AS session_count,
      MIN(session_start) AS first_seen,
      MAX(COALESCE(session_end, last_heartbeat)) AS last_seen,
      COUNT(DISTINCT (session_start AT TIME ZONE 'Asia/Manila')::date) AS active_days
    FROM study_sessions
    GROUP BY student_email;
  `);

  // Canonical Section / Student No. / name per email (latest sign-in wins). Joined by the admin tabs.
  await pool.query(`
    CREATE OR REPLACE VIEW student_identity AS
    SELECT DISTINCT ON (email) email, full_name, section, student_no
    FROM attendance WHERE email IS NOT NULL AND email <> ''
    ORDER BY email, created_at DESC;
  `);

  console.log('[attendance] tables + views ready (section/student_no migrated).');
}

// ---- API: record a sign-in ----
app.post('/api/attendance', async (req, res) => {
  const b = req.body || {};
  const serverIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket.remoteAddress || '';
  const ip = b.ip || serverIp;

  if (!b.fullName || !b.email) {
    return res.status(400).json({ status: 'error', message: 'fullName and email are required' });
  }
  // Issue the server-side attendance session cookie (this is what actually unlocks content).
  setSessionCookie(req, res, b.email);
  if (!pool) {
    // Site still works before the DB is attached (cookie set, row not stored).
    return res.json({ status: 'ok', stored: false, note: 'no database configured yet' });
  }
  const section = b.section || '';
  const studentNo = b.studentNo || b.student_no || '';
  try {
    // Backfill: give this student's EXISTING rows the section/student_no when provided (returning
    // students who signed in before these fields existed get their record completed by email).
    if (section || studentNo) {
      await pool.query(
        `UPDATE attendance SET
           section = COALESCE(NULLIF($2,''), section),
           student_no = COALESCE(NULLIF($3,''), student_no)
         WHERE email = $1`,
        [b.email, section, studentNo]
      );
    }
    await pool.query(
      `INSERT INTO attendance
        (full_name, email, contact, section, student_no, client_timestamp, sign_date, sign_time, ip, city, region, country, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [b.fullName, b.email, b.contact || '', section, studentNo, b.timestamp || '', b.date || '', b.time || '',
       ip, b.city || '', b.region || '', b.country || '', b.userAgent || '']
    );
    res.json({ status: 'ok', stored: true });
  } catch (e) {
    console.error('[attendance] insert failed:', e.message);
    res.status(500).json({ status: 'error', message: 'could not store sign-in' });
  }
});

// Re-establish the session cookie for a returning device (localStorage fast-path) without re-typing.
// Trusts the identity already captured at the gate; does NOT insert a new attendance row.
app.post('/api/session/resume', (req, res) => {
  const email = (req.body || {}).email;
  if (!email) return res.status(400).json({ ok: false, message: 'email required' });
  setSessionCookie(req, res, email);
  res.json({ ok: true });
});

// Clear the session cookie (called on idle auto-logout) so attendance stays honest.
app.post('/api/session/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ---- Study-session tracking (how long / how often a student uses the system) ----
function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket.remoteAddress || '';
}

// Start a study session on page load (after the student is identified).
app.post('/api/session/start', async (req, res) => {
  const b = req.body || {};
  if (!pool) return res.json({ status: 'ok', stored: false });
  try {
    const { rows } = await pool.query(
      `INSERT INTO study_sessions (student_email, student_name, page, ip, city, country)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [b.email || '', b.name || '', b.page || '', b.ip || clientIp(req), b.city || '', b.country || '']
    );
    res.json({ status: 'ok', stored: true, session_id: rows[0].id });
  } catch (e) {
    console.error('[study] start failed:', e.message);
    res.status(500).json({ status: 'error' });
  }
});

// Heartbeat every 60s while the tab is visible.
app.post('/api/session/heartbeat', async (req, res) => {
  const id = (req.body || {}).session_id;
  if (!pool) return res.json({ status: 'ok', stored: false });
  if (!id) return res.status(400).json({ status: 'error', message: 'session_id required' });
  try {
    await pool.query('UPDATE study_sessions SET last_heartbeat = now() WHERE id = $1', [id]);
    res.json({ status: 'ok', stored: true });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

// End a session on tab close/hide (sent via navigator.sendBeacon).
app.post('/api/session/end', async (req, res) => {
  const id = (req.body || {}).session_id;
  if (!pool) return res.json({ status: 'ok', stored: false });
  if (!id) return res.status(400).json({ status: 'error', message: 'session_id required' });
  try {
    await pool.query(
      `UPDATE study_sessions
         SET session_end = now(),
             last_heartbeat = now(),
             duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (now() - session_start)))::int
       WHERE id = $1 AND session_end IS NULL`,
      [id]
    );
    res.json({ status: 'ok', stored: true });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

// ---- Sequential activity gating ----
// The unlock order and each activity's Colab target + home page (for the "locked" redirect).
const ACTIVITY_ORDER = ['w1a1', 'w1a2', 'w1a3', 'w2a1', 'w2a2', 'w3cap'];
const GH = 'https://colab.research.google.com/github/emathrixacademy/datasciencebaguio/blob/main';
const ACTIVITY_TARGET = {
  w1a1: `${GH}/day1/notebooks/Activity1_DataScience_Colab.ipynb`,
  w1a2: `${GH}/day1/notebooks/Activity2_WebScraping_Colab.ipynb`,
  w1a3: `${GH}/day1/notebooks/Activity3_EDA_Colab.ipynb`,
  w2a1: `${GH}/day2/notebooks/Activity1_StockAnalysis_Colab.ipynb`,
  w2a2: `${GH}/day2/notebooks/Activity2_ImageClassifier_Colab.ipynb`,
  w3cap: `${GH}/day3/notebooks/Capstone_FormToAI_Colab.ipynb`,
};
const ACTIVITY_PAGE = {
  w1a1: '/day1/index.html', w1a2: '/day1/index.html', w1a3: '/day1/index.html',
  w2a1: '/day2/index.html', w2a2: '/day2/index.html', w3cap: '/day3/index.html',
};

// Given a set of completed keys, the keys that are currently unlocked (all priors done).
function unlockedKeys(completed) {
  const done = new Set(completed || []);
  const unlocked = [];
  for (let i = 0; i < ACTIVITY_ORDER.length; i++) {
    const k = ACTIVITY_ORDER[i];
    const priorsDone = ACTIVITY_ORDER.slice(0, i).every(p => done.has(p));
    if (priorsDone) unlocked.push(k);
  }
  return unlocked;
}

async function completedFor(email) {
  if (!pool || !email) return [];
  const { rows } = await pool.query(
    'SELECT DISTINCT activity_key FROM submissions WHERE student_email = $1', [email]);
  return rows.map(r => r.activity_key);
}

// Record a submission (the student's Drive/Colab link) -> marks the activity complete.
app.post('/api/submit', async (req, res) => {
  const b = req.body || {};
  const key = b.activity_key;
  const link = (b.link || '').trim();
  if (!ACTIVITY_ORDER.includes(key)) return res.status(400).json({ ok: false, message: 'bad activity_key' });
  const looksUrl = /^https?:\/\/.+/i.test(link);
  const looksDriveOrColab = /(drive\.google\.com|colab\.research\.google\.com|docs\.google\.com)/i.test(link);
  if (!looksUrl) return res.status(400).json({ ok: false, message: 'Please paste a valid http(s) link.' });
  if (!pool) return res.json({ ok: true, stored: false, unlocked_next: null, warn: !looksDriveOrColab });
  try {
    await pool.query(
      `INSERT INTO submissions (student_email, student_name, activity_key, submitted_link, ip, city, country)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (student_email, activity_key)
       DO UPDATE SET submitted_link = EXCLUDED.submitted_link, submitted_at = now()`,
      [b.email || '', b.name || '', key, link, b.ip || clientIp(req), b.city || '', b.country || '']
    );
    const completed = await completedFor(b.email || '');
    const idx = ACTIVITY_ORDER.indexOf(key);
    const next = ACTIVITY_ORDER[idx + 1] || null;
    res.json({ ok: true, stored: true, unlocked_next: next, completed,
               warn: !looksDriveOrColab ? 'Link accepted, but it is not a Google Drive/Colab link.' : null });
  } catch (e) {
    console.error('[submit] failed:', e.message);
    res.status(500).json({ ok: false });
  }
});

// A student's progress (completed + currently-unlocked keys). Identity via ?email= (from the gate).
app.get('/api/progress', async (req, res) => {
  const email = req.query.email || '';
  if (!pool) return res.json({ ok: true, stored: false, completed: [], unlocked: ACTIVITY_ORDER });
  try {
    const completed = await completedFor(email);
    res.json({ ok: true, stored: true, completed, unlocked: unlockedKeys(completed), order: ACTIVITY_ORDER });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Server-enforced launcher: /go?key=w1a2&e=<email>. Opens the activity only if all priors are done,
// so editing the URL / un-hiding a card in the browser can't skip the order. (Typing a public Colab
// URL directly is outside our control — that's inherent to external Colab; see GATING_NOTES.md.)
app.get('/go', async (req, res) => {
  const key = req.query.key;
  const email = req.query.e || '';
  if (!ACTIVITY_ORDER.includes(key)) return res.status(404).send('Unknown activity');
  // No DB -> don't lock anyone out (mirror the {stored:false} philosophy).
  if (!pool) return res.redirect(ACTIVITY_TARGET[key]);
  try {
    const completed = await completedFor(email);
    if (unlockedKeys(completed).includes(key)) return res.redirect(ACTIVITY_TARGET[key]);
    // Find earliest incomplete prior and bounce there with a themed notice.
    const idx = ACTIVITY_ORDER.indexOf(key);
    const firstMissing = ACTIVITY_ORDER.slice(0, idx).find(p => !completed.includes(p)) || key;
    return res.redirect(`${ACTIVITY_PAGE[firstMissing]}?locked=${key}&need=${firstMissing}`);
  } catch (e) {
    return res.redirect(ACTIVITY_TARGET[key]); // fail open, don't strand students
  }
});

// ---- Admin login / logout (email + password → signed admin cookie) ----
app.post('/admin/login', (req, res) => {
  const b = req.body || {};
  const email = String(b.email || '').trim().toLowerCase();
  const pw = String(b.password || '');
  const emailOk = ctEqHex(sha256hex(email), ADMIN_EMAIL_SHA);
  const pwOk = ctEqHex(sha256hex(pw), ADMIN_PW_SHA);
  if (!(emailOk && pwOk)) return res.status(401).json({ ok: false, error: 'invalid credentials' });
  setAdminCookie(req, res);
  res.json({ ok: true });
});
app.post('/admin/logout', (req, res) => {
  res.append('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

// ================= Admin data: shared filtering, CSV, rows =================
const csvEsc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function sendCsv(res, filename, cols, rows) {
  const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => csvEsc(r[c])).join(','))).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}
// Filters come from query (JSON+CSV) or body (delete) so exports/deletes match the on-screen view.
function readFilters(src) {
  return {
    q: (src.q || '').toString().trim(),
    section: (src.section || '').toString().trim(),
    week: (src.week || '').toString().trim(),         // 'Week 1'|'Week 2'|'Week 3'|''
    activity: (src.activity || '').toString().trim(), // 'w1a1'… | ''
  };
}
const WEEK_PREFIX = { 'Week 1': 'w1', 'Week 2': 'w2', 'Week 3': 'w3' };

async function attendanceRows(f) {
  const w = []; const p = [];
  if (f.q) { p.push('%' + f.q + '%'); w.push(`(full_name ILIKE $${p.length} OR email ILIKE $${p.length} OR COALESCE(student_no,'') ILIKE $${p.length})`); }
  if (f.section) { p.push(f.section); w.push(`COALESCE(section,'') = $${p.length}`); }
  const clause = w.length ? 'WHERE ' + w.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT id, created_at, full_name, email, contact, COALESCE(section,'') AS section, COALESCE(student_no,'') AS student_no,
            sign_date, sign_time, ip, city, region, country
       FROM attendance ${clause} ORDER BY created_at DESC`, p);
  return rows;
}
async function studyRows(f) {
  const w = []; const p = [];
  if (f.q) { p.push('%' + f.q + '%'); w.push(`(COALESCE(i.full_name, st.student_name,'') ILIKE $${p.length} OR st.student_email ILIKE $${p.length} OR COALESCE(i.student_no,'') ILIKE $${p.length})`); }
  if (f.section) { p.push(f.section); w.push(`COALESCE(i.section,'') = $${p.length}`); }
  const clause = w.length ? 'WHERE ' + w.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT st.student_email, COALESCE(i.full_name, st.student_name) AS student_name,
            COALESCE(i.section,'') AS section, COALESCE(i.student_no,'') AS student_no,
            st.total_seconds, round(st.total_seconds/60.0,1) AS total_minutes,
            st.session_count, st.active_days, st.first_seen, st.last_seen
       FROM study_totals st LEFT JOIN student_identity i ON i.email = st.student_email
       ${clause} ORDER BY st.total_seconds DESC NULLS LAST`, p);
  return rows;
}
async function submissionRows(f) {
  const w = []; const p = [];
  if (f.q) { p.push('%' + f.q + '%'); w.push(`(COALESCE(i.full_name, s.student_name,'') ILIKE $${p.length} OR s.student_email ILIKE $${p.length} OR COALESCE(i.student_no,'') ILIKE $${p.length})`); }
  if (f.section) { p.push(f.section); w.push(`COALESCE(i.section,'') = $${p.length}`); }
  if (f.week && WEEK_PREFIX[f.week]) { p.push(WEEK_PREFIX[f.week] + '%'); w.push(`s.activity_key LIKE $${p.length}`); }
  if (f.activity) { p.push(f.activity); w.push(`s.activity_key = $${p.length}`); }
  const clause = w.length ? 'WHERE ' + w.join(' AND ') : '';
  const { rows } = await pool.query(
    `SELECT s.id, s.student_email, COALESCE(i.full_name, s.student_name) AS student_name,
            COALESCE(i.section,'') AS section, COALESCE(i.student_no,'') AS student_no,
            s.activity_key, s.submitted_link, s.submitted_at
       FROM submissions s LEFT JOIN student_identity i ON i.email = s.student_email
       ${clause} ORDER BY s.submitted_at DESC`, p);
  return rows;
}
async function totalCount(tab) {
  const t = tab === 'attendance' ? 'attendance' : tab === 'study' ? 'study_totals' : 'submissions';
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
  return rows[0].n;
}

// ---- Admin JSON feeds (guarded; filtered; return total for "showing X of Y") ----
app.get('/admin/attendance.json', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.json({ rows: [], count: 0, total: 0 });
  try { const rows = await attendanceRows(readFilters(req.query)); res.json({ rows, count: rows.length, total: await totalCount('attendance') }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/admin/study.json', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.json({ rows: [], count: 0, total: 0 });
  try { const rows = await studyRows(readFilters(req.query)); res.json({ rows, count: rows.length, total: await totalCount('study') }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/admin/submissions.json', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.json({ rows: [], count: 0, total: 0 });
  try { const rows = await submissionRows(readFilters(req.query)); res.json({ rows, count: rows.length, total: await totalCount('submissions') }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Admin DELETE: single (by id/email) + bulk-by-filter (permanent hard delete) ----
app.post('/admin/delete', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: 'no database configured' });
  const b = req.body || {};
  const tab = b.tab, mode = b.mode, confirm = (b.confirm || '').toString();
  const f = readFilters(b);
  try {
    if (mode === 'single') {
      if (tab === 'attendance') { const r = await pool.query('DELETE FROM attendance WHERE id = $1', [b.id]); return res.json({ ok: true, deleted: r.rowCount }); }
      if (tab === 'submissions') { const r = await pool.query('DELETE FROM submissions WHERE id = $1', [b.id]); return res.json({ ok: true, deleted: r.rowCount }); }
      if (tab === 'study') { const r = await pool.query('DELETE FROM study_sessions WHERE student_email = $1', [b.email]); return res.json({ ok: true, deleted: r.rowCount }); }
      return res.status(400).json({ error: 'bad tab' });
    }
    if (mode === 'bulk') {
      const hasFilter = !!(f.q || f.section || f.week || f.activity);
      // Guardrail: whole-table wipe needs "DELETE ALL"; any filtered delete needs "DELETE".
      if (!hasFilter && confirm !== 'DELETE ALL') return res.status(400).json({ error: 'type "DELETE ALL" to remove the whole table' });
      if (hasFilter && confirm !== 'DELETE') return res.status(400).json({ error: 'type "DELETE" to confirm' });
      if (tab === 'attendance') { const ids = (await attendanceRows(f)).map(r => r.id); if (!ids.length) return res.json({ ok: true, deleted: 0 }); const r = await pool.query('DELETE FROM attendance WHERE id = ANY($1)', [ids]); return res.json({ ok: true, deleted: r.rowCount }); }
      if (tab === 'submissions') { const ids = (await submissionRows(f)).map(r => r.id); if (!ids.length) return res.json({ ok: true, deleted: 0 }); const r = await pool.query('DELETE FROM submissions WHERE id = ANY($1)', [ids]); return res.json({ ok: true, deleted: r.rowCount }); }
      if (tab === 'study') { const emails = (await studyRows(f)).map(r => r.student_email); if (!emails.length) return res.json({ ok: true, deleted: 0 }); const r = await pool.query('DELETE FROM study_sessions WHERE student_email = ANY($1)', [emails]); return res.json({ ok: true, deleted: r.rowCount }); }
      return res.status(400).json({ error: 'bad tab' });
    }
    return res.status(400).json({ error: 'bad mode' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- Admin CSV exports (filtered to match the on-screen view; include section + student_no) ----
app.get('/admin/submissions.csv', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).send('No database configured');
  try { sendCsv(res, 'submissions.csv',
    ['student_email','student_name','section','student_no','activity_key','submitted_link','submitted_at'],
    await submissionRows(readFilters(req.query))); }
  catch (e) { res.status(500).send('error: ' + e.message); }
});

// ---- Admin: purge test/junk rows so they don't pollute grading (token-guarded) ----
// Deletes rows whose email looks like a test address (default: ends with @example.com).
// Pass ?email=someone@x to purge a specific student instead. Affects attendance,
// study_sessions, and submissions.
app.post('/admin/purge-test', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).json({ error: 'no database configured' });
  const exact = req.query.email;
  try {
    let att, ses, sub;
    if (exact) {
      att = await pool.query('DELETE FROM attendance WHERE email = $1', [exact]);
      ses = await pool.query('DELETE FROM study_sessions WHERE student_email = $1', [exact]);
      sub = await pool.query('DELETE FROM submissions WHERE student_email = $1', [exact]);
    } else {
      att = await pool.query("DELETE FROM attendance WHERE email ILIKE '%@example.com'");
      ses = await pool.query("DELETE FROM study_sessions WHERE student_email ILIKE '%@example.com'");
      sub = await pool.query("DELETE FROM submissions WHERE student_email ILIKE '%@example.com'");
    }
    res.json({ ok: true, deleted: { attendance: att.rowCount, study_sessions: ses.rowCount, submissions: sub.rowCount } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/admin/study.csv', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).send('No database configured');
  try { sendCsv(res, 'study_totals.csv',
    ['student_email','student_name','section','student_no','total_minutes','session_count','active_days','first_seen','last_seen'],
    await studyRows(readFilters(req.query))); }
  catch (e) { res.status(500).send('error: ' + e.message); }
});
app.get('/admin/attendance.csv', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!pool) return res.status(503).send('No database configured');
  try { sendCsv(res, 'attendance.csv',
    ['created_at','full_name','email','contact','section','student_no','sign_date','sign_time','ip','city','region','country'],
    await attendanceRows(readFilters(req.query))); }
  catch (e) { res.status(500).send('error: ' + e.message); }
});

app.get('/api/health', (req, res) => res.json({ ok: true, db: hasDb }));

// ---- Server-side attendance gate ----
// Content pages require a valid attendance cookie. Public (no cookie): the gate itself, the 404,
// static assets, /api/*, /admin/*, and /datasets/* (notebooks scrape those programmatically without a
// cookie). Everything else bounces to the gate with ?return= so the student lands back after signing in.
// This is what actually enforces attendance — localStorage alone can never unlock content.
const PUBLIC_EXACT = new Set(['/', '/index.html', '/index', '/404.html', '/404', '/favicon.ico', '/go',
  '/admin', '/admin.html']); // admin SHELL is reachable; its DATA is guarded by requireAdmin
const PUBLIC_PREFIX = ['/assets/', '/api/', '/admin/', '/datasets/'];
const ASSET_EXT = /\.(css|js|map|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|csv|txt)$/i;
function isPublicPath(p) {
  if (PUBLIC_EXACT.has(p)) return true;
  if (PUBLIC_PREFIX.some((pre) => p.startsWith(pre))) return true;
  if (REWRITES[p]) return true;               // short dataset aliases (/car_data, /laguna_data, …)
  if (ASSET_EXT.test(p)) return true;         // static assets by extension (PDF stays gated)
  return false;
}
app.use((req, res, next) => {
  if (req.method !== 'GET' || isPublicPath(req.path)) return next();
  const token = parseCookies(req)[SESSION_COOKIE];
  if (verifySession(token)) return next();    // valid attendance session → serve
  // No/!invalid cookie → bounce to the gate, remember where they wanted to go.
  const back = encodeURIComponent(req.originalUrl || req.path);
  return res.redirect('/index.html?return=' + back);
});

// ---- Static site (clean URLs + rewrites) ----
app.use((req, res, next) => {
  const r = REWRITES[req.path];
  if (r) req.url = r;
  next();
});
app.use(express.static(ROOT, { extensions: ['html'] }));   // /home -> home.html, /day1/ -> day1/index.html

// Unknown routes -> a real themed 404 page (not the sign-in gate).
app.use((req, res) => res.status(404).sendFile(path.join(ROOT, '404.html')));

const PORT = process.env.PORT || 3000;
initDb()
  .catch(e => console.error('[attendance] initDb error:', e.message))
  .finally(() => app.listen(PORT, () => console.log('Listening on ' + PORT)));
