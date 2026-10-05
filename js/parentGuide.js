/* ============================================================
   js/parentGuide.js — دليل ولي الأمر ❤️
   قسم جزء من نفس التطبيق: بيستخدم نفس UI.bar و Progress و localStorage.
   - مفيش بيانات بتتبعت لأي مكان (مفيش سيرفر، ومفيش كاميرا ولا ميكروفون).
   - خطط المتابعة بتتخزّن جوه Progress.get().parentGuide على الجهاز ده بس.
   - المحتوى في data/parent-*.js، والبحث بالكلمات المحلية (tags) فقط.
   ============================================================ */
const ParentGuide = (() => {
  const screen = () => document.getElementById('screen');
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const byId = id => PG_DATA.find(b => b.id === id);
  const label = b => b.alt || b.title;
  const goal  = b => PG_GOALS[b.id] || label(b);
  const childName = () => (Progress.get().name || '').trim() || 'بطل';
  const fill = s => String(s).replace(/\{name\}/g, (Progress.get().name || '').trim() || 'الطفل');
  const DAYS = 7;

  /* ---------- الحالة المحفوظة ---------- */
  const store = () => {
    const p = Progress.get();
    if(!p.parentGuide || !p.parentGuide.focus) p.parentGuide = {focus:{}};
    return p.parentGuide;
  };
  const focus = () => store().focus;
  const doneCount = f => (f.days || []).filter(Boolean).length;

  /* ---------- البحث: Tags محلية (قابل للتطوير لاحقًا بـ AI) ---------- */
  const norm = s => String(s || '').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\u0621-\u064Aa-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const STOP = new Set(['ابني','ابنتي','بنتي','طفلي','طفلتي','انا','هو','هي','ده','دي','دا','في','من','علي','عن','مع',
    'لما','لو','كل','بقي','عمال','قوي','جدا','اوي','كتير','حاجه','ايه','ليه','ازاي','مش','لا','ما','بس','يا','بعد','قبل','عند','اللي','الي']);
  const stripAl = t => t.replace(/^ال/, '');

  function buildIndex(){
    PG_DATA.forEach(b => {
      b._phr = []; b._one = [];
      (b.tags || []).forEach(tag => {
        const n = norm(tag);
        if(!n) return;
        if(n.includes(' ')) b._phr.push(n); else b._one.push(stripAl(n));
      });
    });
  }

  function search(q){
    const nq = norm(q);
    if(!nq) return [];
    const toks = nq.split(' ').map(stripAl).filter(t => t.length >= 3 && !STOP.has(t));
    const out = [];
    PG_DATA.forEach(b => {
      let s = 0;
      b._phr.forEach(p => { if(nq.includes(p)) s += 6; });
      b._one.forEach(tag => toks.forEach(t => {
        if(t === tag) s += 3;
        else if(tag.length >= 3 && t.includes(tag)) s += 2;
        else if(t.length >= 3 && tag.includes(t)) s += 1;
      }));
      if(s) out.push([s, b]);
    });
    return out.sort((a, b) => b[0] - a[0]).map(x => x[1]);
  }

  /* ---------- نسخ نص ---------- */
  function copyText(text, btn){
    const old = btn.textContent;
    const done = () => { btn.textContent = '✓ اتنسخت'; setTimeout(() => { btn.textContent = old; }, 1600); };
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy') ? done() : (btn.textContent = 'انسخه يدويًا'); }
      catch(e){ btn.textContent = 'انسخه يدويًا'; }
      ta.remove();
    };
    if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  const quote = (text, id) => `
    <div class="pg-quote">
      <p>${esc(text)}</p>
      <button class="pg-copy" data-copy="${esc(text)}" type="button">📋 نسخ</button>
    </div>`;
  const say = t => t ? `<span class="pg-say">« ${esc(t)} »</span>` : '';

  /* ============================================================
     الصفحة الرئيسية
     ============================================================ */
  let view = {cat:'all', q:''};

  function card(b){
    return `<button class="pg-card" data-id="${b.id}" type="button">
      <span class="pg-ci" aria-hidden="true">${b.icon}</span>
      <span class="pg-ct">${esc(b.title)}</span>
    </button>`;
  }

  function resultsHtml(){
    const q = view.q.trim();
    if(q){
      const hits = search(q).slice(0, 6);
      if(!hits.length){
        return `<p class="pg-empty">مفيش نتيجة لـ «${esc(q)}». جرّب كلمات تانية (زي: بيضرب، مش بيسمع الكلام، بيعيط)، أو اختار من التصنيفات تحت.</p>`;
      }
      return `<div class="pg-hits" role="list">
        ${hits.map(b => `<button class="pg-hit" role="listitem" data-id="${b.id}" type="button">
          <span class="pg-ci" aria-hidden="true">${b.icon}</span>
          <span class="pg-ht">${esc(label(b))}${b.alt ? `<small>${esc(b.title)}</small>` : ''}</span>
        </button>`).join('')}
      </div>`;
    }
    let list;
    if(view.cat === 'all'){
      const rest = PG_DATA.filter(b => !PG_FEATURED.includes(b.id));
      list = PG_FEATURED.map(byId).filter(Boolean).concat(rest);
    }else{
      list = PG_DATA.filter(b => b.cat === view.cat);
    }
    return `<div class="pg-grid">${list.map(card).join('')}</div>`;
  }

  function home(){
    UI.bar({back:'shell', title:'دليل ولي الأمر'});
    const chips = [{id:'all', icon:'🗂️', name:'الكل'}].concat(PG_CATEGORIES);
    const nFocus = Object.keys(focus()).filter(byId).length;

    screen().innerHTML = `
      <div class="qcard dash pg">
        <header class="pg-head">
          <h2>دليل ولي الأمر ❤️</h2>
          <p class="pg-lead"><span aria-hidden="true">🦁</span> مش لازم تكون أب أو أم مثالي... المهم تعرف تساعد طفلك.</p>
        </header>

        <label class="pg-search" for="pgQ">
          <span class="pg-slabel">طفلك بيعمل إيه؟</span>
          <input id="pgQ" type="search" inputmode="search" autocomplete="off"
                 placeholder="اكتب مثلًا: ابني بيضرب" value="${esc(view.q)}">
        </label>

        <div class="pg-chips" role="group" aria-label="التصنيفات">
          ${chips.map(c => `<button class="pg-chip" type="button" data-cat="${c.id}"
              aria-pressed="${view.cat === c.id && !view.q}">${c.icon} ${esc(c.name)}</button>`).join('')}
        </div>

        <div id="pgResults" aria-live="polite">${resultsHtml()}</div>

        <div class="pg-actions">
          <button class="btn" id="pgKid" type="button">🧒 أتعلم أتصرف إزاي؟</button>
          ${nFocus ? `<button class="btn ghost" id="pgFocus" type="button">⭐ أهدافي (${ar(nFocus)})</button>` : ''}
        </div>

        <p class="pg-foot">دليل للتربية الهادئة بمعلومات عامة — مش تشخيص نفسي أو طبي. أي خطط بتحفظها بتفضل على الجهاز ده بس ومابتتبعتش لأي مكان.</p>
        <div class="center" style="margin-top:12px"><button class="btn ghost" id="pgBack" type="button">رجوع</button></div>
      </div>`;

    const res = document.getElementById('pgResults');
    const bindResults = () => {
      res.querySelectorAll('[data-id]').forEach(el => el.onclick = () => detail(el.dataset.id));
    };
    bindResults();

    const input = document.getElementById('pgQ');
    input.oninput = () => {
      view.q = input.value;
      res.innerHTML = resultsHtml();
      bindResults();
      screen().querySelectorAll('.pg-chip').forEach(c =>
        c.setAttribute('aria-pressed', String(!view.q && c.dataset.cat === view.cat)));
    };
    screen().querySelectorAll('.pg-chip').forEach(c => c.onclick = () => {
      view.cat = c.dataset.cat; view.q = ''; input.value = '';
      res.innerHTML = resultsHtml(); bindResults();
      screen().querySelectorAll('.pg-chip').forEach(x =>
        x.setAttribute('aria-pressed', String(x.dataset.cat === view.cat)));
    });
    document.getElementById('pgKid').onclick = () => kidHub('pg');
    const pf = document.getElementById('pgFocus');
    if(pf) pf.onclick = () => { UI.bar({back:'pg', title:'⭐ أهدافي'}); focusScreen(); };
    document.getElementById('pgBack').onclick = () => Shell.home();
  }

  /* ============================================================
     صفحة تفاصيل السلوك
     ============================================================ */
  function sec(icon, title, body, {open = true, sub = ''} = {}){
    return `<details class="pg-sec" ${open ? 'open' : ''}>
      <summary><span class="pg-si" aria-hidden="true">${icon}</span> ${title}</summary>
      <div class="pg-sb">${sub ? `<p class="pg-sub">${sub}</p>` : ''}${body}</div>
    </details>`;
  }

  function planHtml(b){
    const f = focus()[b.id];
    if(!f){
      return `<p>لو قررت تشتغل على السلوك ده، اعمله هدف وتابع ٧ أيام.</p>
        <button class="btn" data-plan="start" type="button">☑️ نعمل حاليًا على هذا السلوك</button>`;
    }
    const n = doneCount(f);
    const dayBtns = Array.from({length: DAYS}, (_, i) => `
      <button class="pg-day ${f.days[i] ? 'on' : ''}" type="button" data-day="${i}"
              aria-pressed="${!!f.days[i]}" aria-label="اليوم ${ar(i + 1)}">
        <span>${f.days[i] ? '✅' : '⬜'}</span><b>اليوم ${ar(i + 1)}</b>
      </button>`).join('');
    return `
      <p class="pg-planhead">☑️ ${esc(goal(b))} ${f.paused ? '<em class="pg-paused">(موقوف مؤقتًا)</em>' : ''}</p>
      <div class="pg-days">${dayBtns}</div>
      <p class="pg-sub">${n >= DAYS ? '🎉 خلّصت ٧ أيام. تحب تكمل أسبوع تاني؟' : `عملت ${ar(n)} من ${ar(DAYS)} أيام.`}
        الخطة دي تذكير ليك إنت بالاستمرار — مش تقييم لطفلك.</p>
      <div class="pg-planbtns">
        <button class="btn ghost" data-plan="${f.paused ? 'resume' : 'pause'}" type="button">${f.paused ? '▶️ استئناف' : '⏸️ إيقاف مؤقت'}</button>
        <button class="btn ghost" data-plan="restart" type="button">🔁 أسبوع جديد</button>
        <button class="btn ghost" data-plan="remove" type="button">🗑️ إزالة الهدف</button>
      </div>`;
  }

  function helpHtml(b){
    let extra = '';
    if(b.help){
      const t = b.help.replace(/^و?لو/, 'لو').replace(/\.$/, '');
      extra = `<p>وبشكل خاص: ${esc(t)}${/استشر/.test(t) ? '' : ' — فمن الأفضل عرض الأمر على طبيب الأطفال أو مختص مناسب'}.</p>`;
    }
    return `<p>${esc(PG_HELP_BASE)}</p>${extra}`;
  }

  function detail(id, keepScroll){
    const b = byId(id);
    if(!b) return home();
    const y = keepScroll ? window.scrollY : 0;
    UI.bar({back:'pg', title:`${b.icon} ${esc(label(b))}`});

    const steps = `<ol class="pg-steps">${b.steps.map(s =>
      `<li><b>${esc(s.t)}</b>${say(s.say)}</li>`).join('')}</ol>`;
    const why = `<ul>${b.why.map(w => `<li>قد يكون: ${esc(w)}</li>`).join('')}</ul>`;
    const avoid = `<ul class="pg-avoid">${b.avoid.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;
    const teach = `<table class="pg-teach">
      <thead><tr><th scope="col">بدل ❌</th><th scope="col">علّمه ✅</th></tr></thead>
      <tbody>${b.teach.map(t => `<tr><td>${esc(t[0])}</td><td>${esc(t[1])}</td></tr>`).join('')}</tbody></table>`;
    const calm = `<p class="pg-sub">الهدف هو التعليم، مش إذلال الطفل.</p>
      <ul>${b.calm.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      ${b.calmSay ? quote(b.calmSay) : ''}`;
    const kid = `<p>لعبة قصيرة للطفل: موقف بسيط، واختيارات، وتشجيع على الاختيار الهادي. مفيش خسارة ولا عقاب.</p>
      <button class="btn" id="pgPlayKid" type="button">🧒 العب مع طفلك</button>`;

    screen().innerHTML = `
      <div class="qcard dash pg">
        <header class="pg-head pg-dhead">
          <div class="pg-big" aria-hidden="true">${b.icon}</div>
          <h2>${esc(b.title)}</h2>
          ${(catOfBehavior(b)) ? `<p class="pg-cat">${catOfBehavior(b)}</p>` : ''}
        </header>

        ${sec('🔎', 'ما الذي يحدث؟', `<p>${esc(b.what)}</p>`)}
        ${sec('🤔', 'لماذا قد يحدث هذا؟', why, {sub:'دي احتمالات مش تشخيص مؤكد. وطفلك مش مُلام.'})}
        ${sec('🧭', 'ماذا أفعل الآن؟', steps)}
        ${sec('💬', 'ماذا أقول لطفلي؟', b.phrases.map(p => quote(p)).join(''), {sub:'جمل جاهزة — اضغط نسخ وعدّلها بكلامك.'})}
        ${sec('❌', 'تجنّب', avoid)}
        ${sec('🌱', 'ماذا أعلّمه بدلًا من ذلك؟', teach)}
        ${sec('❤️', 'بعد ما يهدأ', calm)}
        ${sec('🧒', 'أتعلم أتصرف إزاي؟', kid)}
        ${sec('⭐', 'متابعة: نعمل على ده حاليًا', `<div id="pgPlan">${planHtml(b)}</div>`)}
        ${sec('⚠️', 'متى أحتاج لاستشارة مختص؟', helpHtml(b), {open:false})}

        <div class="center" style="margin-top:16px">
          <button class="btn ghost" id="pgBack2" type="button">رجوع للدليل</button>
        </div>
      </div>`;

    bindDetail(b);
    window.scrollTo(0, y);
  }

  function catOfBehavior(b){
    const c = PG_CATEGORIES.find(x => x.id === b.cat);
    return c ? `${c.icon} ${esc(c.name)}` : '';
  }

  function bindDetail(b){
    const root = screen();
    root.querySelectorAll('.pg-copy').forEach(btn => btn.onclick = () => copyText(btn.dataset.copy, btn));
    document.getElementById('pgBack2').onclick = home;
    document.getElementById('pgPlayKid').onclick = () => kidStart([b.id], 'pg', b.id);

    const plan = document.getElementById('pgPlan');
    plan.onclick = e => {
      const t = e.target.closest('button');
      if(!t) return;
      const f = focus();
      const act = t.dataset.plan;
      if(t.dataset.day !== undefined){
        const i = Number(t.dataset.day);
        f[b.id].days[i] = !f[b.id].days[i];
      }else if(act === 'start'){
        f[b.id] = {start:Date.now(), days:Array(DAYS).fill(false), paused:false};
      }else if(act === 'pause'){ f[b.id].paused = true; }
      else if(act === 'resume'){ f[b.id].paused = false; }
      else if(act === 'restart'){ f[b.id] = {start:Date.now(), days:Array(DAYS).fill(false), paused:false}; }
      else if(act === 'remove'){
        if(!confirm('تشيل الهدف ده؟')) return;
        delete f[b.id];
      }else return;
      Progress.save();
      plan.innerHTML = planHtml(b);
    };
  }

  /* ============================================================
     أهدافي (السلوكيات اللي بتشتغل عليها)
     ============================================================ */
  function daysText(f){
    const n = doneCount(f);
    if(n === 0) return 'لسه ما بدأتش';
    if(n === 1) return 'يوم واحد';
    if(n === 2) return 'يومان';
    return `${ar(n)} أيام`;
  }

  function focusRows(){
    const f = focus();
    const ids = Object.keys(f).filter(byId);
    if(!ids.length){
      return `<p class="pg-empty">لسه ما اخترتش سلوك تشتغل عليه. افتح دليل ولي الأمر واضغط «نعمل حاليًا على هذا السلوك».</p>`;
    }
    return ids.map(id => {
      const b = byId(id), x = f[id];
      return `<div class="pg-frow ${x.paused ? 'paused' : ''}">
        <button class="pg-fname" type="button" data-open="${id}">${b.icon} ${esc(goal(b))}</button>
        <span class="pg-fdays">${daysText(x)}${x.paused ? ' • موقوف' : ''}</span>
        <span class="pg-fbtns">
          <button class="pg-mini" type="button" data-act="${x.paused ? 'resume' : 'pause'}" data-id="${id}">${x.paused ? 'استئناف' : 'إيقاف مؤقت'}</button>
          <button class="pg-mini" type="button" data-act="del" data-id="${id}">إزالة</button>
        </span>
      </div>`;
    }).join('');
  }

  function bindFocus(root, refresh){
    root.onclick = e => {
      const t = e.target.closest('button');
      if(!t) return;
      if(t.dataset.open){ UI.bar({back:'pg', title:'دليل ولي الأمر'}); detail(t.dataset.open); return; }
      const id = t.dataset.id, f = focus();
      if(!id || !f[id]) return;
      if(t.dataset.act === 'pause') f[id].paused = true;
      else if(t.dataset.act === 'resume') f[id].paused = false;
      else if(t.dataset.act === 'del'){ if(!confirm('تشيل الهدف ده؟')) return; delete f[id]; }
      Progress.save();
      refresh();
    };
  }

  /* شاشة مستقلة (من دليل ولي الأمر) */
  function focusScreen(){
    screen().innerHTML = `
      <div class="qcard dash pg">
        <h2 style="margin:0 0 6px">⭐ السلوكيات التي تعمل عليها</h2>
        <p class="pg-sub">تقدر توقف أو تشيل أي هدف، وتفتحه تتابع الأيام.</p>
        <div class="pg-focus" id="pgFocusBox">${focusRows()}</div>
        <div class="center" style="margin-top:16px"><button class="btn ghost" id="pgFBack" type="button">رجوع</button></div>
      </div>`;
    const box = document.getElementById('pgFocusBox');
    bindFocus(box, () => { box.innerHTML = focusRows(); });
    document.getElementById('pgFBack').onclick = home;
  }

  /* كارت لوحة ولي الأمر (Shell.dashboard) */
  function dashCard(){
    return `<h3 style="margin:18px 0 6px">⭐ السلوكيات التي تعمل عليها</h3>
      <div class="pg-focus" id="pgDash">${focusRows()}</div>`;
  }
  function bindDash(refreshAll){
    const box = document.getElementById('pgDash');
    if(box) bindFocus(box, refreshAll);
  }

  /* ============================================================
     🧒 أتعلم أتصرف إزاي؟  (ألعاب الطفل — موقف + اختيارات)
     ============================================================ */
  let kid = null;

  function kidBar(){
    UI.bar({back: kid && kid.from === 'shell' ? 'shell' : 'pg', title:'🧒 أتعلم أتصرف إزاي؟'});
  }

  function kidHub(from){
    kid = {from: from || 'pg'};
    kidBar();
    screen().innerHTML = `
      <div class="qcard pg pg-kid">
        <h2 class="pg-kh">🧒 أتعلم أتصرف إزاي؟</h2>
        <p class="pg-sub" style="text-align:center">مواقف بسيطة: اختار التصرف اللي يخلّي الكل مبسوط.</p>
        <div class="center"><button class="btn" id="pgRand" type="button">🎲 العب ٥ مواقف</button></div>
        <div class="pg-grid pg-kgrid">
          ${PG_DATA.filter(b => b.game).map(b => `<button class="pg-card" type="button" data-id="${b.id}">
            <span class="pg-ci" aria-hidden="true">${b.icon}</span>
            <span class="pg-ct">${esc(goal(b))}</span></button>`).join('')}
        </div>
        <div class="center" style="margin-top:14px"><button class="btn ghost" id="pgKBack" type="button">رجوع</button></div>
      </div>`;
    screen().querySelectorAll('.pg-card').forEach(c => c.onclick = () => kidStart([c.dataset.id], from, c.dataset.id, true));
    document.getElementById('pgRand').onclick = () => {
      const ids = shuffle(PG_DATA.filter(b => b.game).map(b => b.id)).slice(0, 5);
      kidStart(ids, from);
    };
    document.getElementById('pgKBack').onclick = () => (from === 'shell' ? Shell.home() : home());
  }

  function kidStart(ids, from, backId, fromHub){
    kid = {ids, i:0, stars:0, from: from || 'pg', backId, fromHub: !!fromHub, wrong:0};
    kidQuestion();
  }

  function kidQuestion(){
    kidBar();
    const b = byId(kid.ids[kid.i]);
    const g = b.game;
    const opts = shuffle(g.opts.map(o => ({t:o[0], ok:!!o[1]})));
    kid.wrong = 0;
    const total = kid.ids.length;

    screen().innerHTML = `
      <div class="qcard pg pg-kid">
        ${total > 1 ? `<div class="dots" aria-hidden="true">${kid.ids.map((_, i) =>
          `<span class="dot ${i < kid.i ? 'done' : ''} ${i === kid.i ? 'now' : ''}"></span>`).join('')}</div>` : ''}
        <div class="pg-kicon" aria-hidden="true">${b.icon}</div>
        <h2 class="pg-kq">${esc(fill(g.q))}</h2>
        <div class="pg-opts" id="pgOpts">
          ${opts.map((o, i) => `<button class="pg-opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}
        </div>
        <div id="pgFb" class="pg-fb" aria-live="polite"></div>
      </div>`;
    try{ Audio_.speak(fill(g.q)); }catch(e){}

    const wrap = document.getElementById('pgOpts');
    const fb = document.getElementById('pgFb');
    wrap.querySelectorAll('.pg-opt').forEach(btn => btn.onclick = () => {
      const o = opts[Number(btn.dataset.i)];
      if(o.ok){
        wrap.querySelectorAll('.pg-opt').forEach(x => { x.disabled = true; });
        btn.classList.add('ok');
        if(!kid.wrong) kid.stars++;
        try{ Audio_.good(); }catch(e){}
        const last = kid.i >= kid.ids.length - 1;
        fb.className = 'pg-fb good';
        fb.innerHTML = `<div class="pg-star" aria-hidden="true">⭐</div>
          ${/^(ممتاز|جميل|برافو)/.test(g.ok) ? '' : '<p><b>ممتاز!</b></p>'}<p>${esc(g.ok)}</p>
          <button class="btn" id="pgNext" type="button">${last ? 'خلصت 🎉' : 'التالي'}</button>`;
        document.getElementById('pgNext').onclick = () => { kid.i++; last ? kidEnd() : kidQuestion(); };
      }else{
        kid.wrong++;
        btn.disabled = true; btn.classList.add('no');
        try{ Audio_.bad(); }catch(e){}
        fb.className = 'pg-fb soft';
        fb.innerHTML = `<p>قريب! جرّب اختيار تاني 💛 فيه تصرف أهدى.</p>`;
        if(kid.wrong >= 2){
          wrap.querySelectorAll('.pg-opt').forEach((x, i) => { if(opts[i].ok) x.classList.add('hint'); });
        }
      }
    });
  }

  function kidEnd(){
    kidBar();
    const total = kid.ids.length;
    const single = total === 1;
    screen().innerHTML = `
      <div class="qcard pg pg-kid center">
        <div class="pg-kicon" aria-hidden="true">🎉</div>
        <h2 class="pg-kq">أحسنت يا ${esc(childName())}!</h2>
        <p>${single ? 'خلّصت الموقف.' : `اخترت التصرف الهادي من أول مرة في ${ar(kid.stars)} من ${ar(total)} مواقف.`}</p>
        <div class="pg-planbtns" style="justify-content:center">
          <button class="btn" id="pgAgain" type="button">العب تاني</button>
          <button class="btn ghost" id="pgEndBack" type="button">رجوع</button>
        </div>
      </div>`;
    const ids = kid.ids.slice(), from = kid.from, backId = kid.backId, fromHub = kid.fromHub;
    document.getElementById('pgAgain').onclick = () => kidStart(single ? ids : shuffle(ids), from, backId, fromHub);
    document.getElementById('pgEndBack').onclick = () => {
      if(from === 'shell') kidHub('shell');
      else if(fromHub) kidHub('pg');
      else if(backId) { UI.bar({back:'pg', title:'دليل ولي الأمر'}); detail(backId); }
      else home();
    };
  }

  buildIndex();
  return {home, detail, search, kidHub, dashCard, bindDash};
})();
