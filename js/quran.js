/* ============================================================
   js/quran.js — عالم القرآن
   ------------------------------------------------------------
   مبدأ أساسي: النص القرآني لا يُكتب ولا يُولَّد هنا إطلاقًا.
   كل حرف بيتجاب من المصدر المحدد في js/config.js، ويُعرض كما هو
   بتشكيله وترتيبه. اللي بنعمله على النص هو العرض والتقسيم على
   المسافات فقط (للحفظ)، والمقارنة بتكون مع النص الأصلي حرفيًا.
   ============================================================ */

/* ---------- جلب النص وتخزينه ---------- */
const QuranSource = (() => {
  const CFG = QURAN_CONFIG;
  let cache = { v: CFG.cacheVersion, chapters: null, surahs: {} };

  function load(){
    try{
      const raw = localStorage.getItem(CFG.cacheKey);
      if(raw){
        const j = JSON.parse(raw);
        if(j && j.v === CFG.cacheVersion) cache = j;
      }
    }catch(e){}
  }
  function save(){
    try{ localStorage.setItem(CFG.cacheKey, JSON.stringify(cache)); }catch(e){}
  }
  const src = () => CFG.sources[CFG.textSource];

  async function grab(url){
    const r = await fetch(url, {cache:'force-cache'});
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  /* قائمة السور في النطاق المحدد */
  async function chapters(){
    if(cache.chapters) return cache.chapters;
    const s = src();
    const all = s.parseChapters(await grab(s.chaptersUrl));
    const list = all.filter(c => c.number >= CFG.range.from && c.number <= CFG.range.to)
                    .sort((a,b)=> a.number - b.number);
    if(!list.length) throw new Error('المصدر رجّع قائمة فاضية');
    cache.chapters = list; save();
    return list;
  }

  /* آيات سورة واحدة — من الكاش أو من المصدر */
  async function surah(n){
    if(cache.surahs[n]) return cache.surahs[n];
    const s = src();
    const ayahs = s.parseVerses(await grab(s.versesUrl(n)));
    if(!ayahs.length) throw new Error('المصدر رجّع آيات فاضية');
    cache.surahs[n] = ayahs; save();
    return ayahs;
  }

  const audioUrl = (surahNo, ayahNo, key) => {
    const r = CFG.reciters[key] || CFG.reciters[CFG.reciter];
    return CFG.ayahAudioUrl(r.folder, surahNo, ayahNo);
  };
  /* قرّاء "المعلّم" المتاحين — اللي فيهم ترديد */
  const teachers = () => Object.keys(CFG.reciters).filter(k => CFG.reciters[k].teacher);
  function repeatKey(){
    try{ const k = localStorage.getItem('rehlati.repeatReciter'); if(k && CFG.reciters[k]) return k; }catch(e){}
    return CFG.reciters[CFG.repeatReciter] ? CFG.repeatReciter : CFG.reciter;
  }
  function setRepeatKey(k){ if(CFG.reciters[k]){ try{ localStorage.setItem('rehlati.repeatReciter', k); }catch(e){} } }

  function setReciter(k){ if(CFG.reciters[k]){ CFG.reciter = k; try{ localStorage.setItem('rehlati.reciter', k); }catch(e){} } }
  function restoreReciter(){
    try{ const k = localStorage.getItem('rehlati.reciter'); if(k && CFG.reciters[k]) CFG.reciter = k; }catch(e){}
  }

  load(); restoreReciter();
  return {chapters, surah, audioUrl, setReciter, teachers, repeatKey, setRepeatKey,
          label:k => (CFG.reciters[k]||{}).label || '',
          sourceLabel:()=> src().label, cached:n => !!cache.surahs[n]};
})();

/* ---------- تقدّم القرآن (نفس نظام النجوم والـ Progress) ---------- */
const QuranProgress = {
  key: (s,m) => `${s}:${m}`,
  done(s,m){ return !!(Progress.get().quran || {})[this.key(s,m)]; },
  /* النشاط بيدّي نجومه مرة واحدة — إعادته مابتزوّدش العدّاد تاني */
  mark(s,m,stars){
    const st = Progress.get();
    st.quran = st.quran || {};
    const k = this.key(s,m);
    const have = st.quran[k] || 0, want = stars || 1;
    if(want <= have) return;
    st.quran[k] = want;
    Progress.addStar(want - have, 'quran');
  },
  surahStars(s){
    const q = Progress.get().quran || {};
    return ['listen','repeat','memorize','review'].filter(m => q[this.key(s,m)]).length;
  }
};

/* ---------- واجهة عالم القرآن ---------- */
const QuranWorld = (() => {
  const MODES = [
    {id:'listen',   icon:'🎧', name:'الاستماع', desc:'اسمع السورة آية آية'},
    {id:'repeat',   icon:'🗣️', name:'الترديد',  desc:'ردّد ورا الشيخ'},
    {id:'memorize', icon:'📖', name:'الحفظ',    desc:'رتّب كلمات الآية'},
    {id:'review',   icon:'🔄', name:'المراجعة', desc:'إيه الآية اللي بعدها؟'}
  ];
  let list = [], cur = null, ayahs = [], idx = 0, player = null;

  const screen = () => document.getElementById('screen');
  const esc = t => String(t).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  /* مشهد متحرك هادئ: سماء وغيم وطيور ونجوم */
  function scene(){
    const birds = [1,2,3,4,5].map(i => `
      <span class="bird b${i}">
        <svg viewBox="0 0 40 22" aria-hidden="true">
          <path class="w" d="M2 13 Q10 3 20 11"/>
          <path class="w" d="M20 11 Q30 3 38 13"/>
        </svg>
      </span>`).join('');
    const stars = [[8,14],[22,9],[38,17],[55,8],[71,15],[86,10],[94,20],[16,24],[64,22]]
      .map(([x,y],i) => `<span class="twinkle" style="--x:${x}%;--y:${y}%;--d:${i*.45}s"></span>`).join('');
    return `<div class="sky" aria-hidden="true">
      <span class="crescent">🌙</span>
      ${stars}
      <span class="cloud k1"></span><span class="cloud k2"></span><span class="cloud k3"></span>
      ${birds}
      <span class="palm p1">🌴</span><span class="palm p2">🌴</span>
      <span class="dome">🕌</span>
    </div>`;
  }

  function stopAudio(){
    if(player){ try{ player.pause(); }catch(e){} player.onended = null; player = null; }
  }

  function loading(text){
    screen().innerHTML = `<div class="qcard center">
      <div class="lion">📖</div>
      <h2 style="margin:8px 0">${text}</h2>
      <div class="order-hint">بنجيب النص من المصدر الموثوق…</div></div>`;
  }

  function failed(err, retry){
    screen().innerHTML = `<div class="qcard center">
      <div class="lion">📡</div>
      <h2 style="margin:8px 0;font-size:22px">مش قادر أوصل لمصدر النص</h2>
      <div class="note" style="text-align:start">
        القسم ده بيجيب النص القرآني من مصدر موثوق على الإنترنت، فمحتاج اتصال أول مرة بس،
        وبعدين بيشتغل أوفلاين.<br><br>
        <b>السبب:</b> ${esc(err.message || err)}<br>
        <b>المصدر الحالي:</b> ${esc(QuranSource.sourceLabel())}<br><br>
        لو المشكلة مستمرة، غيّر <code>textSource</code> في <code>js/config.js</code> للمصدر التاني.
      </div>
      <button class="btn" id="qRetry" style="margin-top:14px">🔄 جرّب تاني</button>
      <button class="btn ghost" id="qBack">🏠 الرئيسية</button></div>`;
    document.getElementById('qRetry').onclick = retry;
    document.getElementById('qBack').onclick = () => Shell.home();
  }

  /* ========== شاشة السور ========== */
  async function open(){
    stopAudio();
    UI.bar({back:'shell', title:'📖 القرآن'});
    loading('لحظة واحدة…');
    try{
      list = await QuranSource.chapters();
    }catch(e){ return failed(e, open); }

    const MODES_MINI = [['listen','🎧'],['repeat','🗣️'],['memorize','📖'],['review','🔄']];
    screen().innerHTML = `
      ${scene()}
      <div class="qwrap">
        <section class="hero">
          <div class="banner quran">📖 عالم القرآن</div>
          <h2>جزء عمّ</h2>
          <p>اختار سورة وابدأ الرحلة</p>
        </section>
        <div class="qpath">
          <div class="qstart">🕌 البداية</div>
          ${list.map(c => {
            const st = QuranProgress.surahStars(c.number);
            return `
            <div class="qlink"></div>
            <button class="qstop ${st ? 'done' : ''} ${st === 4 ? 'full' : ''}" data-n="${c.number}">
              <span class="qnum">${ar(c.number)}</span>
              <span class="qmeta">
                <span class="qname">${esc(c.name)}</span>
                <span class="qayn">${ar(c.ayahs)} آيات</span>
              </span>
              <span class="qdots">
                ${MODES_MINI.map(([m,ic]) =>
                  `<i class="${QuranProgress.done(c.number,m) ? 'on' : ''}">${ic}</i>`).join('')}
              </span>
            </button>`;
          }).join('')}
          <div class="qlink"></div>
          <div class="qend">🌟 تمّت الرحلة</div>
        </div>
      </div>`;
    screen().querySelectorAll('.qstop').forEach(b => b.onclick = () => surahScreen(+b.dataset.n));
  }

  /* ========== شاشة السورة: اختيار الوضع ========== */
  async function surahScreen(n){
    stopAudio();
    cur = list.find(c => c.number === n);
    UI.bar({back:'quran', title:cur.name});
    loading(`بنفتح سورة ${cur.name}`);
    try{
      ayahs = await QuranSource.surah(n);
    }catch(e){ return failed(e, ()=>surahScreen(n)); }

    screen().innerHTML = `
      ${scene()}
      <div class="qwrap">
      <section class="hero"><div class="banner quran">${esc(cur.name)}</div>
        <p>${ar(ayahs.length)} آيات — اختار إيه اللي عايز تعمله</p></section>
      <div class="modes">
        ${MODES.map(m => `<button class="mode" data-m="${m.id}">
            <span class="mi">${m.icon}</span>
            <span class="mn">${m.name}</span>
            <span class="md">${m.desc}</span>
            <span class="ms">${QuranProgress.done(n,m.id) ? '⭐' : ''}</span>
          </button>`).join('')}
      </div>
      <div class="reciter-row">
        <span>🎙️ القارئ</span>
        <select id="reciterSel">
          ${Object.keys(QURAN_CONFIG.reciters).map(k =>
            `<option value="${k}" ${QURAN_CONFIG.reciter===k?'selected':''}>${QURAN_CONFIG.reciters[k].label}</option>`).join('')}
        </select>
      </div>
      </div>`;
    document.getElementById('reciterSel').onchange = e => QuranSource.setReciter(e.target.value);
    screen().querySelectorAll('.mode').forEach(b => b.onclick = () => {
      const m = b.dataset.m;
      idx = 0;
      if(m === 'listen') listen();
      if(m === 'repeat') repeat();
      if(m === 'memorize') memorize();
      if(m === 'review') review();
    });
  }

  /* نص الآية — يُعرض كما ورد من المصدر بدون أي تعديل */
  const ayahBox = (a, active) =>
    `<div class="ayah ${active?'on':''}" data-n="${a.number}">
       <span class="atxt">${esc(a.text)}</span><span class="anum">${ar(a.number)}</span>
     </div>`;

  function playAyah(n, onEnd, key, isRetry){
    stopAudio();
    player = new Audio(QuranSource.audioUrl(cur.number, n, key));
    player.onended = onEnd || null;
    player.onerror = () => {
      /* لو تلاوة المعلّم مش متاحة، نرجع لقارئ السورة العادي بدل ما نسكت */
      if(key && !isRetry){
        UI.setBubble('تلاوة المعلّم مش متاحة دلوقتي — بنشغّل القارئ العادي 🎙️', 'no');
        playAyah(n, onEnd, null, true);
      }else{
        UI.setBubble('مش قادر أشغّل التلاوة — اتأكد من النت 📡', 'no');
      }
    };
    const p = player.play();
    if(p && p.catch) p.catch(()=> UI.setBubble('اضغط على الشاشة الأول عشان الصوت يشتغل 👆', 'no'));
  }

  /* ========== ١) الاستماع ========== */
  function listen(){
    let playing = false;
    UI.bar({back:'surah', title:'🎧 الاستماع'});
    screen().innerHTML = `
      <div class="qcard">
        <div class="ayah-list" id="alist">${ayahs.map((a,i)=>ayahBox(a, i===idx)).join('')}</div>
      </div>
      <div class="player">
        <button class="pbtn" id="pPrev">⏮</button>
        <button class="pbtn main" id="pPlay">▶️</button>
        <button class="pbtn" id="pNext">⏭</button>
      </div>
      <div class="bubble" id="bubble">آية ${ar(idx+1)} من ${ar(ayahs.length)}</div>`;

    const mark = () => {
      screen().querySelectorAll('.ayah').forEach((el,i)=> el.classList.toggle('on', i===idx));
      const on = screen().querySelector('.ayah.on');
      if(on) on.scrollIntoView({block:'center', behavior:'smooth'});
      UI.setBubble(`آية ${ar(idx+1)} من ${ar(ayahs.length)}`);
    };
    const step = () => {
      if(idx >= ayahs.length){
        idx = 0; playing = false;
        document.getElementById('pPlay').textContent = '▶️';
        QuranProgress.mark(cur.number, 'listen', 1);
        UI.setBubble('خلّصت السورة كلها! ⭐', 'ok');
        UI.bar({back:'surah', title:'🎧 الاستماع'});
        return;
      }
      mark();
      playAyah(ayahs[idx].number, () => { if(playing){ idx++; step(); } });
    };
    document.getElementById('pPlay').onclick = e => {
      playing = !playing;
      e.currentTarget.textContent = playing ? '⏸' : '▶️';
      if(playing) step(); else stopAudio();
    };
    document.getElementById('pPrev').onclick = () => { idx = Math.max(0, idx-1); if(playing) step(); else mark(); };
    document.getElementById('pNext').onclick = () => { idx = Math.min(ayahs.length-1, idx+1); if(playing) step(); else mark(); };
    screen().querySelectorAll('.ayah').forEach((el,i)=> el.onclick = () => { idx = i; mark(); playAyah(ayahs[i].number); });
  }

  /* ========== ٢) الترديد ========== */
  function repeat(){
    UI.bar({back:'surah', title:'🗣️ الترديد'});
    let rKey = QuranSource.repeatKey();
    const opts = [...QuranSource.teachers(), ...Object.keys(QURAN_CONFIG.reciters).filter(k => !QURAN_CONFIG.reciters[k].teacher)];
    const draw = () => {
      const a = ayahs[idx];
      const teach = (QURAN_CONFIG.reciters[rKey] || {}).teacher;
      screen().innerHTML = `
        <div class="dots">${ayahs.map((_,i)=>`<span class="dot ${i<idx?'done':''} ${i===idx?'now':''}"></span>`).join('')}</div>
        <div class="qcard">
          <div class="ayah on big">${esc(a.text)} <span class="anum">${ar(a.number)}</span></div>
          <div class="order-hint">${teach ? 'اسمع الشيخ والأطفال، وردّد معاهم 🗣️' : 'اسمع الآية، وبعدين ردّدها بصوتك 🗣️'}</div>
          <div class="player">
            <button class="pbtn main" id="rPlay">🔊 اسمع</button>
            <button class="pbtn ok" id="rDone">✅ ردّدتها</button>
          </div>
        </div>
        <div class="reciter-row">
          <span>🎙️ ترديد مع</span>
          <select id="rSel">
            ${opts.map(k => `<option value="${k}" ${rKey===k?'selected':''}>${QuranSource.label(k)}</option>`).join('')}
          </select>
        </div>
        <div class="lion" id="lion">🦁</div>
        <div class="bubble" id="bubble">آية ${ar(idx+1)} من ${ar(ayahs.length)}</div>`;
      document.getElementById('rSel').onchange = e => {
        rKey = e.target.value; QuranSource.setRepeatKey(rKey);
        draw();
      };
      document.getElementById('rPlay').onclick = () => playAyah(a.number, null, rKey);
      document.getElementById('rDone').onclick = () => {
        Audio_.good();
        if(idx + 1 >= ayahs.length){
          QuranProgress.mark(cur.number, 'repeat', 2);
          finish('ما شاء الله! ردّدت السورة كلها 🌟');
        }else{ idx++; draw(); }
      };
      playAyah(a.number, null, rKey);
    };
    draw();
  }

  /* ========== ٣) الحفظ — ترتيب كلمات الآية ========== */
  function memorize(){
    UI.bar({back:'surah', title:'📖 الحفظ'});
    let right = 0;
    const draw = () => {
      const a = ayahs[idx];
      /* التقسيم على المسافات فقط — الكلمات نفسها كما وردت بالضبط */
      const words = a.text.split(/\s+/).filter(Boolean);
      let picked = [];
      screen().innerHTML = `
        <div class="dots">${ayahs.map((_,i)=>`<span class="dot ${i<idx?'done':''} ${i===idx?'now':''}"></span>`).join('')}</div>
        <div class="qcard">
          <div class="ask-row"><h2 class="ask">رتّب كلمات الآية</h2>
            <button class="speak-btn" id="mPlay">🔊</button></div>
          <div class="word-slots" id="wslots">${words.map(()=>`<span class="wslot"></span>`).join('')}</div>
          <div class="words" id="wbank">
            ${shuffle(words.map((w,i)=>({w,i}))).map(o =>
              `<button class="word" data-i="${o.i}">${esc(o.w)}</button>`).join('')}
          </div>
        </div>
        <div class="lion" id="lion">🦁</div>
        <div class="bubble" id="bubble">آية ${ar(idx+1)} من ${ar(ayahs.length)}</div>`;

      document.getElementById('mPlay').onclick = () => playAyah(a.number);

      screen().querySelectorAll('.word').forEach(btn => btn.onclick = () => {
        const i = +btn.dataset.i;
        if(i === picked.length){
          const slots = screen().querySelectorAll('.wslot');
          slots[picked.length].textContent = words[i];
          slots[picked.length].classList.add('filled');
          picked.push(i);
          btn.disabled = true; btn.classList.add('used');
          Audio_.good();
          if(picked.length === words.length){
            right++;
            UI.setBubble('أحسنت! ما شاء الله 🌟','ok');
            setTimeout(()=>{
              if(idx + 1 >= ayahs.length){
                QuranProgress.mark(cur.number, 'memorize', 3);
                finish(`ختمت حفظ السورة! ${ar(right)} من ${ar(ayahs.length)} ⭐`);
              }else{ idx++; draw(); }
            }, 900);
          }
        }else{
          btn.classList.add('wrong');
          setTimeout(()=>btn.classList.remove('wrong'), 420);
          Audio_.bad();
          UI.setBubble('مش دي الكلمة اللي بعدها — اسمع الآية تاني 🔊','no');
        }
      });
      playAyah(a.number);
    };
    draw();
  }

  /* ========== ٤) المراجعة — إيه الآية اللي بعدها؟ ========== */
  function review(){
    UI.bar({back:'surah', title:'🔄 المراجعة'});
    if(ayahs.length < 3){
      screen().innerHTML = `<div class="qcard center"><div class="lion">🙂</div>
        <h2 style="font-size:20px">السورة دي قصيرة قوي على المراجعة</h2>
        <button class="btn ghost" id="bk">رجوع</button></div>`;
      document.getElementById('bk').onclick = () => surahScreen(cur.number);
      return;
    }
    let q = 0, right = 0;
    const total = Math.min(5, ayahs.length - 1);
    const draw = () => {
      const i = rnd(0, ayahs.length - 2);
      const correct = ayahs[i+1];
      /* الاختيارات كلها آيات حقيقية من نفس السورة — مفيش أي نص مُولَّد */
      const others = ayahs.filter(a => a.number !== correct.number && a.number !== ayahs[i].number);
      const opts = shuffle([correct, ...shuffle(others).slice(0,2)]);
      screen().innerHTML = `
        <div class="dots">${Array.from({length:total},(_,k)=>`<span class="dot ${k<q?'done':''} ${k===q?'now':''}"></span>`).join('')}</div>
        <div class="qcard">
          <div class="ask-row"><h2 class="ask">إيه الآية اللي بعدها؟</h2>
            <button class="speak-btn" id="vPlay">🔊</button></div>
          <div class="ayah on">${esc(ayahs[i].text)} <span class="anum">${ar(ayahs[i].number)}</span></div>
          <div class="ayah-choices">
            ${opts.map(o => `<button class="achoice" data-n="${o.number}">${esc(o.text)}</button>`).join('')}
          </div>
        </div>
        <div class="lion" id="lion">🦁</div>
        <div class="bubble" id="bubble">سؤال ${ar(q+1)} من ${ar(total)}</div>`;
      document.getElementById('vPlay').onclick = () => playAyah(ayahs[i].number);
      screen().querySelectorAll('.achoice').forEach(b => b.onclick = () => {
        if(+b.dataset.n === correct.number){
          b.classList.add('right'); right++; Audio_.good();
          UI.setBubble('صح! ⭐','ok');
          playAyah(correct.number);
          setTimeout(()=>{ q++; q >= total ? done() : draw(); }, 1400);
        }else{
          b.classList.add('wrong'); Audio_.bad();
          UI.setBubble('مش دي — اسمع الآية تاني ❤️','no');
          setTimeout(()=>b.classList.remove('wrong'), 500);
        }
      });
    };
    const done = () => {
      if(right >= Math.ceil(total * .8)) QuranProgress.mark(cur.number, 'review', 2);
      finish(`${ar(right)} من ${ar(total)} — ${right >= total*.8 ? 'ما شاء الله! 🌟' : 'كمّل مراجعة ❤️'}`);
    };
    draw();
  }

  /* ========== شاشة الختام ========== */
  function finish(text){
    stopAudio();
    Audio_.win();
    UI.bar({back:'surah', title:cur.name});
    screen().innerHTML = `
      <div class="qcard result">
        <div class="lion cheer" style="margin:0 auto">🌟</div>
        <h2 style="margin:8px 0;font-size:clamp(22px,6vw,30px)">${text}</h2>
        <div style="margin-top:14px">
          <button class="btn" id="fAgain">🔁 تاني</button>
          <button class="btn go" id="fModes">📖 ${esc(cur.name)}</button>
          <button class="btn ghost" id="fList">🗺️ كل السور</button>
        </div>
      </div>`;
    document.getElementById('fAgain').onclick = () => surahScreen(cur.number);
    document.getElementById('fModes').onclick = () => surahScreen(cur.number);
    document.getElementById('fList').onclick = () => open();
  }

  return {open, back:()=>surahScreen(cur.number), stop:stopAudio};
})();
