/* ============================================================
   PUP Santa Rosa — study-session tracker (client)
   Include on every CONTENT page (home, session/activity pages,
   readings, dataset portals) — NOT strictly needed on the gate.

   What it does:
     - On load, if the student is identified (localStorage from the
       attendance gate), POST /api/session/start and remember session_id.
     - Every 60s while the tab is visible, POST /api/session/heartbeat.
     - On tab hide / close, sendBeacon /api/session/end.
   Degrades gracefully: if the DB isn't attached the API returns
   {stored:false} and the page keeps working. All failures are swallowed.
   ============================================================ */
(function () {
  "use strict";

  // One-time migration: old dict_* keys -> pup_* (keep already-registered students signed in).
  try {
    ["attendance", "attendee"].forEach(function (k) {
      var old = localStorage.getItem("dict_" + k);
      if (old !== null) {
        if (localStorage.getItem("pup_" + k) === null) localStorage.setItem("pup_" + k, old);
        localStorage.removeItem("dict_" + k);
      }
    });
  } catch (e) {}

  // Reuse the identity captured at the attendance gate.
  var identity = null;
  try { identity = JSON.parse(localStorage.getItem("pup_attendee") || "null"); } catch (e) {}
  if (!identity || !identity.email) return; // not signed in — nothing to track

  var HEARTBEAT_MS = 60 * 1000;
  var sessionId = null;
  var timer = null;

  function post(url, body, useBeacon) {
    try {
      var payload = JSON.stringify(body || {});
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        return Promise.resolve(null);
      }
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  function start() {
    if (sessionId) return;
    post("/api/session/start", {
      email: identity.email,
      name: identity.fullName || "",
      page: location.pathname
    }).then(function (res) {
      if (res && res.session_id) {
        sessionId = res.session_id;
        beat();                        // first heartbeat right away
        timer = setInterval(beat, HEARTBEAT_MS);
      }
    });
  }

  function beat() {
    if (!sessionId) return;
    if (document.visibilityState !== "visible") return;
    post("/api/session/heartbeat", { session_id: sessionId });
  }

  function end() {
    if (!sessionId) return;
    post("/api/session/end", { session_id: sessionId }, true); // sendBeacon
    if (timer) { clearInterval(timer); timer = null; }
    sessionId = null;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") end();
    else start(); // returning to the tab opens a fresh session
  });
  window.addEventListener("beforeunload", end);

  // ---- Auto-logout after 3 hours of inactivity ----
  // Any real interaction resets the timer. When it fires, we end the study
  // session, clear the sign-in identity, and send the student back to the gate.
  var IDLE_MS = 3 * 60 * 60 * 1000; // 3 hours
  var idleTimer = null;
  function logout() {
    end();
    try {
      localStorage.removeItem("pup_attendance");
      localStorage.removeItem("pup_attendee");
    } catch (e) {}
    if (location.protocol.indexOf("http") === 0) location.replace("/index.html");
  }
  function resetIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(logout, IDLE_MS);
  }
  ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"].forEach(function (ev) {
    window.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();

  if (document.visibilityState === "visible") start();
})();
