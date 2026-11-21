/* ==========================================================================
   DATA LOADER
   Fetches the JSON "database" files and exposes them as plain globals
   (GOALS, SPORTS, TPL, …) exactly as core.js / login.js / main.js expect,
   then loads core.js followed by the page's own script, in order.

   NOTE: fetch() of local files is blocked by browsers when a page is opened
   directly as file:// (no server, no CORS headers). If that happens here,
   serve the folder with any static server instead of double-clicking the
   HTML file, e.g. from inside the project folder:
     python3 -m http.server 8000
   then open http://localhost:8000/login.html
   ========================================================================== */
(function () {
  'use strict';
  var me = document.currentScript;
  var PAGE = me.dataset.page;                       // "login.js" or "main.js"
  var BASE = 'assets/data/';
  var FILES = ['goals.json', 'sports.json', 'templates.json', 'programs.json', 'strings.json'];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('تعذّر تحميل ' + src)); };
      document.body.appendChild(s);
    });
  }

  function fail(err) {
    document.body.innerHTML =
      '<div style="font-family:Tajawal,system-ui,sans-serif;padding:40px 20px;max-width:560px;margin:0 auto;color:#f4f4f4;background:#000;min-height:100vh;line-height:1.8">' +
      '<h1 style="color:#D0FF00;margin:0 0 10px">تعذّر تحميل بيانات التطبيق</h1>' +
      '<p>هذا التطبيق يقرأ ملفات JSON من مجلد <code>assets/data</code>، والمتصفح يمنع ذلك عند فتح <code>login.html</code> مباشرة من الجهاز (file://).</p>' +
      '<p><b>الحل:</b> شغّل خادماً محلياً بسيطاً من داخل مجلد المشروع، مثلاً:</p>' +
      '<pre style="background:#141414;border:1px solid #262626;padding:12px;border-radius:10px;overflow:auto;direction:ltr;text-align:left">python3 -m http.server 8000</pre>' +
      '<p>ثم افتح: <code style="direction:ltr;display:inline-block">http://localhost:8000/login.html</code></p>' +
      '<p style="color:#8a8f98;font-size:13px">تفاصيل تقنية: ' + (err && err.message ? err.message : err) + '</p></div>';
  }

  Promise.all(FILES.map(function (f) {
    return fetch(BASE + f).then(function (r) {
      if (!r.ok) throw new Error(f + ': HTTP ' + r.status);
      return r.json();
    });
  })).then(function (all) {
    all.forEach(function (obj) { Object.assign(window, obj); });   // GOALS, SPORTS, TPL, W, EN, STORIES, …
    return loadScript('assets/js/core.js');
  }).then(function () {
    return loadScript('assets/js/' + PAGE);
  }).catch(fail);
})();
