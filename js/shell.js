/* ============================================================
   js/shell.js — خريطة الرحلة + لوحة ولي الأمر
   كل العوالم بتشارك نفس الطفل ونفس النجوم والتقدّم و localStorage
   ============================================================ */
const WORLDS = [
  {id:'quran',   desc:'استماع وترديد وحفظ ومراجعة',  ready:true},
  {id:'math',    desc:'الأرقام والجمع والطرح',       ready:true},
  {id:'arabic',  desc:'الحروف والمدود والكلمات والقراءة',     ready:true},
  {id:'english', desc:'Letters, words and sounds',   ready:true}
].map(w => ({...w, ...WORLDS_META[w.id]}));

const Shell = (() => {
  const screen = () => document.getElementById('screen');
  const worldStars = w => Progress.starsIn(w);
  const esc = t => String(t).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  /* شريط الهدف اليومي + سلسلة الأيام — بيظهر فوق كروت العوالم */
  function dailyStrip(){
    const goal = Progress.goal(), got = Progress.todayStars(), pct = Progress.goalPct();
    const st = Progress.streak(), left = Progress.limitLeft();
    const done = Progress.goalDone();
    return `
      <div class="daily">
        <div class="dstreak ${st ? 'hot' : ''}">
          <span class="dfire">${st ? '🔥' : '🌱'}</span>
          <b>${ar(st)}</b><span class="dlab">${st === 1 ? 'يوم' : 'أيام'} متتالية</span>
        </div>
        <div class="dgoal">
          <div class="dgtop"><span>🎯 هدف اليوم</span><b>${ar(got)} / ${ar(goal)} ⭐</b></div>
          <div class="dbar"><i class="${done ? 'done' : ''}" style="width:${pct}%"></i></div>
          <div class="dnote">${done
            ? '🎉 خلّصت هدف النهاردة — أي نجمة زيادة مكسب!'
            : `فاضل ${ar(Math.max(0, goal - got))} نجمة`}${
            isFinite(left) ? ` • باقي ${ar(left)} دقيقة لعب` : ''}</div>
        </div>
      </div>`;
  }

  function home(){
    Audio_.stop();
    if(window.QuranWorld) QuranWorld.stop();
    if(window.Music) Music.quiet(false);     /* رجّعنا الموسيقى بعد الخروج من القرآن */
    const p = Progress.get();
    UI.bar({title:`المستوى ${ar(Progress.level())}`});
    screen().innerHTML = `
      <section class="hero">
        <div class="banner">رحلتي التعليمية</div>
        <div class="greet">
          ${Avatar.html('big')}
          <h2>أهلاً يا ${p.name ? esc(p.name) : 'بطل'}!</h2>
        </div>
        <p>اختار عالم وابدأ المغامرة</p>
      </section>

      ${dailyStrip()}
      <div class="rankwrap">${Rewards.rankBar()}</div>

      <div class="wgrid">
        ${WORLDS.map(w => {
          const stars = worldStars(w.id);
          const pct = w.id === 'quran' ? Math.min(stars * 4, 100) : Progress.worldPct(w.id);
          return `
          <button class="world card" data-w="${w.id}" style="--c:${w.color}">
            <span class="wtop">
              <span class="wi">${w.icon}</span>
              <span class="wstars">⭐ ${ar(stars)}</span>
            </span>
            <span class="wmeta">
              <span class="wn">${esc(w.name)}</span>
              <span class="wd">${esc(w.desc)}</span>
              <span class="wbar"><i style="width:${pct}%;background:${w.color}"></i></span>
              <span class="wpct">${ar(pct)}٪</span>
            </span>
          </button>`;
        }).join('')}
      </div>

      <div class="center" style="margin-top:18px">
        <button class="btn ghost" id="btnBadges">🏆 إنجازاتي (${ar(Rewards.earned().length)})</button>
        <button class="btn ghost" id="btnKidPG">🧒 أتعلم أتصرف إزاي؟</button>
      </div>
      <div class="lion" id="lion">🦁</div>`;

    Audio_.greet('أهلاً يا بطل! اختار عالم وابدأ المغامرة', ['welcome']);

    screen().querySelectorAll('.world').forEach(b => b.onclick = () => {
      const id = b.dataset.w;
      if(Progress.limitReached()) return UI.timeUp('shell');   /* خلص وقت اللعب النهاردة */
      if(id === 'quran') QuranWorld.open();
      else UI.worldMap(id);
    });
    document.getElementById('btnKidPG').onclick = () => ParentGuide.kidHub('shell');
    document.getElementById('btnBadges').onclick = () => {
      UI.bar({back:'shell', title:'🏆 إنجازاتي'});
      Rewards.screen();
    };
  }

  /* ---------- لوحة ولي الأمر ---------- */
  const fmtTime = ms => {
    const m = Math.round((ms || 0) / 60000);
    return m < 60 ? `${ar(m)} دقيقة` : `${ar(Math.floor(m/60))} ساعة و${ar(m%60)} دقيقة`;
  };
  const fmtDate = ts => {
    if(!ts) return '—';
    const d = new Date(ts);
    return ar(`${d.getDate()}/${d.getMonth()+1} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
  };

  /* ---------- التقرير الأسبوعي ---------- */
  const DAY_AR = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
  const accOf = w => (w.correct + w.wrong) ? Math.round(w.correct / (w.correct + w.wrong) * 100) : null;

  function weekCard(){
    const days = Progress.week(), now = Progress.weekSum(), prev = Progress.weekSum(1);
    const peak = Math.max(1, ...days.map(d => d.stars));
    const a1 = accOf(now), a0 = accOf(prev);

    /* مقارنة بالأسبوع اللي فات — بنقول اتحسّن في إيه ومحتاج إيه */
    const up = [], need = [];
    const cmp = (label, a, b, unit) => {
      if(!b && !a) return;
      if(a > b * 1.1) up.push(`${label} زادت (${ar(a)}${unit} بعد ${ar(b)}${unit})`);
      else if(b && a < b * .85) need.push(`${label} قلّت (${ar(a)}${unit} بعد ${ar(b)}${unit})`);
    };
    cmp('النجوم', now.stars, prev.stars, '');
    cmp('الألعاب', now.games, prev.games, '');
    cmp('أيام اللعب', now.days, prev.days, '');
    if(a1 !== null && a0 !== null){
      if(a1 >= a0 + 5) up.push(`دقة الإجابات اتحسّنت (${ar(a1)}٪ بعد ${ar(a0)}٪)`);
      else if(a1 <= a0 - 5) need.push(`دقة الإجابات نزلت (${ar(a1)}٪ بعد ${ar(a0)}٪)`);
    }
    const weakest = Adaptive.weakest(2).map(w => (PACKS[w.pack] || {}).name).filter(Boolean);
    if(weakest.length) need.push('محتاج تدريب في: ' + weakest.join(' و'));
    if(now.days < 4) need.push('اللعب كان ' + ar(now.days) + ' أيام بس — المواظبة أهم من الوقت الطويل');

    return `
      <h3 style="margin:18px 0 6px">📅 تقرير الأسبوع</h3>
      <div class="wkcard">
        <div class="wkbars">
          ${days.map(d => `
            <div class="wkcol" title="${ar(d.stars)} نجمة">
              <i style="height:${Math.round(d.stars / peak * 100)}%"></i>
              <span class="wkv">${d.stars ? ar(d.stars) : ''}</span>
              <span class="wkd">${DAY_AR[d.d.getDay()]}</span>
            </div>`).join('')}
        </div>
        <div class="wkrow">
          <span>⭐ ${ar(now.stars)} نجمة</span>
          <span>🎮 ${ar(now.games)} لعبة</span>
          <span>⏱️ ${fmtTime(now.ms)}</span>
          <span>📆 ${ar(now.days)} أيام نشاط</span>
          ${a1 !== null ? `<span>🎯 دقة ${ar(a1)}٪</span>` : ''}
        </div>
        <div class="wknote up">✅ اتحسّن: ${up.length ? up.join(' • ') : 'الأسبوع ماشي زي اللي قبله — تمام'}</div>
        <div class="wknote need">💡 محتاج: ${need.length ? need.join(' • ') : 'مفيش حاجة واضحة — كمّلوا كده'}</div>

        <div class="wkset">
          <div class="wkctl">
            <span>🎯 هدف اليوم</span>
            <button class="btn ghost" data-goal="-5">−</button>
            <b>${ar(Progress.goal())} ⭐</b>
            <button class="btn ghost" data-goal="5">+</button>
          </div>
          <div class="wkctl">
            <span>⏱️ حد وقت اللعب</span>
            <button class="btn ghost" data-lim="-5">−</button>
            <b>${Progress.limitMin() ? ar(Progress.limitMin()) + ' دقيقة' : 'مفيش'}</b>
            <button class="btn ghost" data-lim="5">+</button>
          </div>
        </div>
      </div>`;
  }

  /* أزرار ضبط الهدف والحد */
  function bindWeek(){
    const s = Progress.get().settings;
    document.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => {
      s.goal = Math.max(5, Math.min(100, (s.goal || 20) + (+b.dataset.goal)));
      Progress.save(); dashboard();
    });
    document.querySelectorAll('[data-lim]').forEach(b => b.onclick = () => {
      s.limitMin = Math.max(0, Math.min(180, (s.limitMin || 0) + (+b.dataset.lim)));
      Progress.save(); dashboard();
    });
  }

  function dashboard(){
    const p = Progress.get();
    const q = p.quran || {};
    const total = p.correct + p.wrong;
    const acc = total ? Math.round(p.correct / total * 100) : 0;

    const worldRows = WORLDS.map(w => {
      const stars = worldStars(w.id);
      const extra = w.id === 'quran'
        ? ar(new Set(Object.keys(q).map(k => k.split(':')[0])).size) + ' سور'
        : ar(Progress.worldPct(w.id)) + '٪';
      return `<tr><td>${w.icon} ${esc(w.name)}</td>
                  <td>${'⭐'.repeat(Math.min(stars,5))} ${ar(stars)}</td>
                  <td>${extra}</td></tr>`;
    }).join('');

    /* سور فيها حفظ من غير مراجعة */
    const byS = {};
    Object.keys(q).forEach(k => { const [s,m] = k.split(':'); (byS[s] = byS[s] || []).push(m); });
    const needRev = Object.keys(byS).filter(s => byS[s].includes('memorize') && !byS[s].includes('review'));

    const weak = Adaptive.weakest(5).map(w => {
      const pk = PACKS[w.pack];
      return `<tr><td>${pk ? pk.icon + ' ' + pk.name : esc(w.pack)}</td>
                  <td>${esc(w.skill.split(':').slice(1).join(':') || w.skill)}</td>
                  <td>${ar(w.misses)} مرات</td></tr>`;
    }).join('') || '<tr><td colspan="3">مفيش مهارات متعثّرة — ما شاء الله</td></tr>';

    screen().innerHTML = `
      <div class="qcard dash">
        <h2 style="margin:0 0 4px">👨‍👩‍👦 لوحة ولي الأمر</h2>
        <div class="childrow">
          ${Avatar.html('big')}
          <div class="childinfo">
            <b>${p.name ? esc(p.name) : 'بدون اسم'}</b>
            <div class="childbtns">
              <button class="btn ghost" id="dName">✏️ الاسم</button>
              <button class="btn ghost" id="dPhoto">📷 ${Avatar.isCustom() ? 'تغيير الصورة' : 'إضافة صورة الطفل'}</button>
              ${Avatar.isCustom() ? '<button class="btn ghost" id="dNoPhoto">🗑️ رجّع الافتراضية</button>' : ''}
            </div>
            <div class="order-hint" id="photoNote" style="text-align:start;margin-top:6px">
              ${Avatar.isCustom()
                ? `صورة الطفل محفوظة على الجهاز ده بس (${ar(Avatar.sizeKB())} كيلوبايت) — مابتترفعش لأي مكان.`
                : 'دي الصورة الافتراضية. ضيف صورة الطفل — هتتحفظ على الجهاز ده بس ومابتترفعش لأي مكان.'}
            </div>
          </div>
        </div>

        <div class="rankwrap">${Rewards.rankBar()}</div>

        <div class="stats">
          <div class="stat"><b>${ar(p.stars)}</b><span>نجمة</span></div>
          <div class="stat"><b>${ar(p.games || 0)}</b><span>لعبة</span></div>
          <div class="stat"><b>${ar(acc)}٪</b><span>دقة الإجابات</span></div>
          <div class="stat"><b>${ar(p.correct)}</b><span>صح</span></div>
          <div class="stat"><b>${ar(p.wrong)}</b><span>غلط</span></div>
          <div class="stat"><b style="font-size:18px">${fmtTime(p.timeMs)}</b><span>وقت التعلّم</span></div>
          <div class="stat"><b id="visitCount">${Visits.get() ? ar(Visits.get()) : '…'}</b><span>زيارة للموقع</span></div>
        </div>

        ${weekCard()}

        <h3 style="margin:18px 0 6px">🗺️ العوالم</h3>
        <table class="dtable"><thead><tr><th>العالم</th><th>النجوم</th><th>الإنجاز</th></tr></thead><tbody>${worldRows}</tbody></table>

        ${typeof Madd !== 'undefined' ? Madd.dashCard() : ''}

        ${ParentGuide.dashCard()}

        <h3 style="margin:18px 0 6px">🧠 مهارات محتاجة تدريب</h3>
        <table class="dtable"><thead><tr><th>المرحلة</th><th>المهارة</th><th>الأخطاء</th></tr></thead><tbody>${weak}</tbody></table>

        <h3 style="margin:18px 0 6px">📖 سور تحتاج مراجعة</h3>
        <div class="note" style="text-align:start">${needRev.length
          ? needRev.map(s => 'سورة رقم ' + ar(s)).join(' • ')
          : 'مفيش سور متأخرة في المراجعة'}</div>

        <h3 style="margin:18px 0 6px">🏆 الإنجازات</h3>
        <div class="badges small">
          ${BADGES.map(b => `<div class="badge ${Rewards.earned().includes(b.id) ? 'got' : ''}">
            <span class="bi">${Rewards.earned().includes(b.id) ? b.icon : '🔒'}</span>
            <span class="bn">${b.name}</span></div>`).join('')}
        </div>

        <div class="order-hint" style="margin-top:14px;text-align:start">آخر نشاط: ${fmtDate(p.lastActivity)}</div>
        <div class="center" style="margin-top:16px">
          <button class="btn" id="dPG">❤️ دليل ولي الأمر</button>
          <button class="btn ghost" id="dGuide">📘 دليل الوالدين</button>
          <button class="btn ghost" id="dBack">رجوع</button>
        </div>
      </div>`;

    const visitEl = document.getElementById('visitCount');
    if(visitEl){
      Visits.ping().then(n => {
        visitEl.textContent = n ? ar(n) : (Visits.live() ? '—' : '٠');
      }).catch(() => { visitEl.textContent = '—'; });
    }

    bindWeek();
    ParentGuide.bindDash(dashboard);
    document.getElementById('dPG').onclick = () => ParentGuide.home();
    document.getElementById('dBack').onclick = home;
    document.getElementById('dGuide').onclick = () => { UI.bar({back:'shell', title:'📘 دليل الوالدين'}); Guide.screen(); };
    document.getElementById('dName').onclick = () => {
      const n = prompt('اسم الطفل:', p.name || '');
      if(n !== null){ p.name = n.trim().slice(0,20); Progress.save(); dashboard(); }
    };
    document.getElementById('dPhoto').onclick = () => {
      const note = document.getElementById('photoNote');
      note.textContent = '⏳ بنجهّز الصورة…';
      Avatar.pick((ok, err) => {
        if(ok){ Audio_.good(); dashboard(); }
        else { note.textContent = '⚠️ ' + (err || 'الصورة اتلغت'); }
      });
    };
    const rm = document.getElementById('dNoPhoto');
    if(rm) rm.onclick = () => { if(confirm('ترجّع الصورة الافتراضية؟')){ Avatar.clear(); dashboard(); } };
  }

  /* بوابة بسيطة تمنع الطفل من الدخول */
  function askParent(){
    const a = rnd(11,19), b = rnd(3,9);
    const ans = prompt(`للأهل فقط — كام ${a} × ${b} ؟`);
    if(ans === null) return;
    if(Number(ans) === a * b){ UI.bar({back:'shell', title:'لوحة ولي الأمر'}); dashboard(); }
    else alert('إجابة غير صحيحة.');
  }

  return {home, dashboard, askParent};
})();

/* ---------- الإقلاع ---------- */
Progress.load();
UI.bindSettings();
Shell.home();
if(window.Visits) Visits.ping();
