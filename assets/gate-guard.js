/* ============================================================
   PUP Santa Rosa — gate guard for deep pages (e.g. guides).
   If a logged-out student opens this page directly, bounce them to the
   sign-in gate with a ?return= pointer, so after signing in they land
   BACK on this exact page. Runs only over http(s) — never during the
   headless file:// PDF render (which would otherwise break the PDF).
   ============================================================ */
(function () {
  "use strict";
  if (location.protocol.indexOf("http") !== 0) return; // skip file:// (PDF gen)
  // migrate old dict_* -> pup_* so already-registered students pass the guard
  try {
    ["attendance", "attendee"].forEach(function (k) {
      var old = localStorage.getItem("dict_" + k);
      if (old !== null) {
        if (localStorage.getItem("pup_" + k) === null) localStorage.setItem("pup_" + k, old);
        localStorage.removeItem("dict_" + k);
      }
    });
  } catch (e) {}
  var id = null;
  try { id = JSON.parse(localStorage.getItem("pup_attendee") || "null"); } catch (e) {}
  if (id && id.email) return; // already signed in — allow through
  var ret = encodeURIComponent(location.pathname + location.search);
  location.replace("/index.html?return=" + ret);
})();
