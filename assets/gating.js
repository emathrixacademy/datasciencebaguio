/* ============================================================
   eMathrix Education — sequential activity gating (client)
   Works with server endpoints /api/progress, /api/submit and the
   server-enforced launcher /go?key=..&e=..  (URL-edit skips are
   blocked server-side; this script only drives the UI).

   Markup contract on a page:
     <div class="activity" data-activity-key="w1a2"> ...cards... </div>
     <div class="submitbox" data-submit-key="w1a2"> (auto-filled) </div>
   Readings are never gated (they carry no data-activity-key).
   No-DB fallback: if progress can't be read, nothing is locked and a
   small "progress not being saved" note is shown.
   ============================================================ */
(function () {
  "use strict";
  var ORDER = ['w1a1', 'w1a2', 'w1a3', 'w2a1', 'w2a2', 'w3cap'];
  var LABEL = {
    w1a1: 'Week 1 · Activity 1 — Data Science',
    w1a2: 'Week 1 · Activity 2 — Web Scraping + Cleaning',
    w1a3: 'Week 1 · Activity 3 — Exploratory Data Analysis',
    w2a1: 'Week 2 · Activity 1 — Stock Analysis',
    w2a2: 'Week 2 · Activity 2 — Signature Detection',
    w3cap: 'Week 3 · Capstone — Form to AI'
  };

  var id = null;
  try { id = JSON.parse(localStorage.getItem('pup_attendee') || 'null'); } catch (e) {}
  var email = id && id.email ? id.email : '';
  var name = id && id.fullName ? id.fullName : '';

  var activities = [].slice.call(document.querySelectorAll('[data-activity-key]'));
  var boxes = [].slice.call(document.querySelectorAll('[data-submit-key]'));
  var strip = document.getElementById('progress-strip');
  if (!activities.length && !boxes.length && !strip) return;

  function renderStrip(completed, unlocked, saving) {
    if (!strip) return;
    strip.innerHTML = '';
    ORDER.forEach(function (k) {
      var done = completed.indexOf(k) >= 0;
      var open = saving ? !!unlocked[k] : true;
      var chip = document.createElement('span');
      chip.className = 'drivelink';
      chip.style.cursor = 'default';
      var state = done ? '✓ done' : (open ? '● open' : '🔒 locked');
      chip.style.borderColor = done ? '#6A0F1A' : (open ? '#F5C518' : '#E7D7DA');
      chip.innerHTML = '<b>' + LABEL[k].replace('Week', 'W').replace(' · Activity', ' A') + '</b> &nbsp;<span style="color:#6B5B60">' + state + '</span>';
      strip.appendChild(chip);
    });
    if (!saving) {
      var note = document.createElement('div');
      note.className = 'lock-note'; note.textContent = 'progress not being saved (offline/demo)';
      strip.appendChild(note);
    }
  }

  function unlockedFrom(completed) {
    var done = {}; (completed || []).forEach(function (k) { done[k] = 1; });
    var out = {};
    for (var i = 0; i < ORDER.length; i++) {
      var ok = true;
      for (var j = 0; j < i; j++) { if (!done[ORDER[j]]) { ok = false; break; } }
      if (ok) out[ORDER[i]] = 1;
    }
    return out;
  }

  function topNote(text, warn) {
    var d = document.createElement('div');
    d.className = 'gate-msg';
    if (warn) d.style.borderLeftColor = '#6A0F1A';
    d.textContent = text;
    var anchor = document.querySelector('h1') || document.body.firstChild;
    anchor.parentNode.insertBefore(d, anchor.nextSibling);
  }

  function lockActivity(el, locked, needLabel) {
    el.classList.toggle('locked', locked);
    [].slice.call(el.querySelectorAll('a')).forEach(function (a) {
      if (locked) { a.setAttribute('tabindex', '-1'); a.setAttribute('aria-disabled', 'true'); }
      else { a.removeAttribute('tabindex'); a.removeAttribute('aria-disabled'); }
    });
    var existing = el.querySelector('.lock-note');
    if (locked && !existing) {
      var n = document.createElement('div');
      n.className = 'lock-note';
      n.textContent = '🔒 Locked — finish & submit ' + (needLabel || 'the previous activity') + ' to unlock.';
      el.appendChild(n);
    } else if (!locked && existing) { existing.remove(); }
  }

  // Point an activity's launch links through the server-enforced /go?key=..&e=..
  function wireLaunch(el, key) {
    [].slice.call(el.querySelectorAll('a[data-launch]')).forEach(function (a) {
      a.setAttribute('href', '/go?key=' + encodeURIComponent(key) + '&e=' + encodeURIComponent(email));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  }

  function buildBox(box, key, done, unlocked) {
    var label = 'Paste your Google Drive/Colab link for this activity to mark it complete and unlock the next:';
    box.innerHTML = '';
    var lab = document.createElement('label'); lab.textContent = label; box.appendChild(lab);
    var row = document.createElement('div'); row.className = 'row';
    var inp = document.createElement('input'); inp.type = 'url'; inp.placeholder = 'https://drive.google.com/…  or  https://colab.research.google.com/…';
    var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = done ? 'Update link' : 'Submit & unlock next';
    row.appendChild(inp); row.appendChild(btn); box.appendChild(row);
    var msg = document.createElement('div'); box.appendChild(msg);
    if (done) { msg.className = 'ok on'; msg.textContent = 'Submitted ✓'; }
    if (!unlocked) { inp.disabled = true; btn.disabled = true; }

    btn.addEventListener('click', function () {
      var link = (inp.value || '').trim();
      if (!/^https?:\/\/.+/i.test(link)) { msg.className = 'warn'; msg.textContent = 'Please paste a valid http(s) link.'; return; }
      btn.disabled = true; msg.className = ''; msg.textContent = 'Submitting…';
      fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_key: key, link: link, email: email, name: name })
      }).then(function (r) { return r.json(); }).then(function (res) {
        btn.disabled = false;
        if (!res || res.ok === false) { msg.className = 'warn'; msg.textContent = (res && res.message) || 'Could not submit.'; return; }
        msg.className = 'ok on';
        msg.textContent = 'Submitted ✓ — ' + (res.unlocked_next ? (LABEL[res.unlocked_next] + ' unlocked') : 'all activities complete');
        if (res.warn) { msg.textContent += ' (note: not a Drive/Colab link)'; }
        // live-unlock the next activity on this page if present
        if (res.unlocked_next) {
          var nextEl = document.querySelector('[data-activity-key="' + res.unlocked_next + '"]');
          if (nextEl) { lockActivity(nextEl, false); wireLaunch(nextEl, res.unlocked_next); }
          var nextBox = document.querySelector('[data-submit-key="' + res.unlocked_next + '"]');
          if (nextBox) buildBox(nextBox, res.unlocked_next, false, true);
        }
      }).catch(function () { btn.disabled = false; msg.className = 'warn'; msg.textContent = 'Network error — try again.'; });
    });
  }

  function apply(completed, unlocked, saving) {
    renderStrip(completed, unlocked, saving);
    if (!saving && (activities.length || boxes.length)) topNote('Progress is not being saved right now (offline/demo) — all activities are open.', true);
    // handle a server "?locked=KEY&need=NEEDKEY" bounce
    var qp = new URLSearchParams(location.search);
    if (qp.get('locked')) {
      var need = qp.get('need');
      topNote('Finish and submit ' + (LABEL[need] || 'the previous activity') + ' first.');
      var target = document.querySelector('[data-submit-key="' + need + '"]');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    activities.forEach(function (el) {
      var key = el.getAttribute('data-activity-key');
      var isUnlocked = saving ? !!unlocked[key] : true;
      // find the label of the earliest missing prior for the lock note
      var need = '';
      if (!isUnlocked) {
        var idx = ORDER.indexOf(key);
        for (var j = 0; j < idx; j++) { if (completed.indexOf(ORDER[j]) < 0) { need = LABEL[ORDER[j]]; break; } }
      }
      lockActivity(el, !isUnlocked, need);
      if (isUnlocked) wireLaunch(el, key);
    });
    boxes.forEach(function (box) {
      var key = box.getAttribute('data-submit-key');
      var isUnlocked = saving ? !!unlocked[key] : true;
      buildBox(box, key, completed.indexOf(key) >= 0, isUnlocked);
    });
  }

  // Load progress (server-side, so it persists across reloads + devices).
  fetch('/api/progress?email=' + encodeURIComponent(email))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res || res.stored === false) { apply([], {}, false); return; }
      var completed = res.completed || [];
      apply(completed, unlockedFrom(completed), true);
    })
    .catch(function () { apply([], {}, false); });
})();
