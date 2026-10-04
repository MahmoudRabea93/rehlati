/* ============================================================
   js/shell.js — خريطة الرحلة + لوحة ولي الأمر
   كل العوالم بتشارك نفس الطفل ونفس النجوم والتقدّم و localStorage
   ============================================================ */
const WORLDS = [
  {id:'quran',   desc:'استماع وترديد وحفظ ومراجعة',  ready:true},
  {id:'math',    desc:'الأرقام والجمع والطرح',       ready:true},
  {id:'arabic',  desc:'الحروف والكلمات والقراءة',     ready:true},
  {id:'english', desc:'Letters, words and sounds',   ready:true}
].map(w => ({...w, ...WORLDS_META[w.id]}));

const Shell = (() => {
  const screen = () => document.getElementById('screen');
  const worldStars = w => Progress.starsIn(w);
  const esc = t => String(t).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  function home(){
    Audio_.stop();
    if(window.QuranWorld) QuranWorld.stop();
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

      <div class="journey">
        <div class="jnode">🏠 البداية</div>
        ${WORLDS.map(w => {
          const stars = worldStars(w.id);
          const pct = w.id === 'quran' ? Math.min(stars * 4, 100) : Progress.worldPct(w.id);
          return `
          <div class="jline"></div>
          <button class="world" data-w="${w.id}" style="--c:${w.color}">
            <span class="wi">${w.icon}</span>
            <span class="wmeta">
              <span class="wn">${esc(w.name)}</span>
              <span class="wd">${esc(w.desc)}</span>
              <span class="wbar"><i style="width:${pct}%;background:${w.color}"></i></span>
            </span>
            <span class="wstars">⭐ ${ar(stars)}</span>
          </button>`;
        }).join('')}
      </div>

      <div class="center" style="margin-top:18px">
        <button class="btn ghost" id="btnBadges">🏆 إنجازاتي (${ar(Rewards.earned().length)})</button>
      </div>
      <div class="lion" id="lion">🦁</div>`;

    Audio_.greet('أهلاً يا بطل! اختار عالم وابدأ المغامرة', ['welcome']);

    screen().querySelectorAll('.world').forEach(b => b.onclick = () => {
      const id = b.dataset.w;
      if(id === 'quran') QuranWorld.open();
      else UI.worldMap(id);
    });
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

        <div class="stats">
          <div class="stat"><b>${ar(p.stars)}</b><span>نجمة</span></div>
          <div class="stat"><b>${ar(p.games || 0)}</b><span>لعبة</span></div>
          <div class="stat"><b>${ar(acc)}٪</b><span>دقة الإجابات</span></div>
          <div class="stat"><b>${ar(p.correct)}</b><span>صح</span></div>
          <div class="stat"><b>${ar(p.wrong)}</b><span>غلط</span></div>
          <div class="stat"><b style="font-size:18px">${fmtTime(p.timeMs)}</b><span>وقت التعلّم</span></div>
        </div>

        <h3 style="margin:18px 0 6px">🗺️ العوالم</h3>
        <table class="dtable"><thead><tr><th>العالم</th><th>النجوم</th><th>الإنجاز</th></tr></thead><tbody>${worldRows}</tbody></table>

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
          <button class="btn" id="dGuide">📘 دليل الوالدين</button>
          <button class="btn ghost" id="dBack">رجوع</button>
        </div>
      </div>`;

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
