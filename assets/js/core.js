/* ==========================================================================
   CORE — shared between login.html and index.html
   Loaded AFTER assets/data/*.json have been fetched and assigned to window
   (GOALS, ACC, GYM_MET, SPORTS, LEVELS, AGE_BANDS, EN, TPL, W, HEALTH, ARN,
   PPL, REG, GYM_SPLITS, SPORT_PROGRAMS, STORIES, QUOTES, PRAISE). See data-loader.js.
   ========================================================================== */

/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = n => String(n).padStart(2, '0');
const ds = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dkey = o => { const d = new Date(); d.setDate(d.getDate() + o); return ds(d); };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en');
const r25 = x => Math.max(2.5, Math.round(x / 2.5) * 2.5);
const e1rm = (w, r) => w * (1 + r / 30);
const parseDays = s => s.split(',').map(x => { const y = x.split(':'); return { k: y[0], l: y[1] }; });
const cssEsc = v => (window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/[^\w-]/g, '\\$&'));
const toTop = () => window.scrollTo(0, 0);

/* ---------- config ---------- */
const KEY = 'maydanfit.v2';
const OLD_KEY = 'hadeed1';              // migrates data from the first prototype
const STEP_GOAL = 8000;
const TABS = ['home', 'plan', 'log', 'prog', 'rec', 'lib'];
const LIMITS = { age: [12, 80], h: [120, 230], w: [30, 250], hFeet: [3, 7], hInch: [0, 11], wLb: [66, 550] };
const MAX_LOGS = 600, MAX_HIST = 400;

/* ---------- account backend (Google Apps Script + Google Sheet) ---------- */
const API_URL = "https://script.google.com/macros/s/AKfycbzq49pfqtrN1kMKqQWvtzuFNu1hmEYNFPRRIJe_plJe4hS-D97vwxUByraQlVlH8JbeCQ/exec";
/* text/plain avoids a CORS preflight (OPTIONS) that this Apps Script endpoint can't answer;
   e.postData.contents on the server still parses fine as JSON regardless of the header. */
async function apiCall(action, payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ action }, payload))
  });
  if (!res.ok) throw new Error('http ' + res.status);
  return res.json();
}

/* ---------- unit conversions ---------- */
const cmFromFtIn = (ft, inch) => ft * 30.48 + inch * 2.54;
const ftInFromCm = cm => { const total = cm / 2.54, ft = Math.floor(total / 12); return { ft, inch: Math.round(total - ft * 12) }; };
const kgFromLb = lb => lb * 0.453592;
const lbFromKg = kg => kg / 0.453592;
const ageFromDob = dob => { const d = new Date(dob); if (isNaN(d)) return 24; return Math.floor((Date.now() - d.getTime()) / 31557600000); };

/* ---------- state ---------- */
const DEFAULTS = () => ({
  v: 2, lang: 'ar', sport: 'gym', done: false, acct: null, tab: 'home', day: 0, pt: 'r', mo: 0,
  p: {
    name: '', sex: 'm', age: 24, dob: '', h: 175, w: 75, life: 1.2, days: 4, exp: 'mid', goal: 'hyp', cg: 'keep', split: 'auto',
    hUnit: 'cm', hFeet: 5, hInch: 9, wUnit: 'kg', wLb: 165, cardio: false, dur: 60, loc: 'gym'
  },
  logs: [], hist: [], pr: {}, act: {},
  rec: { d: '', sleep: 7, sore: 2, stress: 2, en: 4 },
  wt: { d: '', n: 0 }, sp: { d: '', n: 0 },
  sess: null, f: {}, prefs: { rest: true, sound: true }
});

function load() {
  const s = DEFAULTS();
  let raw = null;
  try { raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY); } catch (e) { /* storage blocked */ }
  if (!raw) return s;
  let o;
  try { o = JSON.parse(raw); } catch (e) { return s; }
  if (!o || typeof o !== 'object') return s;

  const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
  if (isObj(o.p)) for (const k of Object.keys(s.p)) if (o.p[k] !== undefined) s.p[k] = o.p[k];
  for (const k of ['lang', 'sport', 'done', 'acct', 'tab', 'day', 'pt', 'mo', 'sess']) if (o[k] !== undefined) s[k] = o[k];
  for (const k of ['rec', 'wt', 'sp', 'f', 'prefs', 'pr', 'act']) if (isObj(o[k])) s[k] = Object.assign(s[k], o[k]);
  if (Array.isArray(o.logs)) s.logs = o.logs.filter(l => l && l.ex && l.w > 0 && l.r > 0).slice(-MAX_LOGS);
  if (Array.isArray(o.hist)) s.hist = o.hist.filter(h => h && typeof h.d === 'string').slice(-MAX_HIST);

  /* normalise */
  const p = s.p, legacyExp = { 'مبتدئ': 'beg', 'متوسط': 'mid', 'متقدم': 'adv' };
  p.exp = legacyExp[p.exp] || p.exp;
  if (!LEVELS.some(l => l[0] === p.exp)) p.exp = 'mid';
  if (!GOALS[p.goal]) p.goal = 'hyp';
  for (const k of ['age', 'h', 'w']) p[k] = clamp(Math.round(+p[k]) || DEFAULTS().p[k], LIMITS[k][0], LIMITS[k][1]);
  p.days = clamp(Math.round(+p.days) || 4, 2, 6);
  p.life = [1.2, 1.3, 1.4].includes(+p.life) ? +p.life : 1.2;
  p.name = String(p.name || '').slice(0, 24);
  if (!['m', 'f'].includes(p.sex)) p.sex = 'm';
  if (!['auto', 'ppl', 'arn', 'reg'].includes(p.split)) p.split = 'auto';
  if (!['cut', 'keep', 'bulk'].includes(p.cg)) p.cg = 'keep';
  if (!['cm', 'ftin'].includes(p.hUnit)) p.hUnit = 'cm';
  if (!['kg', 'lb'].includes(p.wUnit)) p.wUnit = 'kg';
  p.hFeet = clamp(Math.round(+p.hFeet) || 5, LIMITS.hFeet[0], LIMITS.hFeet[1]);
  p.hInch = clamp(Math.round(+p.hInch) || 0, LIMITS.hInch[0], LIMITS.hInch[1]);
  p.wLb = clamp(Math.round(+p.wLb) || 165, LIMITS.wLb[0], LIMITS.wLb[1]);
  p.cardio = !!p.cardio;
  if (![30, 45, 60, 90].includes(+p.dur)) p.dur = 60; else p.dur = +p.dur;
  if (!['gym', 'home', 'out'].includes(p.loc)) p.loc = 'gym';
  if (s.lang !== 'en') s.lang = 'ar';
  if (!SPORTS.some(x => x.id === s.sport)) s.sport = 'gym';
  if (!TABS.includes(s.tab)) s.tab = 'home';
  s.day = Math.max(0, Math.round(+s.day) || 0);
  if (s.sess && !(isObj(s.sess) && isObj(s.sess.ck))) s.sess = null;
  return s;
}

let S = load();
function save() {
  try {
    S.logs = S.logs.slice(-MAX_LOGS); S.hist = S.hist.slice(-MAX_HIST);
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) { /* quota or private mode: app still works for this session */ }
}

/* transient UI state (not persisted) */
const UI = { phase: 'boot', is: 0, os: 0, libN: 10, ask: null, anim: false, authTab: 'login', authEmail: '', authBusy: false };

/* ---------- i18n ---------- */
const isEn = () => S.lang === 'en';
const t = (ar, en) => (isEn() ? en : ar);
const pair = p => p[isEn() ? 1 : 0];
const tn = s => (isEn() ? (EN[s] || s) : s);
const gname = k => GOALS[k][isEn() ? 'en' : 'ar'];
const spname = id => { const x = SPORTS.find(s => s.id === id) || SPORTS[0]; return x[isEn() ? 'en' : 'ar']; };

/* RTL text with numbers: "3–5 × 6–12", "2192 kcal", "8%" would render mirrored. Isolate those runs as LTR. */
const BIDI_RE = /\d[\d.,]*(?:\s?[–×]\s?\d[\d.,]*)+(?:\s?(?:kcal|kg|g|km|min|s|m)\b|%)?|\d[\d.,]*\s?(?:kcal|kg|g|km|min)\b|\d[\d.,]*%/g;
const bidi = html => (isEn() ? html : html.split(/(<[^>]+>)/).map((x, i) => (i % 2 ? x : x.replace(BIDI_RE, m => `<bdi dir="ltr">${m}</bdi>`))).join(''));
const redraw = () => { save(); draw(); };

/* ==========================================================================
   ENGINE — pure(ish) domain logic
   ========================================================================== */
const goal = () => GOALS[S.p.goal] || GOALS.hyp;
const sport = () => S.sport || 'gym';
const today = () => ds();

const waterN = () => (S.wt.d === today() ? S.wt.n : 0);
const stepsN = () => (S.sp.d === today() ? S.sp.n : 0);
const waterGoal = () => Math.ceil(S.p.w * 35 / 250);
const doneToday = () => S.hist.some(x => x.d === today());

function best(ex) { let m = 0; for (const l of S.logs) if (l.ex === ex) { const v = e1rm(l.w, l.r); if (v > m) m = v; } return m; }
const lastW = n => (S.pr[n] && S.pr[n].l) || 0;
const suggest = n => { const b = best(n); return b ? r25(b * goal().mid / 100) : lastW(n); };

function readiness(r = S.rec) {
  return clamp(Math.round(Math.min(r.sleep / 8, 1) * 40 + (5 - r.sore) / 4 * 25 + (5 - r.stress) / 4 * 15 + (r.en - 1) / 4 * 20), 0, 100);
}
const readyColor = s => (s >= 75 ? 'var(--ok)' : s >= 50 ? 'var(--warn)' : 'var(--bad)');
const readyMsg = s => (s >= 75 ? t('جاهز: نفّذ الجلسة كما هي.', 'Ready: do the session as planned.')
  : s >= 50 ? t('جاهزية متوسطة: خفّف الحجم 10–20% وابقَ بعيداً عن الفشل.', 'Moderate readiness: cut volume 10–20% and stay away from failure.')
  : t('جاهزية منخفضة: الأفضل راحة أو مشي خفيف اليوم.', 'Low readiness: rest or a light walk is best today.'));

/* Mifflin–St Jeor; training calories ≈ 5 kcal·kg⁻¹ per session, averaged over the week */
function calc() {
  const p = S.p, bmr = 10 * p.w + 6.25 * p.h - 5 * p.age + (p.sex === 'f' ? -161 : 5);
  const base = bmr * (+p.life || 1.2), wit = base + p.days * 5 * p.w / 7;
  const adj = (p.cg === 'cut' && p.age >= 18) ? -0.15 : p.cg === 'bulk' ? 0.1 : 0;
  return { bmr, base, wit, tg: wit * (1 + adj) };
}

/* which program does the user get? */
function plan(n) {
  const p = S.p, d = clamp(+n || +p.days || 4, 2, 6), sp = sport();
  if (p.goal === 'health') return { n: ['مسار الصحة واللياقة', 'Health & fitness track'], w: W.health, d: parseDays(HEALTH[d]) };
  if (sp !== 'gym') { const q = SPORT_PROGRAMS[sp]; return { n: q.n, w: q.w, d: parseDays(q.d[d]) }; }
  const m = GYM_SPLITS[p.split];
  if (m && d >= 3) return { n: m.n, w: m.w, d: parseDays(m.d[d]) };
  if (d <= 3) return { n: d < 3 ? ['جسم كامل (أ / ب)', 'Full body (A / B)'] : ['جسم كامل (أ / ب / ج)', 'Full body (A / B / C)'], w: W.fullBody, d: parseDays(d < 3 ? 'fa:جسم كامل أ,fb:جسم كامل ب' : REG[3]) };
  if (d === 4) return { n: ['علوي / سفلي', 'Upper / Lower'], w: W.upLow, d: parseDays(REG[4]) };
  const adv = p.exp === 'adv';
  if (d === 5) return adv ? { n: ['أرنولد (5 أيام)', 'Arnold (5 days)'], w: W.arnold, d: parseDays(ARN[5]) }
    : { n: ['دفع / سحب / أرجل + علوي / سفلي', 'Push / Pull / Legs + Upper / Lower'], w: W.ppl, d: parseDays(PPL[5]) };
  return adv ? { n: ['أرنولد (مرتين أسبوعياً)', 'Arnold (twice weekly)'], w: W.arnold, d: parseDays(ARN[6]) }
    : { n: ['دفع / سحب / أرجل (مرتين أسبوعياً)', 'Push / Pull / Legs (twice weekly)'], w: W.ppl, d: parseDays(PPL[6]) };
}

/* ---------- training-location equipment substitution (gym split only) ----------
   "home" assumes a pair of dumbbells + bodyweight; "out" assumes bodyweight + a park bar only. */
const HOME_SUB = {
  'بنش بريس': ['ضغط صدر أرضي (دمبل)', 'Floor dumbbell press'],
  'ترايسبس بوش داون': ['ترايسبس بالدمبل خلف الرأس', 'Dumbbell overhead triceps extension'],
  'سحب علوي': ['تجديف مطاطي أو بار منزلي', 'Band row or doorway pull-up bar'],
  'تجديف بار': ['تجديف دمبل أحادي', 'Single-arm dumbbell row'],
  'تجديف كابل جلوس': ['تجديف دمبل منحني', 'Bent-over dumbbell row'],
  'فيس بول': ['فيس بول بالمطاط', 'Band face pull'],
  'سكوات': ['سكوات بالدمبل أو وزن الجسم', 'Dumbbell or bodyweight squat'],
  'ديدلفت روماني': ['ديدلفت روماني بالدمبل', 'Dumbbell Romanian deadlift'],
  'ضغط أرجل': ['سكوات بلغاري (دمبل)', 'Bulgarian split squat (dumbbell)'],
  'كيرل أرجل خلفي': ['نوردك هامسترينغ أو كيرل بمنشفة', 'Nordic curl or towel leg curl'],
  'قفز صندوق': ['قفز عمودي', 'Vertical jump'],
  'سوينغ كيتل بيل': ['سكوات قفز (وزن الجسم)', 'Squat jump (bodyweight)']
};
const OUT_SUB = {
  'بنش بريس': ['ضغط (Push-ups)', 'Push-ups'],
  'ضغط مائل دمبل': ['ضغط عالي (قدمين مرفوعتين)', 'Decline push-up (feet elevated)'],
  'ضغط أكتاف دمبل': ['ضغط كتف بالحائط أو انحناء', 'Pike push-up'],
  'رفرفة جانبية': ['رفرفة جانبية بالمقاومة الذاتية', 'Isometric lateral raise hold'],
  'ترايسبس بوش داون': ['ضغط ترايسبس على مقعد (Dips)', 'Bench/park dips'],
  'سحب علوي': ['عقلة (Pull-up)', 'Pull-up'],
  'تجديف بار': ['تجديف مقلوب تحت بار', 'Inverted row (bar/low rail)'],
  'تجديف كابل جلوس': ['تجديف مقلوب تحت بار', 'Inverted row (bar/low rail)'],
  'فيس بول': ['عقلة عكسية أو تجديف مقلوب واسع', 'Wide inverted row'],
  'كيرل بايسبس': ['عقلة سفلى (قبضة معكوسة)', 'Chin-up (underhand grip)'],
  'سكوات': ['سكوات بوزن الجسم', 'Bodyweight squat'],
  'ديدلفت روماني': ['ديدلفت رجل واحدة (وزن الجسم)', 'Single-leg bodyweight deadlift'],
  'ضغط أرجل': ['سكوات بلغاري (وزن الجسم)', 'Bodyweight Bulgarian split squat'],
  'كيرل أرجل خلفي': ['نوردك هامسترينغ', 'Nordic hamstring curl'],
  'بولوفر دمبل': ['بولوفر بوزن الجسم (على مقعد)', 'Bodyweight pullover (bench)'],
  'قفز صندوق': ['قفز عمودي', 'Vertical jump'],
  'سوينغ كيتل بيل': ['سكوات قفز', 'Squat jump'],
  'رمي كرة طبية': ['ضغط متفجر (Plyo push-up)', 'Plyo push-up']
};
for (const map of [HOME_SUB, OUT_SUB]) for (const k in map) if (!EN[map[k][0]]) EN[map[k][0]] = map[k][1];
function locSub(name) {
  if (sport() !== 'gym') return name;
  const map = S.p.loc === 'home' ? HOME_SUB : S.p.loc === 'out' ? OUT_SUB : null;
  return (map && map[name]) ? map[name][0] : name;
}

/* session duration actually reshapes the day: short sessions keep only the first (compound) rows,
   long sessions get an extra set added to each lift */
function applyDuration(rows) {
  const dur = S.p.dur;
  if (sport() !== 'gym' || !rows.length) return rows;
  if (dur <= 30) return rows.slice(0, Math.min(3, rows.length));
  if (dur <= 45) return rows.slice(0, Math.min(5, rows.length));
  if (dur >= 90) return rows.map(r => (r.kind === 'lift' && r.s > 0 && r.s < 6) ? Object.assign({}, r, { s: r.s + 1 }) : r);
  return rows;
}

/* one source of truth for the selected day's exercises: used by Plan AND Session */
const SETS_RE = /^(\d+)(?:–\d+)?\s*×\s*(?:\d+–)?(\d+)$/;     // "3 × 5–8", "3–4 × 4–6"
function dayRows() {
  const p = S.p, g = goal(), pl = plan(), days = pl.d, di = clamp(S.day, 0, days.length - 1), dd = days[di], tp = TPL[dd.k];
  let rows = [];
  const add = o => rows.push(Object.assign({ s: 1, r: 0, rest: 0, w: 0, kind: 'lift' }, o));

  if (p.goal === 'pow' && tp.dr && !tp.t) {
    const n = locSub(tp.dr);
    add({ n, kind: 'drill', s: 3, r: 4, rest: 150, w: lastW(n), pr: ['3 × 3–5 بسرعة قصوى، راحة 2–3 د', '3 × 3–5 at max speed, rest 2–3 min'] });
  }
  for (const e0 of tp.x) {
    const e = Object.assign({}, e0, { n: locSub(e0.n) });
    if (tp.t === 'hc') add({ n: e.n, kind: 'timed', pr: e.sub });
    else if (tp.t === 'hm') add({ n: e.n, kind: 'timed', pr: ['2 × 30–45 ث بدون ألم', '2 × 30–45 s pain-free'] });
    else if (tp.t === 'hs') add({ n: e.n, s: 3, r: 12, rest: 60, w: lastW(e.n), pr: ['3 × 10–15، راحة 60–90 ث', '3 × 10–15, rest 60–90 s'] });
    else if (tp.t === 'f') {
      const m = SETS_RE.exec(e.sub[0]);
      if (m) add({ n: e.n, s: +m[1], r: +m[2], rest: 90, w: lastW(e.n), pr: e.sub });
      else add({ n: e.n, kind: 'timed', pr: e.sub });
    } else if (e.c) {
      add({ n: e.n, s: parseInt(g.sets, 10) || 3, r: g.r[1], rest: g.restSec, w: suggest(e.n),
        pr: [`${g.sets} × ${g.r[0]}–${g.r[1]}، راحة ${g.rest[0]}`, `${g.sets} × ${g.r[0]}–${g.r[1]}, rest ${g.rest[1]}`] });
    } else {
      const a = ACC[p.goal] || ACC.hyp;
      add({ n: e.n, s: a[0], r: parseInt(a[1].split('–')[1], 10) || 10, rest: 75, w: lastW(e.n),
        pr: [`${a[0]} × ${a[1]}، راحة 60–90 ث`, `${a[0]} × ${a[1]}, rest 60–90 s`] });
    }
  }
  rows = applyDuration(rows);
  if (p.cardio && sport() === 'gym' && tp.t !== 'hc') {
    rows.push({ n: 'كارديو ختامي', kind: 'timed', s: 1, r: 0, rest: 0, w: 0,
      pr: ['15–20 دقيقة كارديو خفيف إلى متوسط', '15–20 min light-to-moderate cardio'] });
  }
  return { name: dd.l, di, days, rows, plan: pl, sig: rows.map(r => r.n).join('|') };
}

function met() {
  const sp = sport();
  return sp === 'gym' ? (GYM_MET[S.p.goal] || 5) : (SPORTS.find(x => x.id === sp).met || 5);
}

/* daily commitment (workout + water + steps), pure; commit() stores it */
function commitPct() {
  const w = clamp(waterN() / waterGoal() * 100, 0, 100), s = clamp(stepsN() / STEP_GOAL * 100, 0, 100), d = doneToday();
  let c = Math.round(((d ? 100 : 0) + w + s) / 3);
  if (d) c = Math.max(c, 50);
  return c;
}
function commit() { const c = commitPct(); S.act[today()] = c; return c; }
function streak() {
  let n = 0, o = 0;
  if (!((S.act[dkey(0)] || 0) >= 50)) o = -1;
  while ((S.act[dkey(o)] || 0) >= 50 && n < 999) { n++; o--; }
  return n;
}

/* ==========================================================================
   VIEW HELPERS
   ========================================================================== */
const svg = (p, z = 22) => `<svg viewBox="0 0 24 24" width="${z}" height="${z}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ci = (p, c) => `<span class="ci" style="background:${c}26;color:${c}">${svg(p, 20)}</span>`;
const IC = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  plan: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  log:  '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
  prog: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  rec:  '<path d="M20 14a8 8 0 1 1-10-10 6 6 0 0 0 10 10z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
};

const chip = (label, on, a, v = '') => `<button class="chip" aria-pressed="${!!on}" data-a="${a}" data-v="${esc(v)}">${label}</button>`;
const langBtn = () => `<button class="lg" data-a="lang" aria-label="${t('Switch to English', 'التبديل إلى العربية')}">${isEn() ? 'العربية' : 'English'}</button>`;

function ring(p, c, l, z = 92) {
  const C = 2 * Math.PI * 34;
  return `<div style="text-align:center"><svg width="${z}" height="${z}" viewBox="0 0 80 80" role="img" aria-label="${esc(l)} ${p}%"><circle cx="40" cy="40" r="34" fill="none" stroke="var(--bd)" stroke-width="9"/><circle cx="40" cy="40" r="34" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(p / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 40 40)"/><text x="40" y="45" text-anchor="middle" font-size="16" font-weight="800" fill="var(--tx)">${p}%</text></svg><div class="note" style="margin:0">${esc(l)}</div></div>`;
}
function flame(z) {
  return `<svg class="fl" width="${z}" height="${z}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4.5 3-7 1 1.5 1 3 2 3 0-3-1-5 1-8z" fill="#D0FF00"/><path d="M12 22a3 3 0 0 0 3-3c0-2-3-3-3-6-1 2-3 3-3 6a3 3 0 0 0 3 3z" fill="#FEFFFC"/></svg>`;
}
const wdn = () => (isEn() ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']);
const pk = (a, i) => a[i % a.length][isEn() ? 1 : 0];
const dayI = () => Math.floor(Date.now() / 864e5);
const locale = () => (isEn() ? 'en' : 'ar-JO-u-nu-latn');

function wkRow(rings) {
  const n = new Date(), nm = wdn();
  let h = '<div class="wk">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(n); d.setDate(n.getDate() - n.getDay() + i);
    const k = ds(d), td = k === today(), ok = (S.act[k] || 0) >= 50;
    h += `<div>${rings ? `<span class="rg2${ok ? ' ok' : td ? ' td' : ''}">${d.getDate()}</span>` : `<span class="wc${ok ? ' ok' : td ? ' td' : ''}">${ok ? '✓' : ''}</span>`}<small>${nm[i]}</small></div>`;
  }
  return h + '</div>';
}

/* ---------- toast (shared small notice, both pages have a #toast element) ---------- */
let toastTimer;
function toast(msg) {
  const el = $('#toast'); if (!el) return;
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ==========================================================================
   SHARED BY login.js AND setup.js
   (onboarding questions, label<->code lookups, rehydrating a profile from the Sheet)
   ========================================================================== */
const PENDING_KEY = 'maydanfit.pending';   // sessionStorage: email of an account that was just created and still has to finish setup

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
