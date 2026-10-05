/* ============================================================
   js/app.js — الشاشات والتنقّل
   ============================================================ */
const UI = (() => {
  const screen = document.getElementById('screen');
  const topbar = document.getElementById('topbar');
  const fx     = document.getElementById('fx');

  /* ---------- الشريط العلوي ---------- */
  function bar({back=false, title=''}={}){
    const p = Progress.get();
    topbar.innerHTML = `
      ${back?`<button class="icon-btn" id="btnBack" aria-label="رجوع">↩</button>`:''}
      <span class="pill" id="starPill"><span class="big">⭐</span> <span id="starNum">${ar(p.stars)}</span></span>
      ${title?`<span class="pill">${title}</span>`:''}
      <span class="spacer"></span>
      <button class="icon-btn" id="btnSet" aria-label="الإعدادات">⚙️</button>`;
    const b = document.getElementById('btnBack');
    if(b) b.onclick = () => {
      Audio_.stop();
      if(window.QuranWorld) QuranWorld.stop();
      if(back === 'shell') Shell.home();
      else if(back === 'pg') ParentGuide.home();
      /* القرآن مالوش خريطة مراحل زي باقي العوالم — ليه شاشاته الخاصة،
         فلازم يتشاف قبل WORLDS_META عشان ما يروحش لخريطة فاضية */
      else if(back === 'quran') QuranWorld.open();
      else if(back === 'surah') QuranWorld.back();
      else if(WORLDS_META[back]) worldMap(back);
      else mathMap();
    };
    document.getElementById('btnSet').onclick = openSheet;
  }

  /* ---------- الصفحة الرئيسية ---------- */
  function mathMap(){ worldMap('math'); }

  /* خريطة أي عالم — نفس الكود للحساب والعربي و English */
  function worldMap(world){
    const meta = WORLDS_META[world];
    bar({back:'shell', title:`المستوى ${ar(Progress.level(world))}`});
    const p = Progress.get();
    const cards = (WORLD_STAGES[world]||[]).map(id => PACKS[id]).map(s=>{
      const open = Progress.isUnlocked(s.id);
      const medals = p.best[s.id] || 0;
      return `<button class="stage ${open?'':'locked'}" data-id="${s.id}" style="--c:${s.color}"
                ${open?'':'aria-disabled="true"'}>
        <span class="badge">${s.icon}</span>
        <span class="meta">
          <span class="num">المرحلة ${ar(s.n)}</span>
          <span class="name">${s.name}</span>
          <span class="earned">${medals?'⭐'.repeat(medals):'☆☆☆'}</span>
        </span>
      </button>`;
    }).join('');

    screen.innerHTML = `
      ${worldScene(world)}
      <div class="wwrap">
      <section class="hero">
        <div class="banner" style="background:${meta.color};box-shadow:0 7px 0 ${meta.tone};color:#fff">${meta.title}</div>
        <p>${world==='english' ? 'Pick a game and start' : 'اختار لعبة وابدأ المغامرة'}</p>
      </section>
      <nav class="map">${cards}</nav>
      <div class="lion" id="lion">🦁</div>
      </div>`;

    screen.querySelectorAll('.stage').forEach(el=>{
      el.onclick = () => {
        const id = el.dataset.id;
        if(!Progress.isUnlocked(id)){
          say('المرحلة دي مقفولة 🔒 خلّص اللي قبلها الأول');
          Audio_.bad(); Audio_.speak('المرحلة دي مقفولة، خلص اللي قبلها الأول', ['locked']);
          return;
        }
        const pack = PACKS[id];
        if(pack.learn) LetterBoard.open(pack); else Engine.start(id);
      };
    });
  }

  function say(text){
    const lion = document.getElementById('lion');
    if(!lion) return;
    let b = document.getElementById('lionSay');
    if(!b){ b = document.createElement('div'); b.id='lionSay'; b.className='bubble'; lion.after(b); }
    b.textContent = text;
    lion.classList.remove('sad'); void lion.offsetWidth; lion.classList.add('sad');
  }

  /* ---------- شاشة اللعب ---------- */
  function gameScreen(){
    const st = Engine.state();
    bar({back:st.stage.world, title:`المستوى ${ar(st.level)}`});
    screen.innerHTML = `
      <div class="dots" id="dots"></div>
      <div id="qwrap"></div>
      <div class="lion" id="lion">🦁</div>
      <div class="bubble" id="bubble">${st.stage.icon} ${st.stage.name}</div>`;
  }

  function renderDots(){
    const {idx,total,picked} = Engine.state();
    const d = document.getElementById('dots');
    if(!d) return;
    d.innerHTML = Array.from({length:total},(_,i)=>
      `<span class="dot ${i<idx?'done':''} ${i===idx?'now':''}"></span>`).join('');
  }

  function renderQuestion(q, st){
    renderDots();
    const wrap = document.getElementById('qwrap');
    let body = '';

    if(q.mode === 'order'){
      body = `
        <div class="ask-row"><h2 class="ask">${q.ask}</h2>${sayBtn()}</div>
        ${q.visual||''}
        <div class="slots ${q.dir === 'rtl' ? 'rtl' : ''}" id="slots">
          ${q.answer.map(()=>`<div class="slot"></div>`).join('')}
        </div>
        <div class="order-hint">${q.orderHint || 'اضغط الأرقام بالترتيب'}</div>
        <div class="choices">
          ${q.items.map(n=>`<button class="choice ${q.numeric===false?'txt':''}" data-v="${n}" style="--c:${st.stage.color}">${ar(n)}</button>`).join('')}
        </div>`;
    }else if(q.mode === 'find'){
      body = `
        <div class="ask-row"><h2 class="ask ltr">${q.ask}</h2>${sayBtn()}</div>
        ${q.visual}
        <div class="order-hint">${q.hint}</div>
        <div class="findgrid">
          ${q.cells.map((c,i)=>`<button class="fcell" data-i="${i}">${c.ch}</button>`).join('')}
        </div>`;
    }else if(q.mode === 'memory'){
      body = `
        <div class="ask-row"><h2 class="ask ltr">${q.ask}</h2>${sayBtn()}</div>
        <div class="order-hint">${q.hint}</div>
        <div class="memgrid">
          ${q.cards.map((c,i)=>`<button class="mcard" data-m="${i}">❓</button>`).join('')}
        </div>`;
    }else if(q.mode === 'pairs'){
      body = `
        <div class="ask-row"><h2 class="ask">${q.ask}</h2>${sayBtn()}</div>
        <div class="order-hint">${q.hint}</div>
        <div class="pairs ${q.wide?'text':''}">
          <div class="pcol">
            ${q.items.map(v=>`<button class="choice pair txt ltr" data-v="${v}" data-side="a" style="--c:${st.stage.color}">${v}</button>`).join('')}
          </div>
          <div class="pcol">
            ${q.right.map(v=>`<button class="choice pair txt ltr" data-v="${v}" data-side="b" style="--c:#8FB9E8">${v}</button>`).join('')}
          </div>
        </div>`;
    }else if(q.mode === 'grid'){
      body = `
        <div class="ask-row"><h2 class="ask">${q.ask}</h2>${sayBtn()}</div>
        ${q.visual}
        <div class="order-hint">اضغط الرقم الناقص</div>
        <div class="choices">
          ${q.items.map(n=>`<button class="choice" data-v="${n}" style="--c:${st.stage.color}">${ar(n)}</button>`).join('')}
        </div>`;
    }else{
      body = `
        <div class="ask-row"><h2 class="ask">${q.ask}</h2>${sayBtn()}</div>
        ${q.visual||''}
        <div class="choices ${q.wide?'wide':''}">
          ${q.choices.map(c=>`<button class="choice ${typeof c==='string'&&c.length>1?'txt':''} ${q.ltr?'ltr':''}" data-v="${c}" style="--c:${st.stage.color}">${ar(c)}</button>`).join('')}
        </div>`;
    }
    wrap.innerHTML = `<div class="qcard" id="qcard">${body}</div>`;
    setBubble(`${st.stage.icon} سؤال ${ar(st.idx+1)} من ${ar(st.total)}`);
    markNext(0);
    const sb = document.getElementById('btnSay');
    if(sb) sb.onclick = () => {
      sb.classList.remove('on'); void sb.offsetWidth; sb.classList.add('on');
      Audio_.unlock(); Engine.repeat();
    };

    wrap.querySelectorAll('.fcell').forEach(btn=>{
      btn.onclick = () => Engine.findPick(+btn.dataset.i, btn);
    });
    wrap.querySelectorAll('.mcard').forEach(btn=>{
      btn.onclick = () => Engine.memoryPick(+btn.dataset.m, btn);
    });

    wrap.querySelectorAll('.choice').forEach(btn=>{
      btn.onclick = () => {
        if(btn.disabled) return;
        const raw = btn.dataset.v;
        if(q.mode === 'pairs'){ Engine.pairPick(raw, btn.dataset.side, btn); return; }
        const ordered = q.mode === 'order' || q.mode === 'grid';
        const val = ordered ? (q.numeric === false ? raw : Number(raw))
                            : (typeof q.answer === 'number' ? Number(raw) : raw);
        if(ordered) Engine.pick(val, btn);
        else Engine.answer(val, btn);
      };
    });
  }

  /* تحديث عدّاد النجوم فورًا مع كل إجابة صح */
  function bumpStars(){
    const num = document.getElementById('starNum'), pill = document.getElementById('starPill');
    if(!num) return;
    num.textContent = ar(Progress.get().stars);
    if(pill){ pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  }

  /* تمييز الخانة الفاضية اللي دور الطفل عليها */
  function markNext(i){
    const slots = document.querySelectorAll('#slots .slot');
    slots.forEach(sl => sl.classList.remove('now'));
    if(slots[i]) slots[i].classList.add('now');
  }

  function sayBtn(){ return `<button class="speak-btn" id="btnSay" aria-label="اسمع السؤال تاني">🔊</button>`; }

  function fillSlot(i, value, btn){
    document.querySelectorAll('.choice.hintme').forEach(b=>b.classList.remove('hintme'));
    const slots = document.querySelectorAll('#slots .slot');
    if(slots[i]){ slots[i].textContent = ar(value); slots[i].classList.add('filled','slot'); slots[i].classList.remove('now'); }
    markNext(i+1);
    btn.disabled = true; btn.style.opacity = .25; btn.style.pointerEvents='none';
    burst(btn, 3, '✨');
  }

  function setBubble(text, kind=''){
    const b = document.getElementById('bubble');
    if(!b) return;
    b.className = 'bubble ' + kind;
    b.textContent = text;
  }

  function correct(btn, firstTry, streak){
    document.querySelectorAll('.choice.hintme').forEach(b=>b.classList.remove('hintme'));
    if(btn){ btn.classList.add('right'); }
    document.querySelectorAll('.choice').forEach(b=>b.style.pointerEvents='none');
    setBubble(firstTry ? sample(PRAISE) : 'أحسنت! وصلت للإجابة 👏', 'ok');
    const lion = document.getElementById('lion');
    if(lion){ lion.classList.remove('sad'); void lion.offsetWidth; lion.classList.add('cheer'); }

    const big = firstTry && streak >= 3;
    flash('ok');
    burst(btn || lion, big ? 18 : (firstTry ? 10 : 5), big ? '🎉' : '⭐');
    if(firstTry) popMsg(big ? `🔥 ${ar(streak)} على التوالي!` : sample(PRAISE), big);
    if(big){ confetti(26); sparkle(btn || lion); }
    const dots = document.querySelectorAll('#dots .dot');
    const {idx} = Engine.state();
    if(dots[idx]){ dots[idx].className = 'dot ' + (firstTry?'done':'miss'); }
  }

  function wrong(btn, q, tries){
    flash('no');
    if(btn){
      btn.classList.add('wrong');
      setTimeout(()=>btn.classList.remove('wrong'), 420);
    }
    const card = document.getElementById('qcard');
    if(card){ card.classList.add('shake'); setTimeout(()=>card.classList.remove('shake'),420); }
    const lion = document.getElementById('lion');
    if(lion){ lion.classList.remove('cheer'); void lion.offsetWidth; lion.classList.add('sad'); }
    setBubble(`${sample(RETRY)} — ${q.hint}`, 'no');
    popMsg(sample(['😔','🙁','💭']), false, 'sadmsg');
    if(tries >= 2) hintCorrect(q);
  }

  /* بعد محاولتين: نلمّع الإجابة الصحيحة بدل العقاب */
  function hintCorrect(q){
    const st = Engine.state();
    const target = Array.isArray(q.answer) ? q.answer[st.picked.length] : q.answer;
    document.querySelectorAll('.choice').forEach(b=>{
      if(b.disabled) return;
      const v = typeof target === 'number' ? Number(b.dataset.v) : b.dataset.v;
      if(v === target) b.classList.add('hintme');
    });
  }

  /* ---------- النتيجة ---------- */
  function resultScreen({stage, correct, total, mistakes, unlocked, practice}){
    bar({back:stage.world, title:stage.name});
    const pct = Math.round(correct/total*100);
    const good = pct >= 80;
    screen.innerHTML = `
      <div class="qcard result">
        ${good
            ? `<div class="avatar big cheer" style="margin:0 auto"><img src="${Avatar.src()}" alt=""></div>`
            : `<div class="lion cheer" style="margin:0 auto">🐣</div>`}
        <h2 style="margin:6px 0 0;font-size:clamp(24px,6.4vw,34px)">${good?'أحسنت يا بطل! 🎉':'كمان شوية ومتقنها 💪'}</h2>
        <div class="score">${ar(correct)} / ${ar(total)}</div>
        <div class="starline">${'⭐'.repeat(correct)}${'☆'.repeat(total-correct)}</div>
        <div class="pct">نسبة النجاح ${ar(pct)}٪</div>
        ${unlocked?`<div class="bubble ok">🔓 فتحت مرحلة جديدة: ${unlocked.icon} ${unlocked.name}</div>`:''}
        ${mistakes.length?`<div class="bubble">تعالى نتدرب على الحاجات اللي محتاجة شوية تدريب ❤️</div>`:''}
        <div style="margin-top:14px">
          ${mistakes.length?`<button class="btn train" id="btnTrain">❤️ تدريب على الأخطاء</button>`:''}
          <button class="btn" id="btnAgain">🔁 العب تاني</button>
          ${unlocked?`<button class="btn go" id="btnNext">▶️ المرحلة التالية</button>`:''}
          <button class="btn ghost" id="btnHome">🗺️ الخريطة</button>
        </div>
      </div>`;
    if(good){ confetti(60); popMsg('🎉 أحسنت!', true); } else { confetti(10); }
    Audio_.speak([
      good ? 'أحسنت يا بطل' : 'محاولة حلوة، نجرب تاني',
      `جبت ${arNum(correct)} من ${arNum(total)}`,
      unlocked ? `وفتحت مرحلة جديدة: ${unlocked.name}` : '',
      mistakes.length ? 'تعالى نتدرب على الحاجات اللي محتاجة شوية تدريب' : ''
    ], [good ? 'well_done' : 'nice_try', 'got', nk(correct), 'of', nk(total)]
       .concat(unlocked ? ['unlocked'] : [])
       .concat(mistakes.length ? ['practice'] : []));

    const g = id => document.getElementById(id);
    if(g('btnTrain')) g('btnTrain').onclick = () => Engine.trainMistakes();
    g('btnAgain').onclick = () => Engine.replay();
    if(g('btnNext'))  g('btnNext').onclick  = () => Engine.start(unlocked.id);
    g('btnHome').onclick = () => worldMap(stage.world);
  }

  /* ---------- مؤثرات ---------- */
  function burst(el, n, ch){
    if(!el || typeof el.getBoundingClientRect !== 'function') return;
    const r = el.getBoundingClientRect();
    for(let i=0;i<n;i++){
      const s = document.createElement('span');
      s.className = 'fxs'; s.textContent = ch;
      s.style.left = (r.left + r.width/2) + 'px';
      s.style.top  = (r.top  + r.height/2) + 'px';
      s.style.setProperty('--dx', rnd(-130,130)+'px');
      s.style.setProperty('--dy', rnd(-170,-50)+'px');
      s.style.setProperty('--rot', rnd(-220,220)+'deg');
      fx.appendChild(s);
      setTimeout(()=>s.remove(), 950);
    }
  }
  /* ومضة لون على الشاشة كلها — خضرا للصح وحمرا للغلط */
  function flash(kind){
    const f = document.createElement('div');
    f.className = 'flash ' + kind;
    fx.appendChild(f);
    setTimeout(()=>f.remove(), 700);
  }

  /* رسالة بتطلع في النص وتختفي */
  function popMsg(text, big, cls){
    const m = document.createElement('div');
    m.className = 'popmsg ' + (big ? 'big ' : '') + (cls || '');
    m.textContent = text;
    fx.appendChild(m);
    setTimeout(()=>m.remove(), big ? 1600 : 1200);
  }

  /* حلقات لامعة حوالين العنصر */
  function sparkle(el){
    if(!el || typeof el.getBoundingClientRect !== 'function') return;
    const r = el.getBoundingClientRect();
    for(let i=0;i<3;i++){
      const ring = document.createElement('div');
      ring.className = 'ring';
      ring.style.left = (r.left + r.width/2) + 'px';
      ring.style.top  = (r.top + r.height/2) + 'px';
      ring.style.animationDelay = (i*.16) + 's';
      fx.appendChild(ring);
      setTimeout(()=>ring.remove(), 1200);
    }
  }

  function confetti(n){
    const cols = PALETTE;
    for(let i=0;i<n;i++){
      const c = document.createElement('i');
      c.className = 'conf';
      c.style.left = rnd(0,100)+'vw';
      c.style.background = sample(cols);
      c.style.animationDuration = (rnd(18,34)/10)+'s';
      c.style.animationDelay = (rnd(0,9)/10)+'s';
      fx.appendChild(c);
      setTimeout(()=>c.remove(), 4200);
    }
  }

  /* ---------- الإعدادات ---------- */
  const sheet = document.getElementById('sheet');
  function syncSwitches(){
    const s = Progress.get().settings;
    document.getElementById('swSpeech').setAttribute('aria-checked', !!s.speech);
    document.getElementById('swSfx').setAttribute('aria-checked', !!s.sfx);
    document.getElementById('swDev').setAttribute('aria-checked', !!s.dev);
    const info = document.getElementById('voiceInfo');
    const ok = !!Audio_.voiceName();
    info.innerHTML = Audio_.report().map(l=>`• ${l}`).join('<br>') + (ok ? '' :
      '<br><br><b>تنزيل صوت عربي:</b><br>' +
      'ويندوز: Settings ← Time &amp; language ← Language &amp; region ← Add a language ← العربية، وبعد التنزيل افتح خياراتها وفعّل Speech.<br>' +
      'أندرويد: الإعدادات ← تحويل النص إلى كلام ← نزّل العربية.<br>' +
      'آيفون: الإعدادات ← تسهيلات الاستخدام ← المحتوى المنطوق ← الأصوات ← العربية.');
    info.style.background = ok ? '#DFF7E2' : '';
    info.style.color = ok ? '#17632E' : '';
    fillVisits();
  }
  function fillVisits(){
    const el = document.getElementById('visitInfo');
    const note = document.getElementById('visitNote');
    if(!el || !window.Visits) return;
    const cached = Visits.get();
    el.textContent = cached ? ar(cached) : '…';
    if(note) note.textContent = 'بنجيب العدد من الموقع المنشور…';
    Visits.ping().then(n => {
      el.textContent = ar(n || 0);
      if(note){
        note.textContent = Visits.live()
          ? 'كل جهاز جديد بيزوّد الرقم مرة واحدة في الجلسة.'
          : 'الرقم ده من الرابط المنشور. عشان يتعدّ، لازم الزائر يفتح github.io مش الملف من الجهاز.';
      }
    }).catch(() => {
      el.textContent = cached ? ar(cached) : '—';
      if(note) note.textContent = 'العداد مش واصل. ارفعي js/visits.js وحدّثي الصفحة على GitHub.';
    });
  }
  function openSheet(){ syncSwitches(); sheet.classList.add('open'); }
  function closeSheet(){ sheet.classList.remove('open'); }

  function bindSettings(){
    const s = () => Progress.get().settings;
    document.getElementById('swSpeech').onclick = ()=>{ s().speech = !s().speech; Progress.save(); syncSwitches(); if(!s().speech) Audio_.stop(); };
    document.getElementById('swSfx').onclick    = ()=>{ s().sfx = !s().sfx; Progress.save(); syncSwitches(); if(s().sfx) Audio_.good(); };
    document.getElementById('swDev').onclick    = ()=>{ s().dev = !s().dev; Progress.save(); syncSwitches(); mathMap(); };
    document.getElementById('btnTest').onclick = ()=>{
      Audio_.unlock();
      Progress.get().settings.speech = true; Progress.save(); syncSwitches();
      Audio_.speak(['أهلاً يا بطل، أنا الأسد صاحبك', 'واحد، اتنين، تلاتة']);
      Audio_.good();
      setTimeout(syncSwitches, 1800);
    };
    document.getElementById('btnGuide').onclick  = ()=>{
      closeSheet(); bar({back:'shell', title:'📘 دليل الوالدين'}); Guide.screen();
    };
    document.getElementById('btnPG').onclick = ()=>{ closeSheet(); ParentGuide.home(); };
    document.getElementById('btnParent').onclick = ()=>{ closeSheet(); Shell.askParent(); };
    document.getElementById('btnCloseSheet').onclick = closeSheet;
    document.getElementById('btnReset').onclick = ()=>{
      Progress.reset(); closeSheet(); Shell.home();
    };
    sheet.onclick = e => { if(e.target === sheet) closeSheet(); };
  }

  return {mathMap, worldMap, bar, bumpStars, confetti, popMsg, gameScreen, renderQuestion, renderDots, correct, wrong, fillSlot, markNext,
          resultScreen, bindSettings, setBubble};
})();

