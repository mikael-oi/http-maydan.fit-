/* ==========================================================================
   SETUP — personal-details pages (welcome, intro, questionnaire, result).
   Reached ONLY right after "create account" on login.html (or from Settings -> Redo setup).
   When finished it saves the profile to the Sheet and sends the user back to login.html.
   ========================================================================== */
const REDO = new URLSearchParams(location.search).has('redo');
let PENDING = '';
try { PENDING = sessionStorage.getItem(PENDING_KEY) || ''; } catch (e) { /* ignore */ }

/* guard: nobody gets here without a fresh account (or being logged in for "redo") */
if (!PENDING && !(REDO && S.acct)) location.replace('login.html');

if (REDO) { UI.phase = 'intro'; UI.is = 0; } else { UI.phase = 'welcome'; }
S.done = false;   // in memory; becomes true only after the profile is saved

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

const PHASES = { welcome: welcomeView, intro: introView, onb: onbView };

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
  welcomeGo() { UI.phase = 'intro'; UI.is = 0; redraw(); toTop(); },
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
    const p = S.p, sp = SPORTS.find(x => x.id === S.sport) || SPORTS[0];
    const email = REDO ? (S.acct && S.acct.email) || '' : PENDING;
    const payload = {
      email,
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
    try {
      const res = await apiCall('saveProfile', payload);
      if (!res || res.status !== 'success') throw new Error((res && res.message) || 'save failed');
    } catch (e) {
      toast(t('تعذّر حفظ بياناتك، تحقق من الإنترنت وحاول مرة أخرى', 'Could not save your details, check your connection and try again'));
      return;
    }
    S.done = true;
    if (REDO) { save(); location.href = 'index.html'; return; }
    /* new account: NOT logged in -> back to the login page */
    try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* ignore */ }
    S.acct = null; save();
    location.href = 'login.html?setup=done';
  }
};
['welcomeGo', 'introNext', 'introSkip', 'obPick', 'obDate', 'obHNext', 'obWNext', 'obText', 'obBack'].forEach(k => {
  const f = A[k]; A[k] = function () { UI.anim = true; return f.apply(this, arguments); };
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (el && A[el.dataset.a]) A[el.dataset.a](el.dataset.v, el, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter) { e.preventDefault(); A[e.target.dataset.enter](); }
});

UI.anim = true; draw();
