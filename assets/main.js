/* ==========================================================================
   MAIN APP — home, plan, session, progress, recovery, library
   Runs on index.html. Requires a finished login/onboarding (core.js's S.done
   and S.acct); otherwise redirects to login.html.
   ========================================================================== */
if (!S.done || !S.acct) location.replace('login.html');

/* ==========================================================================
   VIEWS — home
   ========================================================================== */
function waterCard() {
  const n = waterN(), g = waterGoal(), p = clamp(Math.round(n / g * 100), 0, 100);
  return `<div class="card flex">${ring(p, '#FEFFFC', t('الماء', 'Water'))}<div style="flex:1"><b>${n} ${t('من', 'of')} ${g} ${t('كوب', 'cups')}</b><p class="note">${t('الهدف نحو 35 مل لكل كغ (الكوب 250 مل).', 'Goal is about 35 ml per kg (a cup is 250 ml).')}</p>
    <div class="flex" style="gap:8px;margin-top:8px"><button class="bk" data-a="addW" data-v="-1" aria-label="${t('أنقص كوباً', 'Remove a cup')}">−</button><button class="bk" style="background:#FEFFFC;color:#06142e;border:0" data-a="addW" data-v="1">${t('+ كوب', '+ cup')}</button></div></div></div>`;
}
function stepsCard() {
  const n = stepsN(), p = clamp(Math.round(n / STEP_GOAL * 100), 0, 100), km = n * 0.415 * S.p.h / 100000;
  return `<div class="card flex">${ring(p, '#D0FF00', t('الخطوات', 'Steps'))}<div style="flex:1"><b>${fmt(n)} ${t('من', 'of')} ${fmt(STEP_GOAL)}</b><p class="note">${km.toFixed(1)} ${t('كم، نحو', 'km, about')} ${Math.round(km * S.p.w * .5)} ${t('سعرة', 'kcal')}. ${t('القراءة التلقائية من حساس الهاتف تحتاج التطبيق الأصلي.', 'Automatic reading from the phone sensor needs the native app.')}</p>
    <div class="flex" style="gap:8px;margin-top:8px"><button class="bk" data-a="addS" data-v="-500">−500</button><button class="bk" style="background:#D0FF00;color:#10140a;border:0" data-a="addS" data-v="1000">+1000</button></div></div></div>`;
}
function storiesHtml() {
  return `<div class="sr">${STORIES.map((s, i) => `<button class="story" data-a="story" data-v="${i}"><span class="rg" style="--c:${s[2]}"><span class="in" style="color:${s[2]}">${svg(s[3], 24)}</span></span><small>${isEn() ? s[1] : s[0]}</small></button>`).join('')}</div>`;
}
function streakCard() {
  const c = commitPct(), s = streak(), n = stepsN(), sp = clamp(Math.round(n / STEP_GOAL * 100), 0, 100);
  return `<div class="card"><div class="skh">${flame(54)}<div><small>${t('أيام متتالية', 'DAY STREAK')}</small><b class="big">${s}</b></div><div class="cm"><small>${t('التزام اليوم', 'Today')}</small><b>${c}%</b></div></div>${wkRow()}
    <small class="mut">${t('الخطوات', 'STEPS')}</small><div class="row nb" style="padding:4px 0"><b>${fmt(n)}<span class="mut">/${fmt(STEP_GOAL)}</span></b><span>${sp}%</span></div><div class="pbar" style="margin:0"><i style="width:${sp}%"></i></div></div>`;
}
function nudge() {
  const c = commitPct();
  if (c >= 100) return `<div class="card v"><b>${t('كمّلت كل أهداف اليوم، أنت بطل!', 'All of today\'s goals are done, champion!')}</b></div>`;
  const g = waterGoal(), m = [];
  if (!doneToday()) m.push(t('أنجز جلسة اليوم', 'finish today\'s session'));
  if (waterN() < g) m.push(t(`اشرب ${g - waterN()} كوب إضافي`, `drink ${g - waterN()} more cups`));
  if (stepsN() < STEP_GOAL) m.push(t(`امشِ ${fmt(STEP_GOAL - stepsN())} خطوة`, `walk ${fmt(STEP_GOAL - stepsN())} more steps`));
  return `<div class="card v"><b>${t('لا تكسر السلسلة!', 'Don\'t break your streak!')}</b><p class="note">${m.join(isEn() ? '; ' : '، ')}</p></div>`;
}
function timerCard() {
  return `<div class="card"><b>${t('مؤقت الراحة بين الجولات', 'Rest timer between rounds')}</b><div class="chips" style="margin:10px 0 0">${[30, 60, 90, 120, 180].map(s =>
    `<button class="chip" aria-pressed="false" data-a="restStart" data-v="${s}">${s >= 60 ? (s / 60) + t(' دقيقة', ' min') : s + t(' ثانية', ' sec')}</button>`).join('')}</div></div>`;
}
function readinessCard() {
  if (S.rec.d !== today()) return `<button class="card flex" style="width:100%;text-align:start" data-a="go" data-v="rec">${ci(IC.rec, '#8116E0')}<div><b>${t('كيف جاهزيتك اليوم؟', 'How ready are you today?')}</b><p class="note" style="margin:0">${t('سجّل نومك وطاقتك لتعرف حِمل جلستك.', 'Log your sleep and energy to size today\'s session.')}</p></div></button>`;
  const s = readiness();
  return `<div class="card flex">${ci(IC.rec, '#8116E0')}<div><b>${t('جاهزيتك', 'Readiness')}: ${s}%</b><p class="note" style="margin:0">${readyMsg(s)}</p></div></div>`;
}

function homeView() {
  const g = goal(), d = dayRows(), c = calc(), tp = TPL[d.days[d.di].k];
  return `<div class="hd"><div class="brand">${t('ميدان فِت', 'MAYDAN FIT')}<span>${t('ميدانك', 'Your arena')}</span></div>
      <div class="flex" style="gap:8px">${langBtn()}<button class="lg" data-a="settings" aria-label="${t('الإعدادات', 'Settings')}">${svg(IC.gear, 18)}</button></div></div>
    <h1>${t('أهلاً ', 'Hi ')}${esc(S.p.name || t('بك', 'there'))}</h1>
    ${storiesHtml()}${streakCard()}${nudge()}${readinessCard()}
    <div class="hero"><small>${t('جلسة اليوم: ', 'Today: ')}${gname(S.p.goal)}</small><h2>${esc(tn(d.name))}</h2>
      <div class="meta"><span>${tp.x.length} ${t('تمارين', 'exercises')}</span><span>${doneToday() ? t('تم إنجازها ✓', 'Done ✓') : t('جاهز؟', 'Ready?')}</span></div>
      <button data-a="go" data-v="log">${t('ابدأ الجلسة', 'Start session')}</button></div>
    <div class="card w"><small>${t('مقولة اليوم', 'Quote of the day')}</small><p>${pk(QUOTES, dayI())}</p></div>
    ${timerCard()}${waterCard()}${stepsCard()}
    <div class="card"><div class="row nb"><b>${t('هدفك اليومي', 'Daily target')}</b><b class="ac">${Math.round(c.tg)} kcal</b></div><p class="note">${t('مع التمارين ', 'With training ')}${Math.round(c.wit)}${t(' سعرة، وبدون تمارين ', ' kcal, without ')}${Math.round(c.base)}${t(' سعرة.', ' kcal.')}</p></div>`;
}

/* ==========================================================================
   VIEWS — plan, session, progress, recovery, library
   ========================================================================== */
function planView() {
  const p = S.p, d = dayRows(), sp = sport();
  const goalChips = sp === 'gym'
    ? Object.keys(GOALS).map(k => chip(gname(k), k === p.goal, 'setGoal', k)).join('')
    : chip(spname(sp), p.goal !== 'health', 'setGoal', 'hyp') + chip(gname('health'), p.goal === 'health', 'setGoal', 'health');
  return `<div class="brand">${t('ميدان فِت', 'MAYDAN FIT')}<span>${t('ميدانك', 'Your arena')}</span></div><h1>${t('خطتك', 'Your plan')}</h1>
    ${p.age < 18 ? `<div class="warn">${t('تحت 18 سنة: ركّز على التكنيك وأوزان خفيفة بإشراف، وتجنّب أقصى حمل (1RM).', 'Under 18: focus on technique and light loads with supervision, and avoid max (1RM) lifts.')}</div>` : ''}
    <div class="chips" role="group" aria-label="${t('الرياضة', 'Sport')}">${SPORTS.map(s => chip(s[isEn() ? 'en' : 'ar'], s.id === sp, 'setSport', s.id)).join('')}</div>
    <button class="bk" data-a="go" data-v="lib">${t('مكتبة البرامج وفلترتها', 'Program library & filters')}</button>
    <h2>${t('هدف المرحلة', 'Phase goal')}</h2><div class="chips">${goalChips}</div>
    <h2>${t('أيام التدريب', 'Training days')}</h2><div class="chips">${[2, 3, 4, 5, 6].map(n => chip(`${n} ${t('أيام', 'days')}`, n === +p.days, 'setDays', n)).join('')}</div>
    <div class="card"><b>${pair(d.plan.n)}</b><p class="note">${pair(d.plan.w)}</p></div>
    <div class="chips" role="group" aria-label="${t('أيام البرنامج', 'Program days')}">${d.days.map((x, i) => chip(`${i + 1}. ${esc(tn(x.l))}`, i === d.di, 'setDay', i)).join('')}</div>
    <div class="card">${d.rows.map(r => `<div class="ex"><div><b>${esc(tn(r.n))}</b><small>${esc(pair(r.pr))}</small></div>${r.w && r.kind !== 'drill' ? `<span class="kg">${r.w} ${t('كغ', 'kg')}</span>` : ''}</div>`).join('')}</div>
    ${p.goal !== 'health' && sp === 'gym' ? `<p class="note">${t('زِد 2.5 كغ فقط عندما تصل لأعلى نطاق التكرارات بجهد RPE 8 أو أقل. خذ أسبوع تخفيف كل 4–6 أسابيع.', 'Add 2.5 kg only when you reach the top of the rep range at RPE 8 or lower. Take a deload week every 4–6 weeks.')}</p>` : ''}
    <div class="card"><h2>${t('تغذية داعمة', 'Nutrition')}</h2><p class="sub" style="margin:0">${t('بروتين يومي:', 'Daily protein:')} <b>${Math.round(p.w * 1.6)}–${Math.round(p.w * 2.2)} ${t('غ', 'g')}</b> ${t('(1.6–2.2 غ لكل كغ).', '(1.6–2.2 g per kg).')}</p></div>
    <p class="note">${t('الجدول يبنيه محرك قواعد علمي. بالنسخة الحقيقية يخصصه مدرب الذكاء الاصطناعي أكثر حسب تقدمك.', 'The plan is built by a science-based rules engine. In the full version the AI coach personalizes it further as you progress.')}</p>`;
}

function sessProgress(R) {
  let total = 0, done = 0;
  R.rows.forEach((e, i) => { for (let j = 0; j < e.s; j++) { total++; if (S.sess.ck[`${i}-${j}`]) done++; } });
  return { total, done };
}

function sessView() {
  const R = dayRows(), se = S.sess;
  if (se && se.sig !== R.sig) { S.sess = null; save(); }          // plan changed mid-session → discard stale ticks
  const hd = `<h1>${esc(tn(R.name))}</h1>`;
  if (!S.sess) {
    return `${hd}<p class="sub">${t('جاهز؟ اضغط ابدأ، وعلّم كل مجموعة بعد ما تخلصها.', 'Ready? Press start and tick each set when you finish it.')}</p>
      <div class="card">${R.rows.map(e => `<div class="ex"><div><b>${esc(tn(e.n))}</b><small>${esc(pair(e.pr))}</small></div></div>`).join('')}</div>
      <button class="go" data-a="sessStart">${t('ابدأ الجلسة', 'Start session')}</button>`;
  }
  const { total, done } = sessProgress(R);
  let h = `${hd}<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><i id="pb" style="width:${total ? done / total * 100 : 0}%"></i></div>`;
  R.rows.forEach((e, i) => {
    h += `<div class="card"><div class="row nb"><b>${esc(tn(e.n))}</b><button class="bk" data-a="exInfo" data-v="${i}">${t('شرح', 'Guide')}</button></div><p class="note">${esc(pair(e.pr))}</p>`;
    for (let j = 0; j < e.s; j++) {
      const k = `${i}-${j}`, c = S.sess.ck[k], ok = !!c;
      h += `<div class="st${ok ? ' ok' : ''}${e.r ? '' : ' single'}" id="s${k}">${e.r
        ? `<span>${j + 1}</span><input id="w${k}" type="number" inputmode="decimal" step="0.5" min="0" placeholder="${t('كغ', 'kg')}" aria-label="${t('الوزن', 'Weight')} ${j + 1}" value="${ok ? c.w : (e.w || '')}"${ok ? ' disabled' : ''}><input id="r${k}" type="number" inputmode="numeric" min="0" placeholder="${t('تكرار', 'reps')}" aria-label="${t('التكرارات', 'Reps')} ${j + 1}" value="${ok ? c.r : e.r}"${ok ? ' disabled' : ''}>`
        : `<span class="mut">${t('تم؟', 'Done?')}</span>`}<button class="cb" data-a="chk" data-v="${k}" aria-pressed="${ok}" aria-label="${t('علّم المجموعة', 'Mark set')} ${j + 1}">${ok ? '✓' : ''}</button></div>`;
    }
    h += '</div>';
  });
  return `${h}<button class="go" data-a="sessFinish">${t('إنهاء الجلسة', 'Finish session')}</button>
    <button class="bk" style="margin:12px auto 0;display:block" data-a="sessCancel">${t('إلغاء الجلسة', 'Cancel session')}</button>`;
}

function calView(H) {
  const n = new Date(), o = S.mo || 0, f = new Date(n.getFullYear(), n.getMonth() + o, 1);
  const dm = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate(), m = ds(f).slice(0, 7), set = {};
  H.forEach(x => { set[x.d] = 1; });
  let h = `<div class="card"><div class="row nb"><button class="bk" data-a="mo" data-v="-1" aria-label="${t('الشهر السابق', 'Previous month')}">${isEn() ? '‹' : '›'}</button><b>${f.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}</b><button class="bk" data-a="mo" data-v="1" aria-label="${t('الشهر التالي', 'Next month')}">${isEn() ? '›' : '‹'}</button></div><div class="cal" style="margin-top:10px">${wdn().map(x => `<small>${x}</small>`).join('')}`;
  for (let i = 0; i < f.getDay(); i++) h += '<span></span>';
  for (let d = 1; d <= dm; d++) { const k = `${m}-${pad(d)}`; h += `<span class="${set[k] ? 'wo' : (S.act[k] || 0) >= 50 ? 'tr' : ''}${k === today() ? ' td' : ''}">${d}</span>`; }
  return `${h}</div><p class="note"><b class="vi">●</b> ${t('يوم تمرين', 'Workout day')} &nbsp; <b class="ac">●</b> ${t('يوم ملتزم', 'Committed day')}</p></div>`;
}
function badge(n, cur) {
  return `<div class="card bd${cur >= n ? ' on' : ''}"><span class="hx">${n}</span><b>${n === 7 ? t('أسبوع', '1 week') : n + t(' أيام', ' days')}</b><div class="pbar"><i style="width:${Math.min(100, cur / n * 100)}%"></i></div><small class="mut">${Math.min(cur, n)}/${n}</small></div>`;
}
function progView() {
  const H = S.hist, now = new Date(), ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
  const wk = ds(ws), mo = today().slice(0, 7), pl = +S.p.days || 3, s = streak(), tab = S.pt || 'r';
  const W_ = H.filter(x => x.d >= wk), M = H.filter(x => x.d.slice(0, 7) === mo), mp = Math.min(100, Math.round(M.length / (pl * 4.3) * 100));
  const sum = (a, k) => a.reduce((x, y) => x + (y[k] || 0), 0);
  let h = `<h1>${t('تقدمي', 'Progress')}</h1><div class="seg" role="group"><button aria-pressed="${tab === 'r'}" data-a="ptab" data-v="r">${t('تقارير', 'Reports')}</button><button aria-pressed="${tab === 'c'}" data-a="ptab" data-v="c">${t('التقويم', 'Calendar')}</button></div>`;
  if (tab === 'c') return `${h}<div class="card flex">${flame(44)}<div><b class="big">${s}</b><small class="mut"> ${t('يوم متتالي', 'day streak')}</small></div></div>${calView(H)}`;
  const prs = Object.keys(S.pr).sort((a, b) => S.pr[b].b - S.pr[a].b).slice(0, 8);
  return `${h}${wkRow(true)}<div class="card flex">${flame(48)}<div><b class="big">${s}</b><small class="mut"> ${t('أيام', 'days')}</small><p class="note" style="margin:2px 0 0">${t('جلسات الأسبوع: ', 'Sessions this week: ')}${W_.length}/${pl}</p></div></div>
    <h2>${t('تحديات السلسلة', 'Streak challenges')}</h2><div class="bds">${badge(3, s)}${badge(7, s)}${badge(10, s)}</div>
    <h2>${t('اتجاه الشهر', 'Month trend')}</h2><div class="card"><div class="stats"><div class="stat"><b>${M.length}</b><span>${t('جلسات', 'Sessions')}</span></div><div class="stat"><b>${fmt(sum(M, 'kc'))}</b><span>kcal</span></div><div class="stat"><b>${fmt(sum(M, 'v'))}</b><span>kg</span></div></div><p class="note">${t('التزام الشهر: ', 'Monthly commitment: ')}${mp}%</p></div>
    <h2>${t('أرقامي القياسية', 'Personal records')}</h2><div class="card">${prs.length ? prs.map(n => `<div class="row"><span>${esc(tn(n))}</span><b>${S.pr[n].b} kg</b></div>`).join('') : `<p class="note" style="margin:0">${t('أنهِ أول جلسة لتظهر أرقامك.', 'Finish your first session to see your records.')}</p>`}</div>
    <p class="note">${t('السعرات = MET × وزنك × مدة الجلسة (تقدير).', 'Calories = MET × your weight × session hours (estimate).')}</p>`;
}

function recView() {
  const s = readiness(), c = 2 * Math.PI * 52, g = goal(), r = S.rec;
  const fld = [['sleep', t('ساعات النوم', 'Sleep hours'), 4, 10, 0.5], ['sore', t('ألم العضلات (1 لا شيء – 5 شديد)', 'Muscle soreness (1 none – 5 severe)'), 1, 5, 1], ['stress', t('التوتر (1–5)', 'Stress (1–5)'), 1, 5, 1], ['en', t('الطاقة (1–5)', 'Energy (1–5)'), 1, 5, 1]];
  const tips = [
    t(`هدفك الحالي: ${gname(S.p.goal)}. التزم بنطاق ${g.r[0]}–${g.r[1]} تكرار وراحة ${g.rest[0]}.`, `Your current goal: ${gname(S.p.goal)}. Stick to ${g.r[0]}–${g.r[1]} reps and ${g.rest[1]} rest.`),
    s < 50 ? t('جاهزيتك منخفضة اليوم، قلّل الحجم أو خذ يوم راحة.', 'Your readiness is low today: cut volume or take a rest day.')
      : t('جاهزيتك جيدة. ارفع الوزن فقط عندما تصل لأعلى نطاق التكرارات بجهد RPE 8 أو أقل.', 'Your readiness is good. Add weight only when you reach the top of the rep range at RPE 8 or lower.')
  ];
  if (S.p.exp === 'beg') tips.push(t('كمبتدئ: التكنيك أهم من الوزن. زد 2.5 كغ كحد أقصى كل أسبوع.', 'As a beginner, technique matters more than weight. Add 2.5 kg at most per week.'));
  if (S.p.age < 18) tips.push(t('عمرك تحت 18: ابتعد عن المحاولات القصوى، وتدرّب بإشراف.', 'You are under 18: avoid max attempts and train under supervision.'));
  if (S.p.age >= 40) tips.push(t('بعد الأربعين: أطل الإحماء وزد وقت الاستشفاء بين الجلسات.', 'Over 40: lengthen your warm-up and allow more recovery between sessions.'));
  tips.push(t('كل 4–6 أسابيع خُذ أسبوع تخفيف (Deload) بحجم أقل بنحو 40%.', 'Every 4–6 weeks take a deload week with about 40% less volume.'));
  return `<h1>${t('الاستشفاء', 'Recovery')}</h1><p class="sub">${t('درجة جاهزيتك لليوم', 'Your readiness score today')}</p>
    <div class="card ringbox"><svg width="124" height="124" viewBox="0 0 124 124" role="img" aria-label="${t('الجاهزية', 'Readiness')} ${s}%"><circle cx="62" cy="62" r="52" fill="none" stroke="var(--bd)" stroke-width="12"/><circle cx="62" cy="62" r="52" fill="none" stroke="${readyColor(s)}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(s / 100 * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 62 62)"/><text x="62" y="70" text-anchor="middle" font-size="28" font-weight="800" fill="var(--tx)">${s}%</text></svg><div><b>${readyMsg(s)}</b></div></div>
    <div class="card">${fld.map(f => `<label for="rec-${f[0]}">${f[1]}</label><div class="rng"><input id="rec-${f[0]}" type="range" min="${f[2]}" max="${f[3]}" step="${f[4]}" value="${r[f[0]]}" data-i="rec" data-k="${f[0]}"><b id="rv-${f[0]}">${r[f[0]]}</b></div>`).join('')}</div>
    <div class="card"><h2>${t('راحة العضلة بين الجلسات', 'Muscle rest between sessions')}</h2><p>${t(`لهدف ${gname(S.p.goal)}: انتظر نحو `, `For goal ${gname(S.p.goal)}: wait about `)}<b>${g.hrs} ${t('ساعة', 'hours')}</b>${t(' قبل تدريب نفس العضلة بشدة.', ' before training the same muscle hard.')}</p><p class="note">${t('تقدير عام، يختلف حسب النوم والتغذية وحجم التمرين.', 'General estimate; it varies with sleep, nutrition and training volume.')}</p></div>
    <h2>${t('نصائح المدرب', 'Coach tips')}</h2><div class="card"><ul>${tips.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <div class="card"><h2>${t('المدرب الذكي (AI)', 'AI coach')}</h2><p class="note" style="margin:0">${t('في النسخة القادمة: اسأل عن تمرين أو ألم أو خطة، ويجيبك مدرب ذكي يعرف سجلّك.', 'Coming soon: ask about an exercise, pain or a plan, and a smart coach that knows your history answers.')}</p></div>
    <div class="warn">${t('التطبيق ليس بديلاً عن الطبيب. أي ألم حاد أو مستمر يحتاج مختصاً.', 'The app is not a substitute for a doctor. Any sharp or persistent pain needs a specialist.')}</div>`;
}

function libView() {
  const f = S.f || {}, m = [];
  for (const sp of SPORTS) for (const g of (sp.id === 'gym' ? Object.keys(GOALS) : ['hyp'])) for (const d of [2, 3, 4, 5, 6]) for (const lv of LEVELS) for (const ag of AGE_BANDS) {
    if (ag[0] === 'u' && g === 'max') continue;
    if ((f.sp && f.sp !== sp.id) || (f.d && f.d !== String(d)) || (f.lv && f.lv !== lv[0]) || (f.ag && f.ag !== ag[0])) continue;
    m.push({ sp, g, d, lv, ag });
  }
  const row = (k, a) => `<div class="chips">${a.map(x => chip(x[1], f[k] === String(x[0]), 'lf', `${k}:${x[0]}`)).join('')}</div>`;
  const shown = m.slice(0, UI.libN);
  return `<button class="bk" data-a="go" data-v="plan">${t('رجوع', 'Back')}</button><h1>${t('مكتبة البرامج', 'Program library')}</h1>
    <p class="sub">${m.length} ${t('برنامج مطابق. تُبنى القواعد العلمية لكل تركيبة (رياضة، هدف، أيام، مستوى، عمر).', 'matching programs. Science-based rules are applied to every combination (sport, goal, days, level, age).')}</p>
    ${row('sp', SPORTS.map(s => [s.id, s[isEn() ? 'en' : 'ar']]))}${row('d', [2, 3, 4, 5, 6].map(k => [k, `${k} ${t('أيام', 'days')}`]))}${row('lv', LEVELS.map(l => [l[0], l[isEn() ? 2 : 1]]))}${row('ag', AGE_BANDS.map(a => [a[0], a[isEn() ? 2 : 1]]))}
    ${shown.map(x => `<div class="card flex" style="justify-content:space-between"><div><b>${x.sp[isEn() ? 'en' : 'ar']}${x.sp.id === 'gym' ? ' ' + gname(x.g) : ''}</b><p class="note" style="margin:0">${x.d} ${t('أيام', 'days')}, ${x.lv[isEn() ? 2 : 1]}, ${x.ag[isEn() ? 2 : 1]}</p></div><button class="bk" data-a="useP" data-v="${x.sp.id}|${x.g}|${x.d}|${x.lv[0]}">${t('استخدم', 'Use')}</button></div>`).join('')}
    ${m.length > shown.length ? `<button class="bk" style="display:block;margin:4px auto" data-a="libMore">${t('عرض المزيد', 'Show more')}</button>` : ''}`;
}

const VIEWS = { home: homeView, plan: planView, log: sessView, prog: progView, rec: recView, lib: libView };

/* ==========================================================================
   OVERLAYS — bottom sheets, rest timer, celebration
   ========================================================================== */
const ov = $('#ov'), cel = $('#cel');
let RT = {}, BA, lastFocus = null;

function openSheet(mode, html, cls = '') {
  if (!ov.classList.contains('show')) lastFocus = document.activeElement;
  ov.dataset.m = mode; ov.className = 'ov show';
  ov.innerHTML = bidi(`<div class="sh ${cls}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`);
  ov.firstChild.focus({ preventScroll: true });
}
function closeSheet() {
  clearInterval(RT.iv);
  const was = ov.className.includes('show');
  ov.className = 'ov'; ov.dataset.m = ''; ov.innerHTML = '';
  if (was && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
function ask(msg, label, fn) {
  UI.ask = fn;
  openSheet('q', `<p style="margin-bottom:16px">${msg}</p><div class="flex" style="gap:10px;justify-content:center"><button class="bk" data-a="close">${t('تراجع', 'Back')}</button><button class="bk" style="background:var(--vi);border-color:var(--vi)" data-a="askYes">${label}</button></div>`);
}

function beep() {
  if (!S.prefs.sound) return;
  try {
    const a = BA || (BA = new (window.AudioContext || window.webkitAudioContext)());
    const o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination); o.frequency.value = 880;
    g.gain.setValueAtTime(.25, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .7);
    o.start(); o.stop(a.currentTime + .7);
  } catch (e) { /* audio unavailable */ }
}
function startRest(sec) {
  try { BA = BA || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ignore */ }
  RT.tot = sec; RT.end = Date.now() + sec * 1000;
  openSheet('r', `<div class="mut">${t('راحة', 'Rest')}</div><svg width="150" height="150" viewBox="0 0 120 120" style="margin:6px 0" role="img" aria-label="${t('مؤقت الراحة', 'Rest timer')}"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--bd)" stroke-width="10"/><circle id="rc" cx="60" cy="60" r="52" fill="none" stroke="#D0FF00" stroke-width="10" stroke-linecap="round" transform="rotate(-90 60 60)"/><text id="rt" x="60" y="70" text-anchor="middle" font-size="30" font-weight="800" fill="var(--tx)"></text></svg><div class="flex" style="gap:10px;justify-content:center"><button class="bk" data-a="restAdd">${t('+15 ث', '+15 s')}</button><button class="bk" data-a="close">${t('تخطّي', 'Skip')}</button></div><div class="sr-only" aria-live="polite" id="rlive"></div>`);
  clearInterval(RT.iv); RT.iv = setInterval(tick, 250); tick();
}
function tick() {
  if (ov.dataset.m !== 'r') { clearInterval(RT.iv); return; }
  const l = Math.max(0, Math.ceil((RT.end - Date.now()) / 1000)), C = 2 * Math.PI * 52, c = $('#rc');
  if (!c) return;
  c.setAttribute('stroke-dasharray', `${(l / RT.tot * C).toFixed(1)} ${C.toFixed(1)}`);
  $('#rt').textContent = `${Math.floor(l / 60)}:${pad(l % 60)}`;
  if (l <= 0) {
    clearInterval(RT.iv);
    try { navigator.vibrate && navigator.vibrate([300, 120, 300]); } catch (e) { /* ignore */ }
    beep(); setTimeout(beep, 350);
    $('#rt').textContent = t('جاهز', 'Go');
    const live = $('#rlive'); if (live) live.textContent = t('انتهت الراحة', 'Rest is over');
    setTimeout(() => { if (ov.dataset.m === 'r') closeSheet(); }, 2200);
  }
}

function openStory(i) {
  const s = STORIES[i];
  openSheet('s', `<div class="spb"><i></i></div><h2 style="color:${s[2]}">${isEn() ? s[1] : s[0]}</h2><p style="margin-bottom:16px">${isEn() ? s[5] : s[4]}</p><div class="flex" style="gap:10px;justify-content:center"><button class="bk" data-a="story" data-v="${(i + 1) % STORIES.length}">${t('التالي', 'Next')}</button><button class="bk" data-a="close">${t('إغلاق', 'Close')}</button></div>`);
}
function openExInfo(i) {
  const e = dayRows().rows[i]; if (!e) return;
  const q = S.pr[e.n], name = tn(e.n);
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + (isEn() ? ' exercise form' : ' شرح تمرين'));
  openSheet('x', `<h2>${esc(name)}</h2><p class="sub">${esc(pair(e.pr))}</p>
    <p class="note" style="margin:0 0 14px">${q ? `${t('أفضل وزن:', 'Best weight:')} ${q.b} ${t('كغ', 'kg')}, ${t('إجمالي مرفوع:', 'Total lifted:')} ${fmt(Math.round(q.v))} ${t('كغ', 'kg')}` : t('لا يوجد تسجيل بعد لهذا التمرين', 'No records yet for this exercise')}</p>
    <div class="flex" style="gap:10px;justify-content:center"><a class="bk" style="text-decoration:none;display:inline-flex;align-items:center" href="${url}" target="_blank" rel="noopener noreferrer">${t('شاهد شرح التمرين', 'Watch a form guide')}</a><button class="bk" data-a="close">${t('إغلاق', 'Close')}</button></div>`);
}
function openSettings() {
  const p = S.p, num = (k, label) => `<div><label for="pf-${k}">${label}</label><input id="pf-${k}" type="number" inputmode="numeric" min="${LIMITS[k][0]}" max="${LIMITS[k][1]}" value="${p[k]}" data-c="prof" data-k="${k}"></div>`;
  const tog = (k, label) => `<label class="row" style="color:var(--tx);font-size:15px;margin:0" for="pref-${k}"><span>${label}</span><input id="pref-${k}" type="checkbox" style="width:24px;min-height:24px;accent-color:var(--ac)" ${S.prefs[k] ? 'checked' : ''} data-c="pref" data-k="${k}"></label>`;
  const chipRow = (k, opts) => `<div class="flex" style="gap:8px;flex-wrap:wrap">${opts.map(([v, l]) => `<button class="chip" aria-pressed="${String(p[k]) === String(v)}" data-a="setP" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  openSheet('set', `<h2>${t('الإعدادات', 'Settings')}</h2>
    <div class="card" style="text-align:start"><label for="pf-name">${t('الاسم', 'Name')}</label><input id="pf-name" type="text" maxlength="24" value="${esc(p.name)}" data-c="prof" data-k="name" autocomplete="given-name"><div class="grid" style="margin-top:10px">${num('age', t('العمر', 'Age'))}${num('h', t('الطول (سم)', 'Height (cm)'))}${num('w', t('الوزن (كغ)', 'Weight (kg)'))}</div></div>
    <div class="card" style="text-align:start">
      <label>${t('مكان التمرين', 'Training location')}</label>${chipRow('loc', [['gym', t('جيم', 'Gym')], ['home', t('منزل', 'Home')], ['out', t('خارجي', 'Outdoor')]])}
      <label style="margin-top:12px;display:block">${t('مدة الجلسة', 'Session duration')}</label>${chipRow('dur', [[30, t('30 د', '30 min')], [45, t('45 د', '45 min')], [60, t('60 د', '60 min')], [90, t('90 د', '90 min')]])}
      <label style="margin-top:12px;display:block">${t('إضافة الكارديو', 'Add cardio')}</label>${chipRow('cardio', [[true, t('نعم', 'Yes')], [false, t('لا', 'No')]])}
    </div>
    <div class="card" style="text-align:start">${tog('rest', t('بدء مؤقت الراحة تلقائياً', 'Start rest timer automatically'))}${tog('sound', t('صوت نهاية الراحة', 'Rest-end sound'))}</div>
    <div class="flex" style="gap:8px;flex-wrap:wrap;justify-content:center"><button class="bk" data-a="redo">${t('إعادة الإعداد', 'Redo setup')}</button><button class="bk" data-a="export">${t('تصدير بياناتي', 'Export my data')}</button><button class="bk" style="color:#ff8a8c" data-a="reset">${t('مسح كل البيانات', 'Erase all data')}</button></div>
    <button class="go plain" style="margin-top:16px" data-a="close">${t('تم', 'Done')}</button>`, 'start');
}

function celebrate(r) {
  const s = streak();
  cel.className = 'cel show';
  cel.innerHTML = bidi(`<div class="cin" role="dialog" aria-modal="true"><div class="bigfl">${flame(150)}<b>${s}</b></div><h1>${pk(PRAISE, dayI() + S.hist.length)}</h1><p class="sub">${t('سلسلة ' + s + ' يوم', 'Day streak: ' + s)}</p>${wkRow()}
    <div class="stats"><div class="stat"><b>${r.kc}</b><span>kcal</span></div><div class="stat"><b>${fmt(r.v)}</b><span>kg</span></div><div class="stat"><b>${r.m}</b><span>${t('دقيقة', 'min')}</span></div></div>
    <div class="card v" style="margin-top:12px"><b>${t('حافظ على سلسلتك', 'Keep your streak alive')}</b><p class="note">${t('أنجز نصف أهداف يومك على الأقل (تمرين، ماء، خطوات) لتستمر السلسلة.', 'Hit at least half of your daily goals (workout, water, steps) to keep the streak going.')}</p></div>
    <button class="go" data-a="celClose">${t('متابعة', 'Continue')}</button></div>`);
  const b = cel.querySelector('button'); if (b) b.focus();
  try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) { /* ignore */ }
}

/* ==========================================================================
   RENDER
   ========================================================================== */
const app = $('#app'), nav = $('#nav');
function draw() {
  const root = document.documentElement;
  app.classList.toggle('anim', !!UI.anim); UI.anim = false;
  root.lang = S.lang; root.dir = isEn() ? 'ltr' : 'rtl';
  document.title = t('ميدان فِت', 'Maydan Fit');
  const fk = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.a
    ? `[data-a="${document.activeElement.dataset.a}"][data-v="${cssEsc(document.activeElement.dataset.v || '')}"]` : null;

  app.innerHTML = bidi(`<div class="pg">${(VIEWS[S.tab] || homeView)()}</div>`);
  const N = [['home', t('الرئيسية', 'Home')], ['plan', t('الخطة', 'Plan')], ['log', t('تمرين', 'Train')], ['prog', t('تقدمي', 'Progress')], ['rec', t('الاستشفاء', 'Recovery')]];
  nav.hidden = false;
  nav.innerHTML = N.map(n => {
    const on = S.tab === n[0] || (S.tab === 'lib' && n[0] === 'plan');
    return `<button ${on ? 'aria-current="page"' : ''} data-a="go" data-v="${n[0]}">${svg(IC[n[0]])}${n[1]}</button>`;
  }).join('');
  if (fk) { const el = document.querySelector(fk); if (el) el.focus({ preventScroll: true }); }
}

/* ==========================================================================
   ACTIONS (click delegation: data-a="name" data-v="value")
   ========================================================================== */
const A = {
  lang() { S.lang = isEn() ? 'ar' : 'en'; redraw(); },
  go(v) { if (ov.className.includes('show')) closeSheet(); S.tab = TABS.includes(v) ? v : 'home'; redraw(); toTop(); },
  close() { closeSheet(); },

  /* plan */
  setSport(v) { S.sport = v; S.day = 0; redraw(); },
  setGoal(v) { if (GOALS[v]) { S.p.goal = v; S.day = 0; redraw(); } },
  setDays(v) { S.p.days = clamp(+v, 2, 6); S.day = 0; redraw(); },
  setDay(v) { S.day = +v || 0; redraw(); },

  /* session */
  sessStart() { const R = dayRows(); S.sess = { t0: Date.now(), ck: {}, sig: R.sig, name: R.name }; redraw(); },
  sessCancel() { ask(t('إلغاء الجلسة الحالية؟ لن تُحفظ مجموعاتها.', 'Cancel this session? Its sets will not be saved.'), t('إلغاء الجلسة', 'Cancel session'), () => { S.sess = null; redraw(); }); },
  askYes() { const f = UI.ask; UI.ask = null; closeSheet(); if (f) f(); },
  chk(k) {
    const se = S.sess; if (!se) return;
    const [i] = k.split('-').map(Number), R = dayRows(), e = R.rows[i], row = $('#s' + k); if (!e || !row) return;
    if (se.ck[k]) {                                               // un-tick: allow corrections
      delete se.ck[k]; row.className = 'st' + (e.r ? '' : ' single');
      row.querySelectorAll('input').forEach(x => { x.disabled = false; });
      const b = row.querySelector('.cb'); b.textContent = ''; b.setAttribute('aria-pressed', 'false');
    } else {
      const w = parseFloat(($('#w' + k) || {}).value) || 0, r = parseInt(($('#r' + k) || {}).value, 10) || 0;
      se.ck[k] = { w, r };
      row.className = 'st ok' + (e.r ? '' : ' single');
      row.querySelectorAll('input').forEach(x => { x.disabled = true; });
      const b = row.querySelector('.cb'); b.textContent = '✓'; b.setAttribute('aria-pressed', 'true');
      const { total, done } = sessProgress(R);
      if (e.rest && S.prefs.rest && done < total) startRest(e.rest);
    }
    const { total, done } = sessProgress(R), pb = $('#pb'); if (pb) pb.style.width = (total ? done / total * 100 : 0) + '%';
    save();
  },
  sessFinish() {
    const se = S.sess; if (!se) return;
    const R = dayRows(), keys = Object.keys(se.ck);
    if (!keys.length) { toast(t('علّم مجموعة واحدة على الأقل', 'Tick at least one set')); return; }
    let v = 0;
    keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(k => {
      const c = se.ck[k], e = R.rows[+k.split('-')[0]]; if (!e) return;
      v += c.w * c.r;
      if (c.w && c.r) {
        S.logs.push({ ex: e.n, w: c.w, r: c.r, e: 8, t: Date.now() });
        const q = S.pr[e.n] || (S.pr[e.n] = { b: 0, v: 0, l: 0 });
        q.b = Math.max(q.b, c.w); q.v += c.w * c.r; q.l = c.w;
      }
    });
    const hr = clamp((Date.now() - se.t0) / 36e5, .2, 3);          // cap: an abandoned session can't inflate calories
    const r = { d: today(), sp: sport(), nm: R.name, kc: Math.round(met() * S.p.w * hr), v: Math.round(v), n: keys.length, m: Math.round(hr * 60) };
    S.hist.push(r); S.sess = null; closeSheet(); commit(); save(); draw(); celebrate(r);
  },
  exInfo(v) { openExInfo(+v); },
  restStart(v) { startRest(+v); },
  restAdd() { RT.end += 15000; RT.tot += 15; },

  /* trackers */
  addW(v) { S.wt = { d: today(), n: Math.max(0, waterN() + +v) }; commit(); redraw(); },
  addS(v) { S.sp = { d: today(), n: Math.max(0, stepsN() + +v) }; commit(); redraw(); },
  story(v) { openStory(+v % STORIES.length); },

  /* progress & library */
  ptab(v) { S.pt = v; redraw(); },
  mo(v) { S.mo = (S.mo || 0) + +v; redraw(); },
  lf(v) { const [k, x] = v.split(':'); S.f[k] = S.f[k] === x ? null : x; UI.libN = 10; redraw(); },
  libMore() { UI.libN += 10; draw(); },
  useP(v) { const [sp, g, d, lv] = v.split('|'); S.sport = sp; S.p.goal = g; S.p.days = +d; S.p.exp = lv; S.day = 0; A.go('plan'); },

  /* settings */
  settings() { openSettings(); },
  export() {
    try {
      const b = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = `maydan-fit-${today()}.json`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) { toast(t('تعذّر التصدير', 'Export failed')); }
  },
  redo() { closeSheet(); location.href = 'setup.html?redo=1'; },
  reset() {
    ask(t('سيتم مسح كل بياناتك من هذا الجهاز. متأكد؟', 'This erases all your data from this device. Sure?'), t('امسح كل شيء', 'Erase everything'), () => {
      try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch (e) { /* ignore */ }
      location.href = 'login.html';
    });
  },
  celClose() { cel.className = 'cel'; cel.innerHTML = ''; A.go('prog'); },
  setP(v, el) {
    const k = el.dataset.k;
    if (k === 'cardio') S.p.cardio = (v === 'true');
    else if (k === 'dur') S.p.dur = +v;
    else S.p.loc = v;
    save(); openSettings();
  }
};

/* page-level transitions replay the entrance animation; in-place updates don't */
['go', 'celClose'].forEach(k => {
  const f = A[k]; A[k] = function () { UI.anim = true; return f.apply(this, arguments); };
});

/* change / input delegation */
const C = {
  prof(val, el) {
    const k = el.dataset.k;
    if (k === 'name') S.p.name = val.trim().slice(0, 24);
    else { S.p[k] = clamp(Math.round(+val) || S.p[k], ...LIMITS[k]); el.value = S.p[k]; }
    save();
  },
  pref(val, el) { S.prefs[el.dataset.k] = el.checked; save(); }
};
document.addEventListener('click', e => {
  if (e.target === ov) { closeSheet(); return; }
  const el = e.target.closest('[data-a]');
  if (el && A[el.dataset.a]) A[el.dataset.a](el.dataset.v, el, e);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-c]'); if (el && C[el.dataset.c]) { C[el.dataset.c](el.value, el, e); return; }
  if (e.target.dataset.i === 'rec') { S.rec.d = today(); save(); draw(); }          // refresh ring on release
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset && el.dataset.i === 'rec') {                                         // live value while dragging, no re-render
    S.rec[el.dataset.k] = +el.value; const b = $('#rv-' + el.dataset.k); if (b) b.textContent = el.value;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (cel.className.includes('show')) A.celClose(); else if (ov.className.includes('show')) closeSheet(); return; }
});
window.addEventListener('storage', e => { if ((e.key === KEY) && e.newValue) { S = load(); draw(); } });   // keep tabs in sync

/* ==========================================================================
   BOOT
   ========================================================================== */
UI.anim = true; draw();
