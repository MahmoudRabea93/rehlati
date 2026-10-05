/* ============================================================
   js/madd.js — قسم المدود (داخل عالم اللغة العربية)
   ------------------------------------------------------------
   بيستخدم نفس المحرك (Engine) ونفس النجوم والتقدّم و localStorage
   ونفس Adaptive ونفس نظام الشارات. الجديد هنا:
     • مولّدات الأسئلة (كل نوع لعبة = دالة صغيرة)
     • شاشة الدرس + شاشة التدريب الصغير (التعلّم المتكيّف)
     • كارت المدود في لوحة ولي الأمر
   المحتوى كله في data/madd.js.
   ============================================================ */
const Madd = (() => {
  const WORLD = 'arabic';
  const LETTERS = ['ا', 'و', 'ي'];
  const byKey = k => MADD_TYPES.find(t => t.key === k);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------- أدوات المقاطع ---------- */
  const build = (cons, key) => cons + byKey(key).harakaMark + byKey(key).maddLetter;   // م + ُ + و = مُو
  const baseOf = syl => syl.slice(0, -1);                                                // مُو → مُ
  const say = syl => MADD_SAY[syl] || syl;
  /* المقطع بحرف المد ملوّن — اللون + الشكل (مش اللون لوحده) */
  const hl = (syl, key) => `${esc(baseOf(syl))}<span class="hl t-${key}">${esc(syl.slice(-1))}</span>`;
  const label = t => `${t.box} ${t.name}`;

  /* ---------- التخزين: نفس كائن التقدّم الموحّد (rehlati.math.v1) ---------- */
  function store(){
    const p = Progress.get();
    const m = p.madd = p.madd || {};
    ['types','words','review','started','lessons','rounds'].forEach(k => m[k] = m[k] || {});
    return m;
  }
  const stageIds = () => WORLD_STAGES[WORLD].filter(id => PACKS[id].group === 'madd');

  /* إتقان نوع مد = ١٠ محاولات على الأقل ونسبة نجاح ٩٠٪ */
  function mastered(key){
    const t = store().types[key];
    return !!(t && t.tries >= 10 && t.ok / t.tries >= .9);
  }
  const wordMastered = w => !!(w && w.ok >= 2 && w.ok / w.tries >= .8);

  /* أخطاء نوع مد معيّن عبر كل مراحل المدود (من Adaptive الموجود) */
  function missFor(key){
    const s = Adaptive.store();
    return Object.keys(s).reduce((sum, k) =>
      (k.startsWith('madd_') && k.endsWith('|madd:' + key)) ? sum + s[k] : sum, 0);
  }
  function weakType(){
    const worst = MADD_TYPES.map(t => ({key:t.key, n:missFor(t.key)})).filter(x => x.n >= 3)
      .sort((a, b) => b.n - a.n)[0];
    return worst ? worst.key : null;
  }
  function reviewList(){
    const m = store();
    return MADD_TYPES.filter(t => m.review[t.key] || missFor(t.key) >= 3).map(t => t.key);
  }

  /* يتسجّل مرة واحدة لكل سؤال (أول محاولة) — بيتنادى من Engine */
  function onAnswer(q, ok){
    if(!q) return;
    const m = store();
    const bump = (obj, k) => { const o = obj[k] = obj[k] || {ok:0, tries:0}; o.tries++; if(ok) o.ok++; };
    if(q.mtype) bump(m.types, q.mtype);
    if(q.mword) bump(m.words, q.mword);
    if(q.stageId) m.started[q.stageId] = 1;
    Progress.save();
  }

  /* مكافآت إنهاء الجولة: +٢ لكل جولة، و +٥ أول مرة تنجح فيها المرحلة */
  function onFinish({correct, total, first}){
    const m = store(), st = Engine.state().stage;
    m.rounds[st.id] = (m.rounds[st.id] || 0) + 1;
    Progress.addStar(2, WORLD);
    if(first && correct / total >= .8) Progress.addStar(5, WORLD);
    Progress.save();
    awardChampion();
  }

  /* شارة بطل المدود: بنمنحها هنا مباشرة (بدل Rewards.check) عشان نفحص شارتنا بس —
     الفحص العام في المحرك مبيشتغلش أصلًا لأنه بيستخدم window.Rewards و Rewards عبارة عن const */
  function awardChampion(){
    const p = Progress.get(), b = BADGES.find(x => x.id === 'madd_champion');
    p.achievements = p.achievements || [];
    if(!b || p.achievements.includes(b.id) || !b.when(p)) return;
    p.achievements.push(b.id);
    Progress.save();
    setTimeout(() => Rewards.toast(b), 1500);
  }

  /* ============================================================
     المولّدات — كل واحدة بترجّع نفس شكل السؤال اللي المحرك يفهمه
     cfg = إعدادات المرحلة (الأنواع المسموحة)
     ============================================================ */
  const pickType = (cfg, o) => (o && o.focus && cfg.types.includes(o.focus)) ? o.focus : sample(cfg.types);
  function pickSyl(key, lv){
    const ex = byKey(key).examples;
    /* السهل الأول؛ ولو الطفل أتقن النوع نفتح كل الأمثلة */
    return sample((!mastered(key) && lv <= 1) ? ex.slice(0, 3) : ex);
  }
  const normalize = (syl, key) => build(syl[0], key);       // نضمن ترتيب الرموز الموحّد

  const Kinds = {

    /* G2 + G4 — اختر حرف المد: بَ _ → ا → بَا */
    letter(cfg, lv, o){
      const key = pickType(cfg, o), T = byKey(key);
      const syl = normalize(pickSyl(key, lv), key), base = baseOf(syl);
      const extra = (lv >= 3 || mastered(key)) ? [sample(['ن', 'ر', 'ك'])] : [];
      return {
        mode:'choice', skill:'madd:' + key, mtype:key, gentle:true,
        ask:'اختر حرف المد', speak:`${say(base)} . اختر حرف المد`,
        visual:`<div class="mformula" id="mformula"><span class="msyl">${esc(base)}</span><span class="mblank">؟</span></div>`,
        choices: shuffle([...LETTERS, ...extra]), answer: T.maddLetter,
        hint:`انظر إلى الحركة: ${T.harakaWord} 👆`, speakHint:`انظر إلى الحركة. هذه ${T.harakaWord}`,
        okMsg:`⭐ ممتاز! ${syl} — ${T.name} 👏`, sayRight: say(syl),
        reveal:() => { const f = document.getElementById('mformula'); if(f) f.innerHTML = `<span class="msyl pop">${hl(syl, key)}</span>`; }
      };
    },

    /* G1 — اسمع واختر */
    listen(cfg, lv, o){
      const key = pickType(cfg, o), T = byKey(key);
      const syl = normalize(pickSyl(key, lv), key), cons = syl[0];
      return {
        mode:'choice', skill:'madd:' + key, mtype:key, gentle:true, bigChoices:true,
        ask:'اسمع ثم اختر', speak: say(syl),
        visual:`<div class="mformula"><button class="mlisten" data-say="${esc(say(syl))}" aria-label="اسمع">🔊</button></div>`,
        choices: shuffle(MADD_TYPES.map(t => build(cons, t.key))), answer: syl,
        hint:'اضغط 🔊 واسمع مرة أخرى 👂', speakHint: say(syl),
        okMsg:`⭐ ممتاز! هذا ${T.name} 👏`
      };
    },

    /* G3 — ما نوع المد؟ */
    type(cfg, lv, o){
      const key = pickType(cfg, o), T = byKey(key);
      const syl = normalize(pickSyl(key, lv), key);
      return {
        mode:'choice', skill:'madd:' + key, mtype:key, gentle:true, wide:true,
        ask:'ما نوع المد؟', speak:`${say(syl)} . ما نوع المد؟`,
        visual:`<div class="mformula" id="mformula"><span class="msyl big">${esc(syl)}</span></div>`,
        choices: shuffle(MADD_TYPES.map(label)), answer: label(T),
        hint:'انظر إلى الحرف الأخير في المقطع 👀', speakHint:'انظر إلى الحرف الأخير في المقطع',
        okMsg:`لأن ${syl} فيها ${T.harakaWord} وبعدها ${T.letterWord}.`, sayRight: say(syl),
        reveal:() => { const f = document.getElementById('mformula'); if(f) f.innerHTML = `<span class="msyl big pop">${hl(syl, key)}</span>`; }
      };
    },

    /* G5 — كوّن المقطع: بَ ثم ا */
    compose(cfg, lv, o){
      const key = pickType(cfg, o), T = byKey(key);
      const syl = normalize(pickSyl(key, lv), key), base = baseOf(syl);
      const items = [base, T.maddLetter];
      if(lv >= 3) items.push(sample(LETTERS.filter(l => l !== T.maddLetter)));
      return {
        mode:'order', numeric:false, dir:'rtl', skill:'madd:' + key, mtype:key, gentle:true, bigChoices:true,
        ask:'كوّن المقطع', speak:`كوّن المقطع ${say(syl)}`,
        orderHint:'اضغط البطاقتين بالترتيب من اليمين',
        visual:`<div class="mformula"><span class="msyl">${esc(syl)}</span></div>`,
        items: shuffle(items), answer:[base, T.maddLetter],
        hint:`ابدأ بـ ${base} ثم أضف حرف المد`, speakHint:`ابدأ بالحرف المتحرك ثم أضف حرف المد`,
        okMsg:`أحسنت! كوّنت ${syl} ⭐`, sayRight: say(syl)
      };
    },

    /* G6 — صنّف المدود: الصناديق الثلاثة */
    sort(cfg, lv){
      const n = lv >= 3 ? 6 : 4;
      const keys = shuffle([...MADD_TYPES.map(t => t.key), ...MADD_TYPES.map(t => t.key)]).slice(0, n);
      MADD_TYPES.forEach(t => { if(!keys.includes(t.key)) keys[keys.length - 1] = t.key; });   // كل نوع ظاهر مرة على الأقل
      const used = {};
      const cards = shuffle(keys.map(k => {
        const ex = byKey(k).examples.filter(e => !(used[k] || []).includes(e));
        const syl = normalize(sample(ex), k);
        (used[k] = used[k] || []).push(syl);
        return {text:syl, say:say(syl), type:k};
      }));
      return {
        mode:'sort', skill:'madd:sort', gentle:true,
        ask:'ضع كل مقطع في صندوقه', speak:'ضع كل مقطع في الصندوق المناسب',
        orderHint:'اضغط المقطع ثم اضغط الصندوق (أو اسحبه)',
        boxes: MADD_TYPES.map(t => ({key:t.key, label:label(t)})),
        cards,
        hint:'انظر إلى حرف المد في آخر المقطع 👀', speakHint:'انظر إلى حرف المد في آخر المقطع'
      };
    },

    /* G7 — اقرأ المقطع */
    read(cfg, lv, o){
      const key = pickType(cfg, o);
      const syl = normalize(pickSyl(key, lv), key);
      return {
        mode:'read', skill:'madd:' + key, mtype:key, gentle:true,
        ask:'اقرأ المقطع', speak:`اقرأ معي. ${say(syl)}`,
        visual:`<div class="mread"><div class="msyl big">${hl(syl, key)}</div>
                <button class="btn mlisten2" data-say="${esc(say(syl))}">🔊 اسمع</button></div>`,
        hint:'اقرأ معي 🗣️ — هل تستطيع قراءتها؟', yes:'نعم، قرأتها ⭐'
      };
    },

    /* المستوى ٧ — أين المد في الكلمة؟ */
    find(cfg, lv, o){
      const w = pickWord(lv, o), T = byKey(w.type);
      const decoy = baseOf(w.madd);
      const pool = [...new Set([...w.parts, decoy])];
      if(!pool.includes(w.madd)) pool.push(w.madd);
      /* لو الاختيارات أكتر من ٣ نشيل الغلط الزيادة ونحتفظ بالصح */
      const wrong = shuffle(pool.filter(p => p !== w.madd)).slice(0, 2);
      return {
        mode:'choice', skill:'madd_word:' + w.plain, mword:w.plain, mtype:w.type, gentle:true, bigChoices:true,
        ask:'أين المد؟', speak:`${w.w} . أين المد؟`,
        visual:`<div class="stage-items"><span class="item">${w.e}</span></div>
                <div class="mformula" id="mformula"><span class="msyl big">${esc(w.w)}</span>
                <button class="mlisten sm" data-say="${esc(w.w)}" aria-label="اسمع">🔊</button></div>`,
        choices: shuffle([w.madd, ...wrong]), answer: w.madd,
        hint:'ابحث عن المقطع الذي فيه حرف المد 🔎', speakHint:'ابحث عن المقطع الذي فيه حرف المد',
        okMsg:`أحسنت! وجدت ${T.name} ⭐`, sayRight: w.w,
        reveal:() => { const f = document.getElementById('mformula'); if(f) f.innerHTML = `<span class="msyl big pop">${hlWord(w)}</span>`; }
      };
    },

    /* المستوى ٧/٨ — ما نوع المد في الكلمة؟ */
    wordtype(cfg, lv, o){
      const w = pickWord(lv, o), T = byKey(w.type);
      return {
        mode:'choice', skill:'madd_word:' + w.plain, mword:w.plain, mtype:w.type, gentle:true, wide:true,
        ask:'ما نوع المد في الكلمة؟', speak:`${w.w} . ما نوع المد في الكلمة؟`,
        visual:`<div class="stage-items"><span class="item">${w.e}</span></div>
                <div class="mformula"><span class="msyl big">${esc(w.w)}</span>
                <button class="mlisten sm" data-say="${esc(w.w)}" aria-label="اسمع">🔊</button></div>`,
        choices: shuffle(MADD_TYPES.map(label)), answer: label(T),
        hint:'انظر إلى الحرف الذي بعد الحركة 👀', speakHint:'انظر إلى الحرف الذي بعد الحركة',
        okMsg:`ممتاز! هذا ${T.name} 👏`, sayRight: w.w
      };
    },

    /* المستوى ٨ — اقرأ الكلمة */
    wordread(cfg, lv, o){
      const w = pickWord(lv, o), T = byKey(w.type);
      return {
        mode:'read', skill:'madd_word:' + w.plain, mword:w.plain, mtype:w.type, gentle:true,
        ask:'اقرأ الكلمة', speak:`اقرأ معي. ${w.w}`,
        visual:`<div class="mread">${w.pic ? `<div class="stage-items"><span class="item big">${w.e}</span></div>` : ''}
                <div class="msyl big">${hlWord(w)}</div>
                <button class="btn mlisten2" data-say="${esc(w.w)}">🔊 اسمع</button></div>`,
        hint:'اقرأ معي 🗣️ — هل تستطيع قراءتها؟', yes:'نعم، قرأتها ⭐'
      };
    },

    /* المستوى ٨ — من الصورة إلى الكلمة */
    wordpic(cfg, lv, o){
      const pics = MADD_WORDS.filter(x => x.pic);
      const w = (o && o.focus && pics.find(x => x.plain === o.focus)) || sample(pics);
      const wrong = shuffle(pics.filter(x => x.w !== w.w)).slice(0, 2).map(x => x.w);
      return {
        mode:'choice', skill:'madd_word:' + w.plain, mword:w.plain, mtype:w.type, gentle:true, bigChoices:true, wide:true,
        ask:'اختر الكلمة المناسبة للصورة', speak:'اختر الكلمة المناسبة للصورة',
        visual:`<div class="stage-items"><span class="item big">${w.e}</span></div>`,
        choices: shuffle([w.w, ...wrong]), answer: w.w,
        hint:'اقرأ الكلمات ببطء 📖', speakHint:'اقرأ الكلمات ببطء',
        okMsg:`أحسنت! ${w.w} ⭐`, sayRight: w.w
      };
    }
  };

  /* الكلمة كاملة مع تلوين حرف المد */
  function hlWord(w){
    const i = w.w.indexOf(w.madd);
    const mi = i + w.madd.length - 1;          // موضع حرف المد داخل الكلمة
    return esc(w.w.slice(0, mi)) + `<span class="hl t-${w.type}">${esc(w.w[mi])}</span>` + esc(w.w.slice(mi + 1));
  }

  function pickWord(lv, o){
    const pool = MADD_WORDS.filter(w => w.lvl <= (lv >= 4 ? 2 : 1));
    return (o && o.focus && pool.find(w => w.plain === o.focus)) || sample(pool);
  }

  /* ============================================================
     تعريف المراحل الثمانية (= المستويات ١–٨ في المواصفات)
     ============================================================ */
  const ALL = MADD_TYPES.map(t => t.key);
  const STAGES = [
    {id:'madd_alif',     lesson:'alif',     icon:'🟦', name:'المد بالألف',          base:1, color:'#2D9CDB', types:['alif'], kinds:['letter','compose','read']},
    {id:'madd_waw',      lesson:'waw',      icon:'🟩', name:'المد بالواو',          base:1, color:'#2E9E57', types:['waw'],  kinds:['letter','compose','read']},
    {id:'madd_yaa',      lesson:'yaa',      icon:'🟨', name:'المد بالياء',          base:1, color:'#C98A00', types:['yaa'],  kinds:['letter','compose','read']},
    {id:'madd_types',    lesson:'types',    icon:'🔎', name:'ما نوع المد؟',         base:2, color:'#7A5CFF', types:ALL, kinds:['listen','type','sort']},
    {id:'madd_complete', lesson:'complete', icon:'✏️', name:'أكمل المقطع',          base:2, color:'#E05FA8', types:ALL, kinds:['letter','listen','type']},
    {id:'madd_compose',  lesson:'compose',  icon:'🧩', name:'كوّن المقطع',          base:2, color:'#FF7A59', types:ALL, kinds:['compose','sort','read']},
    {id:'madd_find',     lesson:'find',     icon:'🕵️', name:'اكتشف المد في الكلمة', base:3, color:'#1FAE9B', types:ALL, kinds:['find','wordtype']},
    {id:'madd_read',     lesson:'read',     icon:'📖', name:'اقرأ كلمات المدود',    base:3, color:'#4C6FFF', types:ALL, kinds:['wordread','wordpic','wordtype']}
  ];

  /* لكل (مرحلة × نوع لعبة) نسجّل مولّدًا باسم فريد — عشان "تدريب على الأخطاء"
     في المحرك يرجّع نفس قيود المرحلة (مش كل الأنواع) */
  STAGES.forEach(s => {
    s.kinds.forEach(k => { Generators[`${s.id}:${k}`] = (lv, o) => {
      const q = Kinds[k](s, lv, o);
      q.type = `${s.id}:${k}`; q.stageId = s.id;
      return q;
    }; });
  });

  /* المحرك بيدوّر على المولّد باسم المرحلة نفسها (Generators[stageId]) —
     فبنسجّل لكل مرحلة مولّدًا بيخلط أنواع ألعابها */
  STAGES.forEach(s => {
    Generators[s.id] = (lv, o) => Generators[`${s.id}:${sample(s.kinds)}`](lv, o);
  });

  appendStages(WORLD, STAGES.map((s, i) => ({
    id:s.id, icon:s.icon, name:s.name, base:s.base, color:s.color,
    group:'madd', groupName:'⭐ المدود',
    /* أول مرحلة بس بتتفتح بعد ar_table؛ الباقي بيتفتح بالترتيب (unlockNext) */
    ...(i === 0 ? {after:'ar_table'} : {}),
    lesson:s.lesson, types:s.types,
    open:p => open(p),
    onAnswer, onFinish
  })));

  /* شارة "بطل المدود" في نظام الشارات الموجود */
  BADGES.push({id:'madd_champion', icon:'🏆', name:'بطل المدود',
    when:p => stageIds().every(id => (p.best[id] || 0) >= 2)});

  /* ============================================================
     الشاشات: الدرس ← (تدريب صغير لو محتاج) ← اللعب
     ============================================================ */
  const screen = () => document.getElementById('screen');
  const bindSay = root => root.querySelectorAll('[data-say]').forEach(b => b.onclick = () => {
    Audio_.unlock(); Audio_.speak(b.dataset.say);
    b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
  });

  /* نقطة الدخول من خريطة المراحل */
  function open(pack){
    const weak = weakType();
    if(weak) remedial(weak, pack); else lesson(pack);
  }

  function formula(T, big){
    const syl = T.examples[0], base = baseOf(syl);
    return `<div class="mformula ${big ? 'bigf' : ''} t-${T.key}">
      <span class="mpart"><span>${esc(base)}</span></span><span class="mop">+</span>
      <span class="mpart mm"><span>${esc(T.maddLetter)}</span></span><span class="mop">=</span>
      <span class="mpart res"><span>${hl(syl, T.key)}</span></span></div>`;
  }

  function lesson(pack){
    const m = store();
    UI.bar({back:WORLD, title:pack.name});
    let inner = '';

    if(byKey(pack.lesson)){                                    // المراحل ١–٣: درس نوع واحد
      const T = byKey(pack.lesson);
      m.lessons[T.key] = 1; Progress.save();
      inner = `
        <h3 class="mrule t-${T.key}">${T.rule}</h3>
        ${formula(T, true)}
        <button class="btn" data-say="${esc(say(T.result))}">🔊 اسمع</button>
        <div class="order-hint" style="margin-top:14px">اضغط أي مقطع لتسمعه</div>
        <div class="mexamples">
          ${T.examples.map(e => `<button class="mex t-${T.key}" data-say="${esc(say(e))}" aria-label="${esc(e)}">
            <span class="mfrom">${esc(baseOf(e))}</span><span class="marrow">←</span><span class="mto">${hl(e, T.key)}</span></button>`).join('')}
        </div>`;
    }else if(pack.lesson === 'find' || pack.lesson === 'read'){   // المراحل ٧–٨: كلمات
      const sample3 = MADD_TYPES.map(t => MADD_WORDS.find(w => w.type === t.key && w.lvl === 1));
      inner = `
        <h3 class="mrule">${pack.lesson === 'find' ? 'ابحث عن المقطع الممدود داخل الكلمة' : 'اقرأ الكلمات التي فيها مد'}</h3>
        <div class="mexamples">
          ${sample3.map(w => `<button class="mex t-${w.type}" data-say="${esc(w.w)}" aria-label="${esc(w.w)}">
            <span class="mfrom">${w.e}</span><span class="mto">${hlWord(w)}</span></button>`).join('')}
        </div>
        <div class="order-hint" style="margin-top:12px">اضغط أي كلمة لتسمعها</div>`;
    }else{                                                     // المراحل ٤–٦: تذكير بالأنواع الثلاثة
      const intro = {types:'ثلاثة مدود: ألف وواو وياء', complete:'أكمل المقطع بحرف المد المناسب', compose:'رتّب البطاقتين لتكوين المقطع'}[pack.lesson];
      inner = `
        <h3 class="mrule">${intro}</h3>
        ${MADD_TYPES.map(T => `<button class="mrow t-${T.key}" data-say="${esc(say(T.result))}" aria-label="${T.name}">
          <span class="mrowname">${label(T)}</span>${formula(T, false)}</button>`).join('')}`;
    }

    screen().innerHTML = `
      <section class="hero">
        <div class="banner" style="background:${pack.color};box-shadow:0 7px 0 rgba(0,0,0,.2);color:#fff">${pack.icon} ${esc(pack.name)}</div>
      </section>
      <div class="qcard center mlesson">${inner}</div>
      <div class="center"><button class="btn go" id="mPlay">▶️ يلا نلعب</button></div>`;
    bindSay(screen());
    document.getElementById('mPlay').onclick = () => Engine.start(pack.id);
  }

  /* التعلّم المتكيّف: الطفل غلط كتير في نوع → تدريب صغير قبل ما يكمل */
  function remedial(key, pack){
    const T = byKey(key), m = store();
    m.review[key] = 1; Progress.save();
    UI.bar({back:WORLD, title:'تدريب صغير'});
    const heard = new Set();
    const ex = T.examples.slice(0, 4);
    screen().innerHTML = `
      <section class="hero"><div class="banner" style="background:${T.key==='alif'?'#2D9CDB':T.key==='waw'?'#2E9E57':'#C98A00'};box-shadow:0 7px 0 rgba(0,0,0,.2);color:#fff">${T.box} ${esc(T.name)}</div></section>
      <div class="qcard center mlesson">
        <h3 class="mrule">يبدو أنك تحتاج إلى تدريب صغير على ${T.name} 💪</h3>
        <div class="order-hint">اضغط كل بطاقة واسمعها</div>
        <div class="mexamples">
          ${ex.map((e, i) => `<button class="mex big t-${T.key}" data-i="${i}" data-say="${esc(say(e))}" aria-label="${esc(e)}">
            <span class="mfrom">${esc(baseOf(e))}</span><span class="marrow">←</span><span class="mto">${hl(e, T.key)}</span><span class="mtick" aria-hidden="true"></span></button>`).join('')}
        </div>
        <div class="bubble" id="mProg">${ar(0)} / ${ar(ex.length)}</div>
      </div>
      <div class="center"><button class="btn go" id="mCont" disabled>▶️ يلا نكمل</button></div>`;
    Audio_.speak(`تحتاج إلى تدريب صغير على ${T.name}`);
    bindSay(screen());
    screen().querySelectorAll('.mex').forEach(b => {
      const base = b.onclick;
      b.onclick = () => {
        base();
        heard.add(b.dataset.i); b.classList.add('done');
        document.getElementById('mProg').textContent = `${ar(heard.size)} / ${ar(ex.length)}`;
        if(heard.size === ex.length){
          document.getElementById('mCont').disabled = false;
          document.getElementById('mProg').classList.add('ok');
        }
      };
    });
    document.getElementById('mCont').onclick = () => {
      /* نخفّف عداد الأخطاء المتراكمة لهذا النوع بدل ما نمسحه: لسه بنراقبه */
      const s = Adaptive.store();
      Object.keys(s).forEach(k => { if(k.startsWith('madd_') && k.endsWith('|madd:' + key)) s[k] = Math.min(s[k], 1); });
      delete m.review[key];
      Progress.save();
      lesson(pack);
    };
  }

  /* ============================================================
     لوحة ولي الأمر — كارت "المدود"
     ============================================================ */
  function stageState(id){
    const p = Progress.get(), m = store(), best = p.best[id] || 0;
    if(best >= 2) return {icon:'✅', text:'مكتمل', cls:'done'};
    if(best > 0 || m.started[id]) return {icon:'🟡', text:'يتدرب', cls:'doing'};
    return {icon:'🔴', text:'لم يبدأ', cls:'todo'};
  }
  /* حالة مجموعة مراحل: مكتمل لو كلها اكتملت، يتدرب لو أي واحدة بدأت */
  function groupState(ids){
    const st = ids.map(stageState);
    if(st.every(s => s.cls === 'done')) return st[0];
    if(st.some(s => s.cls !== 'todo')) return {icon:'🟡', text:'يتدرب', cls:'doing'};
    return {icon:'🔴', text:'لم يبدأ', cls:'todo'};
  }
  function pct(){
    const p = Progress.get(), ids = stageIds();
    const got = ids.reduce((s, id) => s + Math.min(p.best[id] || 0, 3), 0);
    return ids.length ? Math.round(got / (ids.length * 3) * 100) : 0;
  }

  function dashCard(){
    const m = store();
    const rows = [
      ['المد بالألف',       groupState(['madd_alif'])],
      ['المد بالواو',       groupState(['madd_waw'])],
      ['المد بالياء',       groupState(['madd_yaa'])],
      ['التمييز بين المدود', groupState(['madd_types'])],
      ['المقاطع',           groupState(['madd_complete', 'madd_compose'])],
      ['الكلمات',           groupState(['madd_find', 'madd_read'])]
    ];
    const tot = Object.values(m.types).reduce((a, t) => ({ok:a.ok + t.ok, tries:a.tries + t.tries}), {ok:0, tries:0});
    const level = stageIds().filter(id => Progress.isUnlocked(id)).length;
    const words = MADD_WORDS.filter(w => wordMastered(m.words[w.plain])).map(w => w.w);
    const rev = reviewList().map(k => byKey(k).name);
    const P = pct();
    return `
      <h3 style="margin:18px 0 6px">🟦 المدود</h3>
      <div class="mdcard">
        <div class="mdtop"><span>تقدم الطفل في المدود: <b>${ar(P)}٪</b></span></div>
        <div class="mdbar" role="progressbar" aria-valuenow="${P}" aria-valuemin="0" aria-valuemax="100"><i style="width:${P}%"></i></div>
        <table class="dtable"><tbody>
          ${rows.map(([n, s]) => `<tr><td>${n}</td><td class="mds ${s.cls}">${s.icon} ${s.text}</td></tr>`).join('')}
        </tbody></table>
        <div class="mdnote">المستوى الحالي: ${ar(Math.max(level, 1))} من ${ar(stageIds().length)}
          • إجابات صحيحة من أول محاولة: ${ar(tot.ok)} من ${ar(tot.tries)}</div>
        <div class="mdnote">${rev.length ? '🔁 تحتاج إلى مراجعة: ' + rev.join('، ') : '🔁 لا توجد أنواع تحتاج إلى مراجعة'}</div>
        <div class="mdnote">${words.length ? '📖 كلمات أتقنها: ' + words.join('، ') : '📖 لم يُتقن كلمات بعد'}</div>
      </div>`;
  }

  return {open, dashCard, pct, stageIds, weakType, reviewList, onAnswer, store, Kinds, STAGES};
})();
