/* ==========================================================================
   LOGIN — sign-in, welcome, intro, onboarding questionnaire
   Runs on login.html. Writes the same localStorage state core.js reads,
   then hands off to index.html once setup is finished.
   ========================================================================== */
const LOGO_IMG = 'assets/img/logo.jpg';

/* if the user is already fully set up, skip straight to the app */
if (S.done && S.acct && !new URLSearchParams(location.search).has('redo')) {
  location.replace('index.html');
}
/* coming back here from Settings → "Redo setup" */
const REDO = new URLSearchParams(location.search).has('redo');
if (REDO) { S.done = false; UI.phase = 'intro'; UI.is = 0; }

/* ==========================================================================
   VIEWS
   ========================================================================== */
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

function welcomeView() {
  return `<div class="sp"><div class="photo" role="img" aria-label="MAYDAN FIT"></div>${langBtn()}
    <h1>${isEn() ? 'From zero<br>to <em>pro</em>' : 'من الصفر<br>حتى <em>الاحتراف</em>'}</h1>
    <p>${t('تدريب علمي واستشفاء ذكي لكل رياضة.', 'Science-based training and smart recovery, for every sport.')}</p>
    <button class="go" data-a="welcomeGo">${t('ابدأ الآن', 'Get started')}</button></div>`;
}

function introView() {
  let b;
  if (UI.is === 0) {
    b = `<svg viewBox="0 0 100 100" width="190" style="display:block;margin:20px auto" role="img" aria-label="82%"><circle cx="50" cy="50" r="40" fill="none" stroke="#1d2610" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#D0FF00" stroke-width="10" stroke-linecap="round" stroke-dasharray="206 251" transform="rotate(-90 50 50)"/><text x="50" y="58" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">82%</text></svg>
      <h1>${isEn() ? 'Train smart.<br>Recover better.' : 'تدرّب بذكاء.<br>استشِف أفضل.'}</h1>
      <p class="sub">${t('جاهزيتك تحدد حِمل كل جلسة.', 'Your readiness decides the load of every session.')}</p>`;
  } else {
    b = `<h1>${t('اختر ميدانك', 'Choose your arena')}</h1><div class="sg">${SPORTS.map(s =>
      `<button class="tile" aria-pressed="${sport() === s.id}" style="background:${s.bg}" data-a="pickSport" data-v="${s.id}">${svg(s.icon, 30).replace('currentColor', s.fg)}${s[isEn() ? 'en' : 'ar']}</button>`).join('')}</div>`;
  }
  return `<div class="ob"><div class="top"><button class="bk" data-a="introSkip">${t('تخطّ', 'Skip')}</button><span class="dots" aria-hidden="true">${[0, 1].map(i => `<i class="${i === UI.is ? 'on' : ''}"></i>`).join('')}</span>${langBtn()}</div>${b}
    <div style="margin-top:auto;padding-top:20px"><button class="go" data-a="introNext">${UI.is === 1 ? t('ابدأ', 'Start') : t('التالي', 'Next')}</button></div></div>`;
}

/* onboarding questions */
const STEPS = [
  { k: 'name', t: 't', q: ['شو اسمك؟', 'What is your name?'], ph: ['اسمك', 'Your name'] },
  { k: 'sex', t: 'c', o: [['m', 'ذكر', 'Male'], ['f', 'أنثى', 'Female']], q: ['ما جنسك؟', 'What is your sex?'] },
  { k: 'dob', t: 'date', q: ['متى تاريخ ميلادك؟', 'What is your birth date?'] },
  { k: 'hUnit', t: 'c', o: [['cm', 'سم (cm)', 'cm'], ['ftin', 'قدم وإنش (ft/in)', 'ft / in']], q: ['وحدة قياس الطول؟', 'Height unit?'] },
  { k: 'h', t: 'hn', q: ['كم طولك؟', 'How tall are you?'] },
  { k: 'wUnit', t: 'c', o: [['kg', 'كيلوغرام (kg)', 'kg'], ['lb', 'رطل (lb)', 'lb']], q: ['وحدة قياس الوزن؟', 'Weight unit?'] },
  { k: 'w', t: 'wn', q: ['كم وزنك؟', 'What is your weight?'] },
  { k: 'life', t: 'c', o: [['1.2', 'مكتبي، حركة قليلة', 'Desk job, little movement'], ['1.3', 'حركة خفيفة خلال اليوم', 'Light daily movement'], ['1.4', 'عمل بدني أو مشي كثير', 'Physical job or lots of walking']], q: ['كيف يومك العادي خارج التمرين؟', 'How active is your day outside training?'] },
  { k: 'days', t: 'c', o: [2, 3, 4, 5, 6].map(n => [String(n), n === 2 ? 'يومان' : `${n} ${n > 10 ? 'يوماً' : 'أيام'}`, `${n} days`]), q: ['كم يوم تتدرب بالأسبوع؟', 'How many days do you train per week?'] },
  { k: 'split', t: 'c', gym: true, o: [['auto', 'اقتراح التطبيق', 'App suggestion'], ['ppl', 'دفع / سحب / أرجل', 'Push / Pull / Legs'], ['arn', 'أرنولد', 'Arnold'], ['reg', 'عادية (علوي/سفلي أو جسم كامل)', 'Regular (upper/lower or full body)']], q: ['كيف تحب تقسيمة تمارين الجيم؟', 'Which gym split do you prefer?'] },
  { k: 'exp', t: 'c', o: LEVELS, q: ['ما مستوى خبرتك؟', 'What is your experience level?'] },
  { k: 'goal', t: 'c', o: Object.keys(GOALS).map(k => [k, GOALS[k].ar, GOALS[k].en]), q: ['ما هدف تدريبك الأساسي؟', 'What is your main training goal?'] },
  { k: 'cg', t: 'c', o: [['cut', 'تنشيف (خسارة دهون)', 'Lose fat'], ['keep', 'ثبات الوزن', 'Maintain weight'], ['bulk', 'زيادة كتلة', 'Gain muscle']], q: ['ما هدفك بالوزن؟', 'What is your weight goal?'] },
  { k: 'cardio', t: 'c', o: [['y', 'نعم، أضف كارديو', 'Yes, add cardio'], ['n', 'لا', 'No']], q: ['تحب نضيف كارديو لخطتك؟', 'Want cardio added to your plan?'] },
  { k: 'dur', t: 'c', o: [['30', '30 دقيقة', '30 min'], ['45', '45 دقيقة', '45 min'], ['60', '60 دقيقة', '60 min'], ['90', '90 دقيقة', '90 min']], q: ['كم مدة جلستك المتاحة؟', 'How long is your available session?'] },
  { k: 'loc', t: 'c', o: [['gym', 'جيم', 'Gym'], ['home', 'منزل', 'Home'], ['out', 'خارجي (حديقة / شارع)', 'Outdoor (park / street)']], q: ['وين بتتمرن غالباً؟', 'Where do you usually train?'] }
];
const steps = () => STEPS.filter(s => !s.gym || sport() === 'gym');

/* look up a step's option label by code (used to send readable Arabic values to the sheet),
   and the reverse (used to rehydrate a profile fetched back from the sheet) */
function optLabelAr(key, val) {
  const st = STEPS.find(s => s.k === key);
  if (!st || !st.o) return '';
  const o = st.o.find(o => String(o[0]) === String(val));
  return o ? o[1] : '';
}
function codeFromLabel(key, label) {
  const st = STEPS.find(s => s.k === key);
  if (!st || !st.o || !label) return null;
  const o = st.o.find(o => o[1] === label);
  return o ? o[0] : null;
}

function onbView() {
  const list = steps(), n = list.length;
  if (UI.os >= n) return resultView();
  const s = list[UI.os];
  let cur = S.p[s.k], body;
  if (s.k === 'cardio') cur = S.p.cardio ? 'y' : 'n';
  if (s.t === 'c') {
    body = `<div class="opts">${s.o.map(o => `<button class="opt" aria-pressed="${String(cur) === String(o[0])}" data-a="obPick" data-v="${esc(o[0])}">${esc(isEn() ? o[2] : o[1])}</button>`).join('')}</div>`;
  } else if (s.t === 't') {
    body = `<label class="sr-only" for="nv">${pair(s.q)}</label><input id="nv" class="txt" type="text" maxlength="24" autocomplete="given-name" placeholder="${esc(pair(s.ph))}" value="${esc(cur)}" data-enter="obText"><button class="go" style="margin-top:22px" data-a="obText">${t('التالي', 'Next')}</button>`;
  } else if (s.t === 'date') {
    const today = new Date(), min = `${today.getFullYear() - 100}-01-01`, max = ds(today);
    body = `<label class="sr-only" for="nv">${pair(s.q)}</label><input id="nv" class="txt" type="date" min="${min}" max="${max}" value="${esc(cur || '')}" data-enter="obDate"><button class="go" style="margin-top:22px" data-a="obDate">${t('التالي', 'Next')}</button>`;
  } else if (s.t === 'hn') {
    body = S.p.hUnit === 'ftin'
      ? `<div class="flex" style="gap:10px;justify-content:center"><div class="numbox"><button data-a="obStep" data-v="-1" data-k="hFeet" aria-label="${t('أنقص', 'Decrease')}">−</button><input id="nv1" type="number" inputmode="numeric" min="${LIMITS.hFeet[0]}" max="${LIMITS.hFeet[1]}" value="${S.p.hFeet}" aria-label="${t('قدم', 'feet')}" data-enter="obHNext"><button data-a="obStep" data-v="1" data-k="hFeet" aria-label="${t('زِد', 'Increase')}">+</button></div><div class="unit">${t('قدم', 'ft')}</div>
          <div class="numbox"><button data-a="obStep" data-v="-1" data-k="hInch" aria-label="${t('أنقص', 'Decrease')}">−</button><input id="nv2" type="number" inputmode="numeric" min="${LIMITS.hInch[0]}" max="${LIMITS.hInch[1]}" value="${S.p.hInch}" aria-label="${t('إنش', 'inch')}" data-enter="obHNext"><button data-a="obStep" data-v="1" data-k="hInch" aria-label="${t('زِد', 'Increase')}">+</button></div><div class="unit">${t('إنش', 'in')}</div></div><button class="go" style="margin-top:14px" data-a="obHNext">${t('التالي', 'Next')}</button>`
      : `<div class="numbox"><button data-a="obStep" data-v="-1" data-k="h" aria-label="${t('أنقص', 'Decrease')}">−</button><input id="nv" type="number" inputmode="numeric" min="${LIMITS.h[0]}" max="${LIMITS.h[1]}" value="${S.p.h}" aria-label="${pair(s.q)}" data-enter="obHNext"><button data-a="obStep" data-v="1" data-k="h" aria-label="${t('زِد', 'Increase')}">+</button></div><div class="unit">cm</div><button class="go" style="margin-top:14px" data-a="obHNext">${t('التالي', 'Next')}</button>`;
  } else if (s.t === 'wn') {
    const [lo, hi] = S.p.wUnit === 'lb' ? LIMITS.wLb : LIMITS.w, val = S.p.wUnit === 'lb' ? S.p.wLb : S.p.w;
    body = `<div class="numbox"><button data-a="obStep" data-v="-1" data-k="wRaw" aria-label="${t('أنقص', 'Decrease')}">−</button><input id="nv" type="number" inputmode="numeric" min="${lo}" max="${hi}" value="${val}" aria-label="${pair(s.q)}" data-enter="obWNext"><button data-a="obStep" data-v="1" data-k="wRaw" aria-label="${t('زِد', 'Increase')}">+</button></div><div class="unit">${S.p.wUnit}</div><button class="go" style="margin-top:14px" data-a="obWNext">${t('التالي', 'Next')}</button>`;
  }
  return `<div class="ob"><div class="bar" role="progressbar" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${UI.os + 1}"><i style="width:${(UI.os + 1) / n * 100}%"></i></div>
    <div class="top"><button class="bk" data-a="obBack">${t('رجوع →', '← Back')}</button><span>${UI.os + 1}/${n}</span>${langBtn()}</div><h1>${pair(s.q)}</h1>${body}</div>`;
}

function bmiCard() {
  const p = S.p;
  if (p.age < 18) return `<p class="note">${t('مؤشر كتلة الجسم لا يُقرأ بنفس الجدول تحت 18 سنة، استشر مختصاً.', 'BMI is read differently under 18, so ask a specialist.')}</p>`;
  const m = p.h / 100, b = p.w / (m * m), lo = 18.5 * m * m, hi = 24.9 * m * m;
  const c = b < 18.5 ? ['نحافة', 'Underweight'] : b < 25 ? ['ضمن النطاق الصحي', 'Healthy range'] : b < 30 ? ['وزن زائد', 'Overweight'] : ['سمنة', 'Obesity'];
  const df = p.w > hi ? [`${Math.round(p.w - hi)} كغ نزولاً للوصول لأعلى النطاق الصحي`, `${Math.round(p.w - hi)} kg down to reach the top of the healthy range`]
    : p.w < lo ? [`${Math.round(lo - p.w)} كغ زيادة للوصول لأدنى النطاق الصحي`, `${Math.round(lo - p.w)} kg up to reach the bottom of the healthy range`]
    : ['وزنك ضمن النطاق الصحي', 'Your weight is within the healthy range'];
  return `<div class="card"><div class="row"><span>BMI</span><b>${b.toFixed(1)}</b></div><div class="row"><span>${t('التصنيف', 'Category')}</span><b>${pair(c)}</b></div><div class="row"><span>${t('النطاق الصحي للوزن', 'Healthy weight range')}</span><b>${Math.round(lo)}–${Math.round(hi)} kg</b></div><p class="note">${pair(df)}. ${t('المؤشر لا يميّز العضل عن الدهون، فقد يبالغ بتصنيف الرياضيين ذوي الكتلة العضلية العالية.', 'BMI cannot tell muscle from fat, so it may overrate very muscular athletes.')}</p></div>`;
}

function resultView() {
  const c = calc(), p = S.p, pr = `${Math.round(p.w * 1.6)}–${Math.round(p.w * 2.2)}`;
  const R = (a, b) => `<div class="row"><span>${a}</span><b>${Math.round(b)} kcal</b></div>`;
  const cgn = { cut: t('تنشيف', 'Fat loss'), keep: t('ثبات الوزن', 'Maintenance'), bulk: t('زيادة كتلة', 'Muscle gain') }[p.cg];
  return `<div class="ob"><div class="top"><button class="bk" data-a="obBack">${t('رجوع →', '← Back')}</button><span></span>${langBtn()}</div>
    <h1>${t('احتياجك اليومي من السعرات', 'Your daily calories')}</h1>
    <div class="hero"><small>${t('هدفك اليومي', 'Daily target')}: ${cgn}</small><h2>${Math.round(c.tg)} kcal</h2><div class="meta"><span>${t('بروتين', 'Protein')}: ${pr} g</span></div></div>
    <div class="card">${R(t('الحرق الأساسي (BMR)', 'Basal metabolism (BMR)'), c.bmr)}${R(t('بدون نشاط رياضي', 'Without exercise'), c.base)}${R(t('مع تمارينك', 'With your training'), c.wit)}</div>
    ${bmiCard()}
    <p class="note">${t('تقدير بمعادلة Mifflin-St Jeor. الاحتياج الفعلي يختلف، عدّل بعد 2–3 أسابيع حسب تغيّر وزنك.', 'Estimate using the Mifflin-St Jeor formula. Real needs vary, so adjust after 2 to 3 weeks based on your weight trend.')}</p>
    ${p.age < 18 ? `<div class="warn">${t('تحت 18: لا تتبع نقصاً بالسعرات بدون مختص.', 'Under 18: do not follow a calorie deficit without a specialist.')}</div>` : ''}
    <button class="go" style="margin-top:18px" data-a="finish">${t('ابدأ التدريب', 'Start training')}</button></div>`;
}

const PHASES = { boot: bootView, auth: authView, welcome: welcomeView, intro: introView, onb: onbView };

/* rehydrate local state from the profile row the backend returns on login (new-device case) */
function applyRemoteProfile(profile) {
  if (!profile) return;
  const p = S.p;
  if (profile.sport) { const sp = SPORTS.find(x => x.ar === profile.sport); if (sp) S.sport = sp.id; }
  if (profile.name) p.name = String(profile.name).slice(0, 24);
  const sex = codeFromLabel('sex', profile.sex); if (sex) p.sex = sex;
  if (profile.dob) { p.dob = profile.dob; p.age = clamp(ageFromDob(profile.dob), LIMITS.age[0], LIMITS.age[1]); }
  const hUnit = codeFromLabel('hUnit', profile.hUnit); if (hUnit) p.hUnit = hUnit;
  if (profile.h) {
    if (p.hUnit === 'ftin') {
      const m = /^(\d+)'(\d+)/.exec(String(profile.h));
      if (m) { p.hFeet = clamp(+m[1], LIMITS.hFeet[0], LIMITS.hFeet[1]); p.hInch = clamp(+m[2], LIMITS.hInch[0], LIMITS.hInch[1]); p.h = clamp(Math.round(cmFromFtIn(p.hFeet, p.hInch)), LIMITS.h[0], LIMITS.h[1]); }
    } else p.h = clamp(Math.round(+profile.h) || p.h, LIMITS.h[0], LIMITS.h[1]);
  }
  const wUnit = codeFromLabel('wUnit', profile.wUnit); if (wUnit) p.wUnit = wUnit;
  if (profile.w) {
    if (p.wUnit === 'lb') { p.wLb = clamp(Math.round(+profile.w) || p.wLb, LIMITS.wLb[0], LIMITS.wLb[1]); p.w = clamp(Math.round(kgFromLb(p.wLb)), LIMITS.w[0], LIMITS.w[1]); }
    else p.w = clamp(Math.round(+profile.w) || p.w, LIMITS.w[0], LIMITS.w[1]);
  }
  const exp = codeFromLabel('exp', profile.exp); if (exp) p.exp = exp;
  const life = codeFromLabel('life', profile.life); if (life) p.life = +life;
  if (profile.days) p.days = clamp(parseInt(profile.days, 10) || p.days, 2, 6);
  const split = codeFromLabel('split', profile.split); if (split) p.split = split;
  const goal = codeFromLabel('goal', profile.goal); if (goal) p.goal = goal;
  const cg = codeFromLabel('cg', profile.cg); if (cg) p.cg = cg;
  const cardio = codeFromLabel('cardio', profile.cardio); if (cardio) p.cardio = cardio === 'y';
  const dur = codeFromLabel('dur', profile.dur); if (dur) p.dur = +dur;
  const loc = codeFromLabel('loc', profile.loc); if (loc) p.loc = loc;
  if (p.name) S.done = true;
  save();
}

/* ==========================================================================
   RENDER
   ========================================================================== */
const app = $('#app');
function draw() {
  const root = document.documentElement;
  app.classList.toggle('anim', !!UI.anim); UI.anim = false;
  root.lang = S.lang; root.dir = isEn() ? 'ltr' : 'rtl';
  document.title = t('ميدان فِت', 'Maydan Fit');
  app.innerHTML = bidi(PHASES[UI.phase]());
}

/* ==========================================================================
   ACTIONS (click delegation: data-a="name" data-v="value")
   ========================================================================== */
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
      S.acct = { email }; save();
      if (!isSignup && res.profile && !S.done) applyRemoteProfile(res.profile);
      if (S.done) { location.href = 'index.html'; return; }
      UI.phase = 'welcome'; redraw(); toTop();
    } catch (err) {
      UI.authBusy = false; draw();
      toast(t('تعذّر الاتصال بالخادم، تحقق من الإنترنت', 'Could not reach the server, check your connection'));
    }
  },
  welcomeGo() { if (S.done) { location.href = 'index.html'; return; } UI.phase = 'intro'; UI.is = 0; redraw(); toTop(); },
  pickSport(v) { S.sport = v; redraw(); },
  introNext() { if (UI.is < 1) { UI.is++; draw(); toTop(); } else A.introSkip(); },
  introSkip() { UI.phase = 'onb'; UI.os = 0; redraw(); toTop(); },
  obPick(v) {
    const k = steps()[UI.os].k;
    if (k === 'life' || k === 'days' || k === 'dur') S.p[k] = +v;
    else if (k === 'cardio') S.p.cardio = (v === 'y');
    else S.p[k] = v;
    UI.os++; redraw(); toTop();
  },
  obStep(v, el) {
    const dk = el && el.dataset.k;
    if (dk === 'hFeet') { const i = $('#nv1'); S.p.hFeet = clamp(Math.round(+i.value || S.p.hFeet) + +v, LIMITS.hFeet[0], LIMITS.hFeet[1]); i.value = S.p.hFeet; save(); return; }
    if (dk === 'hInch') { const i = $('#nv2'); S.p.hInch = clamp(Math.round(+i.value || S.p.hInch) + +v, LIMITS.hInch[0], LIMITS.hInch[1]); i.value = S.p.hInch; save(); return; }
    if (dk === 'h') { const i = $('#nv'); S.p.h = clamp(Math.round(+i.value || S.p.h) + +v, LIMITS.h[0], LIMITS.h[1]); i.value = S.p.h; save(); return; }
    if (dk === 'wRaw') {
      const i = $('#nv'), lb = S.p.wUnit === 'lb', [lo, hi] = lb ? LIMITS.wLb : LIMITS.w, cur = lb ? S.p.wLb : S.p.w;
      const nv = clamp(Math.round(+i.value || cur) + +v, lo, hi);
      if (lb) S.p.wLb = nv; else S.p.w = nv;
      i.value = nv; save();
    }
  },
  obDate() {
    const i = $('#nv'), v = i.value;
    if (!v) { i.focus(); toast(t('اختر تاريخ ميلادك', 'Pick your birth date')); return; }
    S.p.dob = v; S.p.age = clamp(ageFromDob(v), LIMITS.age[0], LIMITS.age[1]);
    UI.os++; redraw(); toTop();
  },
  obHNext() {
    if (S.p.hUnit === 'ftin') S.p.h = clamp(Math.round(cmFromFtIn(S.p.hFeet, S.p.hInch)), LIMITS.h[0], LIMITS.h[1]);
    else S.p.h = clamp(Math.round(+$('#nv').value) || S.p.h, LIMITS.h[0], LIMITS.h[1]);
    UI.os++; redraw(); toTop();
  },
  obWNext() {
    if (S.p.wUnit === 'lb') S.p.w = clamp(Math.round(kgFromLb(S.p.wLb)), LIMITS.w[0], LIMITS.w[1]);
    else S.p.w = clamp(Math.round(+$('#nv').value) || S.p.w, LIMITS.w[0], LIMITS.w[1]);
    UI.os++; redraw(); toTop();
  },
  obText() { const i = $('#nv'), v = i.value.trim(); if (!v) { i.focus(); toast(t('اكتب اسمك', 'Enter your name')); return; } S.p.name = v.slice(0, 24); UI.os++; redraw(); toTop(); },
  obBack() { if (UI.os === 0) { UI.phase = 'intro'; UI.is = 1; } else UI.os--; draw(); toTop(); },
  async finish() {
    S.done = true; save();
    const p = S.p, sp = SPORTS.find(x => x.id === S.sport) || SPORTS[0];
    const payload = {
      email: (S.acct && S.acct.email) || '',
      sport: sp.ar,
      name: p.name,
      sex: optLabelAr('sex', p.sex),
      dob: p.dob,
      hUnit: optLabelAr('hUnit', p.hUnit),
      h: p.hUnit === 'ftin' ? `${p.hFeet}'${p.hInch}"` : String(p.h),
      wUnit: optLabelAr('wUnit', p.wUnit),
      w: p.wUnit === 'lb' ? String(p.wLb) : String(p.w),
      exp: optLabelAr('exp', p.exp),
      life: optLabelAr('life', p.life),
      days: String(p.days),
      split: S.sport === 'gym' ? optLabelAr('split', p.split) : '',
      goal: optLabelAr('goal', p.goal),
      cg: optLabelAr('cg', p.cg),
      buildStyle: t('تلقائي: يُبنى من إجابات الإعداد، ثم الدخول لاحقاً بنفس البريد', 'Automatic: built from the onboarding answers, then signing back in with the same email'),
      cardio: optLabelAr('cardio', p.cardio ? 'y' : 'n'),
      dur: optLabelAr('dur', p.dur),
      loc: optLabelAr('loc', p.loc)
    };
    try { await apiCall('saveProfile', payload); } catch (e) { /* offline: local progress is already saved, Sheet will catch up on next login */ }
    location.href = 'index.html';
  }
};
['authGo', 'welcomeGo', 'introNext', 'introSkip', 'obPick', 'obDate', 'obHNext', 'obWNext', 'obText', 'obBack'].forEach(k => {
  const f = A[k]; A[k] = function () { UI.anim = true; return f.apply(this, arguments); };
});

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
    UI.phase = S.acct ? 'welcome' : 'auth'; UI.anim = true; draw();
  }, 1000);
})();
