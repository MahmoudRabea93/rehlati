/* ============================================================
   js/english.js — English World
   نفس شكل السؤال العام، بس النطق بصوت إنجليزي (Audio_.speakEn)
   ============================================================ */
const enPool = lv => EN_LETTERS.slice(0, [10, 18, 26, 26][Math.min(lv,4)-1]);

const EnglishGames = {

  /* Choose the letter — picture + word, letter missing */
  en_pick(lv, o){
    const pool = enPool(lv);
    const it = (o && o.focus && pool.find(x => x.l === o.focus)) || sample(pool);
    return {
      type:'en_pick', mode:'choice', lang:'en', skill:'en_letter:' + it.l,
      ask:'Which letter?', speak:`${it.w}. Which letter does it start with?`,
      visual:`<div class="stage-items"><span class="item">${it.e}</span></div>
              <div class="lword ltr">? is for ${it.w}</div>`,
      choices: textChoices(it.l, pool.map(x => x.l), lv >= 3 ? 4 : 3),
      answer: it.l, ltr:true,
      hint:`${it.w} starts with ${it.l}`,
      speakHint:`${it.w} starts with ${it.l}`
    };
  },

  /* Match letter with picture */
  en_match(lv, o){
    const pool = enPool(lv);
    const it = (o && o.focus && pool.find(x => x.l === o.focus)) || sample(pool);
    return {
      type:'en_match', mode:'choice', lang:'en', skill:'en_letter:' + it.l,
      ask:`Which picture starts with ${it.l} ?`,
      speak:`Which picture starts with the letter ${it.l}?`,
      visual:`<div class="bigletter ltr">${it.l}</div>`,
      choices: textChoices(it.e, pool.map(x => x.e), lv >= 3 ? 4 : 3),
      answer: it.e,
      hint:`${it.l} is for ${it.w} ${it.e}`,
      speakHint:`${it.l} is for ${it.w}`
    };
  },

  /* Complete the word — one missing letter */
  en_complete(lv, o){
    const pool = enPool(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    const w = it.w.replace(/\s/g,'');
    const letters = w.split('');
    const hole = rnd(0, letters.length - 1);
    const miss = letters[hole].toUpperCase();
    const shown = letters.map((c,i) => i === hole
      ? '<span class="wslot big">?</span>'
      : `<span class="wletter">${c}</span>`).join('');
    return {
      type:'en_complete', mode:'choice', lang:'en', skill:'en_word:' + it.w,
      ask:'Complete the word', speak:`Complete the word ${it.w}`,
      visual:`<div class="stage-items"><span class="item">${it.e}</span></div>
              <div class="wordline ltr">${shown}</div>`,
      choices: textChoices(miss, EN_LETTERS.map(x => x.l), lv >= 3 ? 4 : 3),
      answer: miss, ltr:true,
      hint:`The word is ${it.w}`,
      speakHint:`The word is ${it.w}`
    };
  },

  /* Choose the correct word */
  en_word(lv, o){
    const pool = enPool(lv);
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    return {
      type:'en_word', mode:'choice', lang:'en', skill:'en_word:' + it.w,
      ask:'Choose the correct word', speak:'Choose the correct word',
      visual:`<div class="stage-items"><span class="item big">${it.e}</span></div>`,
      choices: textChoices(it.w, EN_LETTERS.map(x => x.w), 3),
      answer: it.w, wide:true, ltr:true,
      hint:'Look at the picture and read each word',
      speakHint:'Look at the picture and read each word'
    };
  },

  /* Big & small — الكابيتل والسمول في الاتجاهين */
  en_case(lv, o){
    const pool = enPool(lv);
    const it = (o && o.focus && pool.find(x => x.l === o.focus)) || sample(pool);
    const toSmall = Math.random() < .5;          /* الاتجاه بيتبدّل عشوائيًا */
    const shown  = toSmall ? it.l : it.l.toLowerCase();
    const answer = toSmall ? it.l.toLowerCase() : it.l;
    const others = pool.filter(x => x.l !== it.l)
                       .map(x => toSmall ? x.l.toLowerCase() : x.l);
    return {
      type:'en_case', mode:'choice', lang:'en', skill:'en_case:' + it.l,
      ask: toSmall ? 'Find the small letter' : 'Find the BIG letter',
      speak: toSmall ? `Which one is the small ${it.l}?` : `Which one is the big ${it.l}?`,
      visual:`<div class="bigletter ltr">${shown}</div>`,
      choices: shuffle([answer, ...shuffle(others).slice(0, lv >= 3 ? 3 : 2)]),
      answer, ltr:true,
      hint: toSmall ? `Big ${it.l} and small ${it.l.toLowerCase()} are the same letter`
                    : `Small ${it.l.toLowerCase()} and big ${it.l} are the same letter`,
      speakHint:`${it.l} and ${it.l.toLowerCase()} are the same letter`
    };
  },

  /* Match big with small — توصيل عمودين */
  en_pairs(lv, o){
    const pool = enPool(lv);
    const count = lv >= 3 ? 5 : 4;
    let picks = shuffle([...pool]).slice(0, count);
    /* لو فيه حرف الطفل بيلخبط فيه، نحطه في المجموعة */
    const want = o && o.focus && pool.find(x => x.l === o.focus);
    if(want && !picks.some(p => p.l === want.l)) picks = shuffle([want, ...picks.slice(0, count-1)]);
    const map = {};
    picks.forEach(p => map[p.l] = p.l.toLowerCase());
    return {
      type:'en_pairs', mode:'pairs', lang:'en', skill:'en_case:' + picks[0].l,
      ask:'Match big and small', speak:'Match each big letter with its small letter',
      items: shuffle(picks.map(p => p.l)),
      right: shuffle(picks.map(p => p.l.toLowerCase())),
      map, ltr:true,
      skillOf: v => 'en_case:' + String(v).toUpperCase(),
      hint:'Tap a big letter, then its small one',
      speakHint:'Tap a big letter, then tap its small letter'
    };
  },

  /* Circle the letter — ضع دائرة حول كل حرف مشابه (كابيتل وسمول) */
  en_circle(lv, o){
    const pool = enPool(lv);
    const it = (o && o.focus && pool.find(x => x.l === o.focus)) || sample(pool);
    const hits  = [3, 3, 4, 4][Math.min(lv,4)-1];
    const total = [12, 15, 18, 20][Math.min(lv,4)-1];
    const others = pool.filter(x => x.l !== it.l);
    const cells = [];
    /* الحرف المطلوب بالحالتين — الطفل لازم يشوف A و a على إنهم نفس الحرف */
    for(let i = 0; i < hits; i++)
      cells.push({ch: Math.random() < .5 ? it.l : it.l.toLowerCase(), hit:true});
    while(cells.length < total){
      const d = sample(others);
      cells.push({ch: Math.random() < .5 ? d.l : d.l.toLowerCase(), hit:false});
    }
    return {
      type:'en_circle', mode:'find', lang:'en', skill:'en_case:' + it.l,
      ask:`Circle every ${it.l}${it.l.toLowerCase()}`,
      speak:`Find every letter ${it.l}. Big ${it.l} and small ${it.l.toLowerCase()}.`,
      visual:`<div class="bigletter ltr">${it.l} ${it.l.toLowerCase()}</div>`,
      cells: shuffle(cells), hits, ltr:true,
      hint:`Big ${it.l} and small ${it.l.toLowerCase()} are both the same letter`,
      speakHint:`Big ${it.l} and small ${it.l.toLowerCase()} are the same letter`
    };
  },

  /* Find the friends — لعبة ذاكرة: كل حرف صاحبه هو نفسه بالحالة التانية */
  en_friends(lv, o){
    const pool = enPool(lv);
    const n = [3, 4, 4, 5][Math.min(lv,4)-1];
    let picks = shuffle([...pool]).slice(0, n);
    const want = o && o.focus && pool.find(x => x.l === o.focus);
    if(want && !picks.some(p => p.l === want.l)) picks = shuffle([want, ...picks.slice(0, n-1)]);
    const cards = shuffle(picks.flatMap(p => [
      {k:p.l, ch:p.l}, {k:p.l, ch:p.l.toLowerCase()}
    ]));
    return {
      type:'en_friends', mode:'memory', lang:'en', skill:'en_case:' + picks[0].l,
      ask:'Find the friends', speak:'Find the friends. Every big letter has a small friend.',
      cards, pairs: picks.length, ltr:true,
      skillOf: v => 'en_case:' + String(v).toUpperCase(),
      hint:'Flip two cards. A and a are friends!',
      speakHint:'Big A and small a are friends'
    };
  },

  /* Complete the alphabet — جدول الحروف الناقصة */
  en_table(lv, o){
    const L = EN_LETTERS.map(x => x.l);
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
      type:'en_table', mode:'grid', numeric:false, lang:'en', skill:'en_alphabet',
      ask:'Complete the alphabet', speak:'Complete the alphabet. Which letters are missing?',
      visual:`<div class="grid letters" id="slots">${cells}</div>`,
      items: shuffle(opts), answer: sorted, ltr:true,
      hint:'Say the alphabet from A until you reach the empty box',
      speakHint:'Say the alphabet from A until you reach the empty box'
    };
  }
};

/* مولّد عام لأي قائمة مفردات: صورة ← الكلمة */
function vocabGame(type, list, skillTag){
  return function(lv, o){
    const n = [6, 8, 10, list.length][Math.min(lv,4)-1];
    const pool = list.slice(0, Math.min(n, list.length));
    const it = (o && o.focus && pool.find(x => x.w === o.focus)) || sample(pool);
    return {
      type, mode:'choice', lang:'en', skill:skillTag + ':' + it.w,
      ask:'What is this?', speak:'What is this?',
      visual:`<div class="stage-items"><span class="item big">${it.e}</span></div>`,
      choices: textChoices(it.w, pool.map(x => x.w), 3),
      answer: it.w, wide:true, ltr:true,
      hint:`It is ${it.w}`,
      speakHint:`It is ${it.w}`
    };
  };
}

EnglishGames.en_numbers = vocabGame('en_numbers', EN_NUMBERS, 'en_num');
EnglishGames.en_colors  = vocabGame('en_colors',  EN_COLORS,  'en_color');
EnglishGames.en_animals = vocabGame('en_animals', EN_ANIMALS, 'en_animal');
EnglishGames.en_daily   = vocabGame('en_daily',   EN_DAILY,   'en_daily');

Object.assign(Generators, EnglishGames);

registerStages('english', [
  {id:'en_learn',    icon:'🔤', name:'Learn letters',  base:1, color:'#4CB8FF',
   learn:true, lang:'en', items:EN_LETTERS},
  {id:'en_pick',     icon:'🎯', name:'Choose letter',  base:1, color:'#5FA8F5', gen:(l,o)=>EnglishGames.en_pick(l,o)},
  {id:'en_match',    icon:'🖼️', name:'Letter & picture', base:1, color:'#6C8FF0', gen:(l,o)=>EnglishGames.en_match(l,o)},
  {id:'en_case',     icon:'🔠', name:'Big & small',    base:1, color:'#66A6F2', gen:(l,o)=>EnglishGames.en_case(l,o)},
  {id:'en_circle',   icon:'⭕', name:'Circle the letter', base:1, color:'#5FA0EF', gen:(l,o)=>EnglishGames.en_circle(l,o)},
  {id:'en_pairs',    icon:'🔗', name:'Match big & small', base:2, color:'#6E96EE', gen:(l,o)=>EnglishGames.en_pairs(l,o)},
  {id:'en_friends',  icon:'🤝', name:'Find the friends', base:2, color:'#6B90F0', gen:(l,o)=>EnglishGames.en_friends(l,o)},
  {id:'en_table',    icon:'🔤', name:'Complete alphabet', base:2, color:'#7389EA', gen:(l,o)=>EnglishGames.en_table(l,o)},
  {id:'en_complete', icon:'✏️', name:'Complete word',  base:2, color:'#7A7CE8', gen:(l,o)=>EnglishGames.en_complete(l,o)},
  {id:'en_word',     icon:'📖', name:'Choose word',    base:2, color:'#4C9BE0', gen:(l,o)=>EnglishGames.en_word(l,o)},
  {id:'en_numbers',  icon:'🔢', name:'Numbers',        base:2, color:'#3F8FD6', gen:(l,o)=>EnglishGames.en_numbers(l,o)},
  {id:'en_colors',   icon:'🎨', name:'Colors',         base:2, color:'#3583CC', gen:(l,o)=>EnglishGames.en_colors(l,o)},
  {id:'en_animals',  icon:'🐘', name:'Animals',        base:3, color:'#2B77BF', gen:(l,o)=>EnglishGames.en_animals(l,o)},
  {id:'en_daily',    icon:'💬', name:'Everyday words', base:3, color:'#216BB2', gen:(l,o)=>EnglishGames.en_daily(l,o)}
]);
