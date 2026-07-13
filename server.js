// PUP Santa Rosa — Data Science & Data Analytics — static site + attendance API (Express + Postgres)
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.set('trust proxy', true);            // Railway sits behind a proxy -> real client IP
app.use(express.json({ limit: '1mb' }));

const ROOT = __dirname;

// ---- Backward-compatible short URLs (datasets moved under /datasets) ----
const REWRITES = {
  '/car_data': '/datasets/car_data.html',
  '/car_data1': '/datasets/car_data1.html',
  '/car_data2': '/datasets/car_data2.html',
  '/car_data3': '/datasets/car_data3.html',
  '/forest_data': '/datasets/forest_data.html',
  '/wildlife_data': '/datasets/wildlife_data.html',
  '/airquality_data': '/datasets/airquality_data.html',
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

  console.log('[attendance] tables + study_totals view ready.');
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
  if (!pool) {
    // Site still works before the DB is attached.
    return res.json({ status: 'ok', stored: false, note: 'no database configured yet' });
  }
  try {
    await pool.query(
      `INSERT INTO attendance
        (full_name, email, contact, client_timestamp, sign_date, sign_time, ip, city, region, country, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [b.fullName, b.email, b.contact || '', b.timestamp || '', b.date || '', b.time || '',
       ip, b.city || '', b.region || '', b.country || '', b.userAgent || '']
    );
    res.json({ status: 'ok', stored: true });
  } catch (e) {
    console.error('[attendance] insert failed:', e.message);
    res.status(500).json({ status: 'error', message: 'could not store sign-in' });
  }
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

// ---- Admin: export per-student study totals as CSV (protected by ADMIN_TOKEN) ----
app.get('/admin/study.csv', async (req, res) => {
  if (!process.env.ADMIN_TOKEN || req.query.token !== process.env.ADMIN_TOKEN) {
    return res.status(403).send('Forbidden');
  }
  if (!pool) return res.status(503).send('No database configured');
  try {
    const { rows } = await pool.query(
      `SELECT student_email, student_name, total_seconds,
              round(total_seconds/60.0, 1) AS total_minutes,
              session_count, active_days, first_seen, last_seen
         FROM study_totals
        ORDER BY total_seconds DESC NULLS LAST`
    );
    const cols = ['student_email','student_name','total_seconds','total_minutes',
                  'session_count','active_days','first_seen','last_seen'];
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [cols.join(',')]
      .concat(rows.map(r => cols.map(c => esc(r[c])).join(',')))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="study_totals.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).send('error: ' + e.message);
  }
});

// ---- Admin: export attendance as CSV (protected by ADMIN_TOKEN) ----
app.get('/admin/attendance.csv', async (req, res) => {
  if (!process.env.ADMIN_TOKEN || req.query.token !== process.env.ADMIN_TOKEN) {
    return res.status(403).send('Forbidden');
  }
  if (!pool) return res.status(503).send('No database configured');
  try {
    const { rows } = await pool.query('SELECT * FROM attendance ORDER BY created_at');
    const cols = ['id','created_at','full_name','email','contact','client_timestamp',
                  'sign_date','sign_time','ip','city','region','country','user_agent'];
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [cols.join(',')]
      .concat(rows.map(r => cols.map(c => esc(r[c])).join(',')))
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).send('error: ' + e.message);
  }
});

// ---- Admin: attendance as JSON (for the admin page) ----
app.get('/admin/attendance.json', async (req, res) => {
  if (!process.env.ADMIN_TOKEN || req.query.token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (!pool) return res.status(503).json({ error: 'no database configured' });
  try {
    const { rows } = await pool.query('SELECT * FROM attendance ORDER BY created_at DESC');
    res.json({ count: rows.length, rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, db: hasDb }));

// ---- Static site (clean URLs + rewrites) ----
app.use((req, res, next) => {
  const r = REWRITES[req.path];
  if (r) req.url = r;
  next();
});
app.use(express.static(ROOT, { extensions: ['html'] }));   // /home -> home.html, /day1/ -> day1/index.html

// Fallback to the gate
app.use((req, res) => res.status(404).sendFile(path.join(ROOT, 'index.html')));

const PORT = process.env.PORT || 3000;
initDb()
  .catch(e => console.error('[attendance] initDb error:', e.message))
  .finally(() => app.listen(PORT, () => console.log('Listening on ' + PORT)));
