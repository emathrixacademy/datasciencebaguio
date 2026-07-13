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
  var id = null;
  try { id = JSON.parse(localStorage.getItem("dict_attendee") || "null"); } catch (e) {}
  if (id && id.email) return; // already signed in — allow through
  var ret = encodeURIComponent(location.pathname + location.search);
  location.replace("/index.html?return=" + ret);
})();
