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

function acctView() {
  const B = (l, c, label, a, v = '') => `<button class="opt acct" data-a="${a}" data-v="${v}"><span class="ci" style="background:${c}26;color:${c};font-weight:800">${l}</span>${label}</button>`;
  return `<div class="ob"><div class="top"><span></span><span></span>${langBtn()}</div>
    <h1>${t('أنشئ حسابك', 'Create your account')}</h1>
    <p class="sub">${t('احفظ تقدمك وافتحه من أي جهاز.', 'Save your progress and open it on any device.')}</p>
    <div class="opts">
      ${B('G', '#FEFFFC', t('المتابعة مع Google', 'Continue with Google'), 'signIn', 'google')}
      ${B('A', '#F4F4F4', t('المتابعة مع Apple', 'Continue with Apple'), 'signIn', 'apple')}
      ${UI.email
        ? `<label class="sr-only" for="em">${t('البريد الإلكتروني', 'Email')}</label><input id="em" class="txt" style="font-size:18px" type="email" inputmode="email" autocomplete="email" placeholder="you@email.com" dir="ltr"><button class="go" data-a="emailGo">${t('متابعة', 'Continue')}</button>`
        : B('@', '#D0FF00', t('التسجيل بالبريد الإلكتروني', 'Sign up with email'), 'emailMode')}
    </div>
    <button class="bk" style="margin-top:18px;align-self:center" data-a="signIn" data-v="guest">${t('المتابعة كضيف', 'Continue as guest')}</button>
    <p class="note" style="text-align:center;margin-top:auto;padding-top:20px">${t('نسخة تجريبية: لا يُرسل أي شيء لأي خادم.', 'Prototype: nothing is sent to any server.')}</p></div>`;
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
  { k: 'age', t: 'n', u: ['سنة', 'years'], q: ['كم عمرك؟', 'How old are you?'] },
  { k: 'h', t: 'n', u: ['سم', 'cm'], q: ['كم طولك؟', 'How tall are you?'] },
  { k: 'w', t: 'n', u: ['كغ', 'kg'], q: ['كم وزنك؟', 'What is your weight?'] },
  { k: 'life', t: 'c', o: [['1.2', 'مكتبي، حركة قليلة', 'Desk job, little movement'], ['1.3', 'حركة خفيفة خلال اليوم', 'Light daily movement'], ['1.4', 'عمل بدني أو مشي كثير', 'Physical job or lots of walking']], q: ['كيف يومك العادي خارج التمرين؟', 'How active is your day outside training?'] },
  { k: 'days', t: 'c', o: [2, 3, 4, 5, 6].map(n => [String(n), n === 2 ? 'يومان' : `${n} ${n > 10 ? 'يوماً' : 'أيام'}`, `${n} days`]), q: ['كم يوم تتدرب بالأسبوع؟', 'How many days do you train per week?'] },
  { k: 'split', t: 'c', gym: true, o: [['auto', 'اقتراح التطبيق', 'App suggestion'], ['ppl', 'دفع / سحب / أرجل', 'Push / Pull / Legs'], ['arn', 'أرنولد', 'Arnold'], ['reg', 'عادية (علوي/سفلي أو جسم كامل)', 'Regular (upper/lower or full body)']], q: ['كيف تحب تقسيمة تمارين الجيم؟', 'Which gym split do you prefer?'] },
  { k: 'exp', t: 'c', o: LEVELS, q: ['ما مستوى خبرتك؟', 'What is your experience level?'] },
  { k: 'goal', t: 'c', o: Object.keys(GOALS).map(k => [k, GOALS[k].ar, GOALS[k].en]), q: ['ما هدف تدريبك الأساسي؟', 'What is your main training goal?'] },
  { k: 'cg', t: 'c', o: [['cut', 'تنشيف (خسارة دهون)', 'Lose fat'], ['keep', 'ثبات الوزن', 'Maintain weight'], ['bulk', 'زيادة كتلة', 'Gain muscle']], q: ['ما هدفك بالوزن؟', 'What is your weight goal?'] }
];
const steps = () => STEPS.filter(s => !s.gym || sport() === 'gym');

function onbView() {
  const list = steps(), n = list.length;
  if (UI.os >= n) return resultView();
  const s = list[UI.os], cur = S.p[s.k];
  let body;
  if (s.t === 'c') {
    body = `<div class="opts">${s.o.map(o => `<button class="opt" aria-pressed="${String(cur) === String(o[0])}" data-a="obPick" data-v="${esc(o[0])}">${esc(isEn() ? o[2] : o[1])}</button>`).join('')}</div>`;
  } else if (s.t === 't') {
    body = `<label class="sr-only" for="nv">${pair(s.q)}</label><input id="nv" class="txt" type="text" maxlength="24" autocomplete="given-name" placeholder="${esc(pair(s.ph))}" value="${esc(cur)}" data-enter="obText"><button class="go" style="margin-top:22px" data-a="obText">${t('التالي', 'Next')}</button>`;
  } else {
    const [lo, hi] = LIMITS[s.k];
    body = `<div class="numbox"><button data-a="obStep" data-v="-1" aria-label="${t('أنقص', 'Decrease')}">−</button><input id="nv" type="number" inputmode="numeric" min="${lo}" max="${hi}" value="${cur}" aria-label="${pair(s.q)}" data-enter="obNext"><button data-a="obStep" data-v="1" aria-label="${t('زِد', 'Increase')}">+</button></div><div class="unit">${pair(s.u)}</div><button class="go" data-a="obNext">${t('التالي', 'Next')}</button>`;
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

const PHASES = { boot: bootView, acct: acctView, welcome: welcomeView, intro: introView, onb: onbView };

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
  signIn(v) { S.acct = { t: v }; UI.phase = 'welcome'; redraw(); toTop(); },
  emailMode() { UI.email = true; draw(); const i = $('#em'); if (i) i.focus(); },
  emailGo() { const i = $('#em'); if (!/^\S+@\S+\.\S+$/.test(i.value.trim())) { i.focus(); toast(t('أدخل بريداً صحيحاً', 'Enter a valid email')); return; } A.signIn('email'); },
  welcomeGo() { if (S.done) { location.href = 'index.html'; return; } UI.phase = 'intro'; UI.is = 0; redraw(); toTop(); },
  pickSport(v) { S.sport = v; redraw(); },
  introNext() { if (UI.is < 1) { UI.is++; draw(); toTop(); } else A.introSkip(); },
  introSkip() { UI.phase = 'onb'; UI.os = 0; redraw(); toTop(); },
  obPick(v) { const k = steps()[UI.os].k; S.p[k] = (k === 'life' || k === 'days') ? +v : v; UI.os++; redraw(); toTop(); },
  obStep(v) { const k = steps()[UI.os].k, i = $('#nv'); S.p[k] = clamp(Math.round(+i.value || S.p[k]) + +v, ...LIMITS[k]); i.value = S.p[k]; save(); },
  obNext() { const k = steps()[UI.os].k, i = $('#nv'); S.p[k] = clamp(Math.round(+i.value) || S.p[k], ...LIMITS[k]); UI.os++; redraw(); toTop(); },
  obText() { const i = $('#nv'), v = i.value.trim(); if (!v) { i.focus(); toast(t('اكتب اسمك', 'Enter your name')); return; } S.p.name = v.slice(0, 24); UI.os++; redraw(); toTop(); },
  obBack() { if (UI.os === 0) { UI.phase = 'intro'; UI.is = 1; } else UI.os--; draw(); toTop(); },
  finish() { S.done = true; save(); location.href = 'index.html'; }
};
['signIn', 'welcomeGo', 'introNext', 'introSkip', 'obPick', 'obNext', 'obText', 'obBack'].forEach(k => {
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
    UI.phase = S.acct ? 'welcome' : 'acct'; UI.anim = true; draw();
  }, 1000);
})();
