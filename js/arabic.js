/* ============================================================
   js/arabic.js — عالم اللغة العربية
   كل المولّدات بترجّع نفس شكل السؤال اللي المحرك العام بيفهمه
   ============================================================ */

/* عدد الحروف المتاحة حسب المستوى — الطفل مايتحاصرش بكل الأبجدية من أول يوم */
const arPool = lv => AR_LETTERS.slice(0, [10, 18, 28, 28][Math.min(lv,4)-1]);
const arWords = lv => AR_WORDS.filter(w => w.w.length <= [3, 4, 5, 6][Math.min(lv,4)-1]);

/* اختيارات نصية فريدة حول الإجابة */
function textChoices(answer, pool, count){
  const set = new Set([answer]);
  let guard = 0;
  while(set.size < count && guard++ < 60) set.add(sample(pool));
  return shuffle([...set]);
}

const ArabicGames = {

  /* ١ — اختر الحرف: الصورة والكلمة ظاهرين والحرف ناقص */
  ar_pick(lv, o){
    const pool = arPool(lv);
    const it = (o && o.focus && pool.find(x => x.l === o.focus)) || sample(pool);
    return {
      type:'ar_pick', mode:'choice', skill:'ar_letter:' + it.l,
      ask:'اختار الحرف الصحيح',
      speak:`${it.w}. اختار الحرف اللي بتبدأ بيه`,
      visual:`<div class="stage-items"><span class="item">${it.e}</span></div>
              <div class="lword">؟ مثل ${it.w}</div>`,
      choices: textChoices(it.l, pool.map(x => x.l), lv >= 3 ? 4 : 3),
      answer: it.l,
      hint:`${it.w} بتبدأ بحرف ${it.l} 👆`,
      speakHint:`${it.w} بتبدأ بحرف ${it.l}`
    };
  },

  /* ٢ — طابق الحرف بالصورة */
  ar_match(lv, o){
    const pool = arPool(lv);
    const it = (o && o.focus && pool.find(x => x.l === o.focus)) || sample(pool);
    return {
      type:'ar_match', mode:'choice', skill:'ar_letter:' + it.l,
      ask:`أنهي صورة تبدأ بحرف ${it.l} ؟`,
      speak:`أنهي صورة بتبدأ بحرف ${it.l}؟`,
      visual:`<div class="bigletter">${it.l}</div>`,
      choices: textChoices(it.e, pool.map(x => x.e), lv >= 3 ? 4 : 3),
      answer: it.e,
      hint:`${it.l} مثل ${it.w} ${it.e}`,
      speakHint:`${it.l} مثل ${it.w}`
    };
  },

  /* ٣ — كوّن الكلمة: ترتيب الحروف */
  ar_build(lv, o){
    const pool = arWords(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    const letters = it.w.split('');
    return {
      type:'ar_build', mode:'order', numeric:false, dir:'rtl', skill:'ar_word:' + it.w,
      ask:'كوّن الكلمة', speak:`كوّن كلمة ${it.w}`,
      orderHint:'اضغط الحروف بالترتيب من اليمين',
      visual:`<div class="stage-items"><span class="item">${it.e}</span></div>
              <div class="wordline big">${it.w}</div>`,
      items: shuffle([...letters]),
      answer: letters,
      hint:`الكلمة هي ${it.w} — ابدأ بأول حرف 👆`,
      speakHint:`الكلمة هي ${it.w}`
    };
  },

  /* ٤ — كوّن الكلمة من حروفها: ك ـ ت ـ ب ← كتب */
  ar_compose(lv, o){
    const pool = arWords(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    return {
      type:'ar_compose', mode:'choice', skill:'ar_word:' + it.w,
      ask:'الحروف دي بتكوّن أنهي كلمة؟',
      speak:`${it.w.split('').join(' ')} . الحروف دي بتكوّن أنهي كلمة؟`,
      visual:`<div class="letterline">${it.w.split('').map(c=>`<span class="lchip">${c}</span>`).join('<span class="plus">+</span>')}</div>`,
      choices: textChoices(it.w, AR_WORDS.map(x => x.w), 3),
      answer: it.w, wide:true,
      hint:`اقرا الحروف ورا بعض: ${it.w.split('').join(' ')}`,
      speakHint:`اقرا الحروف ورا بعض: ${it.w.split('').join(' ')}`
    };
  },

  /* ٥ — حلّل الكلمة: الكلمة ظاهرة والطفل يطلّع حروفها بالترتيب */
  ar_analyze(lv, o){
    const pool = arWords(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    const letters = it.w.split('');
    const items = [...letters];
    /* في المستويات الأعلى نحط حرف دخيل عشان الطفل ياخد باله */
    if(lv >= 3){
      const extra = AR_LETTERS.map(x => x.l).filter(l => !letters.includes(l));
      items.push(sample(extra));
    }
    return {
      type:'ar_analyze', mode:'order', numeric:false, dir:'rtl', skill:'ar_word:' + it.w,
      orderHint:'اضغط الحروف بالترتيب من اليمين',
      ask:'حلّل الكلمة لحروفها',
      speak:`حلّل كلمة ${it.w} لحروفها بالترتيب`,
      visual:`<div class="wordline big">${it.w}</div>`,
      items: shuffle(items),
      answer: letters,
      hint:`اقرا الكلمة بالراحة: ${it.w.split('').join(' - ')}`,
      speakHint:`${it.w}. اقرا حروفها بالترتيب`
    };
  },

  /* ٦ — وصل الكلمة بحروفها */
  ar_connect(lv, o){
    const pool = arWords(lv);
    const n = lv >= 3 ? 4 : 3;
    let picks = shuffle([...pool]).slice(0, n);
    const want = o && o.focus && pool.find(x => x.w === o.focus);
    if(want && !picks.some(p => p.w === want.w)) picks = shuffle([want, ...picks.slice(0, n-1)]);
    const spell = w => w.split('').join(' ـ ');
    const map = {};
    picks.forEach(p => map[p.w] = spell(p.w));
    return {
      type:'ar_connect', mode:'pairs', skill:'ar_word:' + picks[0].w,
      ask:'وصّل الكلمة بحروفها', speak:'وصّل كل كلمة بحروفها',
      items: shuffle(picks.map(p => p.w)),
      right: shuffle(picks.map(p => spell(p.w))),
      map, wide:true,
      skillOf: v => 'ar_word:' + v,
      hint:'اضغط الكلمة الأول، وبعدين حروفها',
      speakHint:'اضغط الكلمة الأول، وبعدين دوّر على حروفها'
    };
  },

  /* ٧ — أكمل جدول الحروف */
  ar_table(lv, o){
    const L = AR_LETTERS.map(x => x.l);
    const holeCount = [2,3,4,5][Math.min(lv,4)-1];
    const holes = new Set();
    while(holes.size < holeCount) holes.add(L[rnd(0, L.length-1)]);
    const sorted = [...holes].sort((a,b) => L.indexOf(a) - L.indexOf(b));
    const cells = L.map(v => sorted.includes(v)
      ? '<div class="cell slot"></div>'
      : `<div class="cell">${v}</div>`).join('');
    const opts = [...sorted];
    if(lv >= 3){
      let d, guard = 0;
      do{ d = L[rnd(0, L.length-1)]; }while(holes.has(d) && guard++ < 40);
      opts.push(d);
    }
    return {
      type:'ar_table', mode:'grid', numeric:false, skill:'ar_alphabet',
      ask:'أكمل جدول الحروف',
      speak:'أكمل جدول الحروف. إيه الحروف الناقصة؟',
      visual:`<div class="grid letters ar" id="slots">${cells}</div>`,
      items: shuffle(opts), answer: sorted,
      hint:'قول الحروف من الألف لحد الخانة الفاضية',
      speakHint:'قول الحروف من الألف لحد الخانة الفاضية'
    };
  },

  /* ٨ — أكمل الكلمة: حرف ناقص */
  ar_complete(lv, o){
    const pool = arWords(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    const letters = it.w.split('');
    const hole = rnd(0, letters.length - 1);
    const miss = letters[hole];
    const shown = letters.map((c,i) => i === hole
      ? '<span class="wslot big">؟</span>'
      : `<span class="wletter">${c}</span>`).join('');
    return {
      type:'ar_complete', mode:'choice', skill:'ar_word:' + it.w,
      ask:'أكمل الكلمة', speak:`أكمل كلمة ${it.w}. إيه الحرف الناقص؟`,
      visual:`<div class="stage-items"><span class="item">${it.e}</span></div>
              <div class="wordline">${shown}</div>`,
      choices: textChoices(miss, AR_LETTERS.map(x => x.l), lv >= 3 ? 4 : 3),
      answer: miss,
      hint:`الكلمة هي ${it.w}`,
      speakHint:`الكلمة هي ${it.w}`
    };
  },

  /* ٥ — اختار الكلمة الصحيحة: من الصورة للكلمة */
  ar_choose_word(lv, o){
    const pool = arWords(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    return {
      type:'ar_choose_word', mode:'choice', skill:'ar_word:' + it.w,
      ask:'اختار الكلمة الصحيحة', speak:'اختار الكلمة الصحيحة',
      visual:`<div class="stage-items"><span class="item big">${it.e}</span></div>`,
      choices: textChoices(it.w, AR_WORDS.map(x => x.w), 3),
      answer: it.w, wide:true,
      hint:'اقرا الكلمات بالراحة وشوف أنهي واحدة تناسب الصورة',
      speakHint:'اقرا الكلمات بالراحة'
    };
  },

  /* ٦ — طابق الكلمة بالصورة: من الكلمة للصورة */
  ar_match_word(lv, o){
    const pool = arWords(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    return {
      type:'ar_match_word', mode:'choice', skill:'ar_word:' + it.w,
      ask:'أنهي صورة للكلمة دي؟', speak:`${it.w}. أنهي صورة للكلمة دي؟`,
      visual:`<div class="wordline big">${it.w}</div>`,
      choices: textChoices(it.e, AR_WORDS.map(x => x.e), 3),
      answer: it.e,
      hint:`اقرا الكلمة حرف حرف: ${it.w.split('').join(' - ')}`,
      speakHint:`اقرا الكلمة بالراحة: ${it.w}`
    };
  }
};

Object.assign(Generators, ArabicGames);

registerStages('arabic', [
  {id:'ar_learn',       icon:'🔤', name:'تعرّف على الحروف', base:1, color:'#FF9F1C',
   learn:true, lang:'ar', items:AR_LETTERS},
  {id:'ar_pick',        icon:'🎯', name:'اختر الحرف',       base:1, color:'#FFB443', gen:(l,o)=>ArabicGames.ar_pick(l,o)},
  {id:'ar_match',       icon:'🖼️', name:'الحرف والصورة',    base:1, color:'#FF8A5C', gen:(l,o)=>ArabicGames.ar_match(l,o)},
  {id:'ar_table',       icon:'🔡', name:'أكمل جدول الحروف', base:2, color:'#FF9A4D', gen:(l,o)=>ArabicGames.ar_table(l,o)},
  {id:'ar_build',       icon:'🧩', name:'كوّن الكلمة',       base:2, color:'#E8745C', gen:(l,o)=>ArabicGames.ar_build(l,o)},
  {id:'ar_compose',     icon:'➕', name:'الحروف والكلمة',   base:2, color:'#E8825C', gen:(l,o)=>ArabicGames.ar_compose(l,o)},
  {id:'ar_analyze',     icon:'🔍', name:'حلّل الكلمة',      base:3, color:'#DB6F3E', gen:(l,o)=>ArabicGames.ar_analyze(l,o)},
  {id:'ar_connect',     icon:'🪢', name:'وصّل الكلمة بحروفها', base:3, color:'#D4652F', gen:(l,o)=>ArabicGames.ar_connect(l,o)},
  {id:'ar_complete',    icon:'✏️', name:'أكمل الكلمة',      base:2, color:'#D98324', gen:(l,o)=>ArabicGames.ar_complete(l,o)},
  {id:'ar_choose_word', icon:'📖', name:'اختر الكلمة',      base:3, color:'#C96A1F', gen:(l,o)=>ArabicGames.ar_choose_word(l,o)},
  {id:'ar_match_word',  icon:'🔗', name:'الكلمة والصورة',   base:3, color:'#B8571A', gen:(l,o)=>ArabicGames.ar_match_word(l,o)}
]);
