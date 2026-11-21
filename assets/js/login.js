/* ==========================================================================
   LOGIN — sign in / create account ONLY.
   Flow:  login.html  --(create account)-->  setup.html  -->  login.html  -->  index.html
                      --(log in)---------------------------------------------^
   ========================================================================== */
const LOGO_IMG = 'assets/img/logo.jpg';

/* already logged in on this device with a finished profile -> straight to the app */
if (S.done && S.acct) location.replace('index.html');

function bootView() {
  return `<div class="boot"><img src="${LOGO_IMG}" alt="MAYDAN FIT" width="290" height="343"></div>`;
}

function authView() {
  const isSignup = (UI.authTab || 'login') === 'signup';
  return `<div class="ob"><div class="top"><span></span><span></span>${langBtn()}</div>
    <h1>${t('مرحباً بك', 'Welcome')}</h1>
    <p class="sub">${t('سجّل دخولك أو أنشئ حساباً جديداً لحفظ تقدمك.', 'Log in or create a new account to save your progress.')}</p>
    <div class="flex" role="tablist" style="gap:8px;margin-top:6px">
      <button role="tab" class="chip" aria-pressed="${!isSignup}" data-a="authTab" data-v="login">${t('تسجيل الدخول', 'Log in')}</button>
      <button role="tab" class="chip" aria-pressed="${isSignup}" data-a="authTab" data-v="signup">${t('حساب جديد', 'New account')}</button>
    </div>
    <div class="opts" style="margin-top:16px">
      <label class="sr-only" for="auEm">${t('البريد الإلكتروني', 'Email')}</label>
      <input id="auEm" class="txt" type="email" inputmode="email" autocomplete="email" placeholder="you@email.com" dir="ltr" value="${esc(UI.authEmail || '')}">
      <label class="sr-only" for="auPw">${t('كلمة المرور', 'Password')}</label>
      <input id="auPw" class="txt" type="password" autocomplete="${isSignup ? 'new-password' : 'current-password'}" placeholder="${t('كلمة المرور', 'Password')}" dir="ltr">
      ${isSignup ? `<label class="sr-only" for="auPw2">${t('تأكيد كلمة المرور', 'Confirm password')}</label><input id="auPw2" class="txt" type="password" autocomplete="new-password" placeholder="${t('تأكيد كلمة المرور', 'Confirm password')}" dir="ltr">` : ''}
      <button class="go" data-a="authGo" ${UI.authBusy ? 'disabled' : ''}>${UI.authBusy ? t('جارٍ التحقق…', 'Checking…') : (isSignup ? t('إنشاء الحساب', 'Create account') : t('تسجيل الدخول', 'Log in'))}</button>
    </div>
    <p class="note" style="text-align:center;margin-top:auto;padding-top:20px">${t('بياناتك تُحفظ لحسابك عبر البريد الإلكتروني.', 'Your data is saved to your account by email.')}</p></div>`;
}

const PHASES = { boot: bootView, auth: authView };

const app = $('#app');
function draw() {
  const root = document.documentElement;
  app.classList.toggle('anim', !!UI.anim); UI.anim = false;
  root.lang = S.lang; root.dir = isEn() ? 'ltr' : 'rtl';
  document.title = t('ميدان فِت', 'Maydan Fit');
  app.innerHTML = bidi(PHASES[UI.phase]());
}

const A = {
  lang() { S.lang = isEn() ? 'ar' : 'en'; redraw(); },
  authTab(v) { UI.authTab = v; draw(); },
  async authGo() {
    const emEl = $('#auEm'), pwEl = $('#auPw'), email = emEl.value.trim().toLowerCase(), pw = pwEl.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) { emEl.focus(); toast(t('أدخل بريداً صحيحاً', 'Enter a valid email')); return; }
    if (pw.length < 4) { pwEl.focus(); toast(t('كلمة مرور قصيرة جداً', 'Password is too short')); return; }
    const isSignup = (UI.authTab || 'login') === 'signup';
    if (isSignup) {
      const pw2 = $('#auPw2');
      if (pw !== pw2.value) { pw2.focus(); toast(t('كلمتا المرور غير متطابقتين', 'Passwords do not match')); return; }
    }
    UI.authEmail = email; UI.authBusy = true; draw();
    try {
      const res = await apiCall(isSignup ? 'signup' : 'login', { email, password: pw });
      UI.authBusy = false;
      if (res.status !== 'success') { draw(); toast(res.message || t('حدث خطأ', 'Something went wrong')); return; }

      if (isSignup) {
        /* new account -> personal-details page. NOT logged in yet: the user comes back here to log in. */
        try { sessionStorage.setItem(PENDING_KEY, email); } catch (e) { /* ignore */ }
        location.href = 'setup.html';
        return;
      }

      /* login */
      S.acct = { email }; save();
      if (res.profile && res.profile.name && !S.done) applyRemoteProfile(res.profile);  // new device: restore from Sheet
      if (S.done) { location.href = 'index.html'; return; }
      /* account exists but its setup was never finished -> finish it first */
      try { sessionStorage.setItem(PENDING_KEY, email); } catch (e) { /* ignore */ }
      S.acct = null; save();
      location.href = 'setup.html';
    } catch (err) {
      UI.authBusy = false; draw();
      toast(t('تعذّر الاتصال بالخادم، تحقق من الإنترنت', 'Could not reach the server, check your connection'));
    }
  }
};
['authGo'].forEach(k => { const f = A[k]; A[k] = function () { UI.anim = true; return f.apply(this, arguments); }; });

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (el && A[el.dataset.a]) A[el.dataset.a](el.dataset.v, el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter) { e.preventDefault(); A[e.target.dataset.enter](); }
});

/* ==========================================================================
   BOOT
   ========================================================================== */
(function init() {
  UI.anim = true; draw();
  setTimeout(() => {
    if (UI.phase !== 'boot') return;
    UI.phase = 'auth'; UI.anim = true; draw();
    if (new URLSearchParams(location.search).get('setup') === 'done')
      toast(t('تم حفظ بياناتك ✓ سجّل دخولك الآن', 'Your details are saved ✓ log in now'));
  }, 1000);
})();
