/* ============================================================
   js/games/more.js — خمس ألعاب إضافية في عالم الألعاب
     🔁 اتبع النمط   🔤 صيد الحروف   🔺 الأشكال والألوان
     📏 رتّب بالحجم   🕐 كام الساعة
   ============================================================ */

/* ---------- 🔁 اتبع النمط ---------- */
const PATTERN_SETS = [
  ['🔴','🔵'], ['⭐','🌙'], ['🍎','🍌'], ['🐱','🐶'],
  ['🔺','🟦'], ['☀️','☁️'], ['🎈','🎁']
];

Generators.pattern = function(lv){
  /* المستوى بيحدّد طول الوحدة المتكرّرة: AB ثم AAB ثم ABC */
  const set = sample(PATTERN_SETS);
  let unit;
  if(lv <= 1)       unit = [set[0], set[1]];
  else if(lv === 2) unit = [set[0], set[0], set[1]];
  else {
    const third = sample(PATTERN_SETS.filter(s => s !== set))[0];
    unit = lv === 3 ? [set[0], set[1], third] : [set[0], set[1], set[1], third];
  }

  /* نكرّر الوحدة لحد ما نوصل طول مناسب، وآخر عنصر هو المطلوب */
  const seq = [];
  while(seq.length < unit.length * 2 + 1) seq.push(unit[seq.length % unit.length]);
  const answer = seq.pop();

  const wrong = shuffle([...new Set(PATTERN_SETS.flat())].filter(c => c !== answer)).slice(0, 2);

  return {
    type:'pattern', mode:'choice', skill:'pattern:' + unit.length, numeric:false, bigChoices:true,
    ask:'إيه اللي بعده؟',
    speak:'بُص على الترتيب وقول إيه اللي بعده',
    visual:`<div class="patrow">
              ${seq.map(c => `<span class="pat">${c}</span>`).join('')}
              <span class="pat q">؟</span>
            </div>`,
    choices: shuffle([answer, ...wrong]),
    answer,
    hint:'النمط بيتكرر — عُدّ من الأول 👀',
    speakHint:'النمط بيتكرر، عُدّ من الأول',
    okMsg:'⭐ النمط مظبوط!'
  };
};

/* ---------- 🔤 صيد الحروف ---------- */
/* نفس محرك البالونات بالظبط، بس بحروف عربي بدل أرقام */
const HUNT_LETTERS = 'ا ب ت ث ج ح خ د ر س ش ص ط ع ف ق ك ل م ن ه و ي'.split(' ');

Generators.letterHunt = function(lv){
  const n = lv >= 3 ? 6 : 4;
  const pool = shuffle(HUNT_LETTERS.slice()).slice(0, n);
  const target = sample(pool);
  const colors = shuffle(BALLOON_COLORS.slice());

  return {
    type:'letterHunt', mode:'balloon', skill:'letter:' + target, numeric:false,
    ask:`فرقع البالونة اللي عليها حرف ${target}`,
    speak:`فرقع البالونة اللي عليها حرف ${target}`,
    balloons: pool.map((v, i) => ({
      v,
      color: colors[i % colors.length],
      left:  Math.round(4 + i * (92 / pool.length) + rnd(0, 4)),
      dur:   (5 + Math.random() * 3).toFixed(1),
      delay: (Math.random() * 8).toFixed(1),
      sway:  (2.2 + Math.random() * 1.6).toFixed(1)
    })),
    answer: target,
    hint:'البالونات بتتحرك — خد وقتك 🎈',
    speakHint:'خد وقتك واختار الحرف الصح',
    sayRight: target
  };
};

/* ---------- 🔺 الأشكال والألوان ---------- */
const SHAPES = [
  {k:'circle',   name:'الدائرة'},
  {k:'square',   name:'المربع'},
  {k:'triangle', name:'المثلث'},
  {k:'star',     name:'النجمة'},
  {k:'heart',    name:'القلب'}
];
const SHAPE_COLORS = [
  {k:'red',    name:'الأحمر',  c:'#FF6B6B'},
  {k:'blue',   name:'الأزرق',  c:'#4C9BFF'},
  {k:'green',  name:'الأخضر',  c:'#4CC9A7'},
  {k:'yellow', name:'الأصفر',  c:'#FFC43D'}
];
const shapeTag = o =>
  `<span class="shp s-${o.s.k}" style="--sc:${o.c.c}" aria-label="${o.s.name} ${o.c.name}"></span>`;

Generators.shapes = function(lv){
  const n = lv >= 3 ? 6 : 4;
  /* في المستويات الأولى الشكل وحده هو الفرق، وبعدين اللون كمان */
  const byColor = lv >= 2;

  const opts = [];
  let guard = 0;
  while(opts.length < n && guard++ < 200){
    const o = {s:sample(SHAPES), c:sample(SHAPE_COLORS)};
    const key = byColor ? o.s.k + '|' + o.c.k : o.s.k;
    if(!opts.some(x => (byColor ? x.s.k + '|' + x.c.k : x.s.k) === key)) opts.push(o);
  }
  const pick_ = sample(opts);
  const key = byColor ? pick_.s.k + '|' + pick_.c.k : pick_.s.k;
  const label = byColor ? `${pick_.s.name} ${pick_.c.name}` : pick_.s.name;

  return {
    type:'shapes', mode:'choice', skill:'shape:' + key, numeric:false, wide:true,
    ask:`اضغط ${label}`,
    speak:`اضغط ${label}`,
    choicesHtml: true,
    choices: shuffle(opts.map(o => byColor ? o.s.k + '|' + o.c.k : o.s.k)),
    render: v => {
      const [sk, ck] = v.split('|');
      const o = {s:SHAPES.find(s => s.k === sk), c:SHAPE_COLORS.find(c => c.k === ck) || SHAPE_COLORS[0]};
      /* في المستوى الأول كل الأشكال بلون واحد عشان التركيز على الشكل */
      return shapeTag(byColor ? o : {s:o.s, c:{c:'#7A5CFF'}});
    },
    answer: key,
    hint:'بُص على الشكل كويس 👀',
    speakHint:'بص على الشكل كويس',
    sayRight: label
  };
};

/* ---------- 📏 رتّب بالحجم ---------- */
const SIZE_PICS = ['🐘','🎈','🍎','⭐','🐟','🌳','🚗','🐻'];

Generators.sizeOrder = function(lv){
  const pic = sample(SIZE_PICS);
  const n = lv >= 3 ? 4 : 3;
  const sizes = [1, 1.55, 2.15, 2.8].slice(0, n);
  const up = lv % 2 === 0 || lv === 1;            // تصاعدي أو تنازلي

  const order = up ? sizes.slice() : sizes.slice().reverse();
  return {
    type:'sizeOrder', mode:'order', numeric:false, skill:'size:' + n,
    ask: up ? 'رتّب من الأصغر للأكبر' : 'رتّب من الأكبر للأصغر',
    speak: up ? 'رتب الصور من الأصغر للأكبر' : 'رتب الصور من الأكبر للأصغر',
    orderHint:'اضغط الصور بالترتيب',
    items: shuffle(sizes.map(String)),
    answer: order.map(String),
    /* الصورة بتتعرض بحجمها الحقيقي جوه الزرار */
    itemHtml: v => `<span class="szpic" style="font-size:${v}em">${pic}</span>`,
    hint:'قارن الأحجام الأول 👀',
    speakHint:'قارن الأحجام الأول',
    okMsg:'⭐ ترتيب مظبوط!'
  };
};

/* ---------- 🕐 كام الساعة ---------- */
function clockFace(h, m){
  const ha = (h % 12) * 30 + m * .5, ma = m * 6;
  const hand = (a, len, w, col) => {
    const r = (a - 90) * Math.PI / 180;
    return `<line x1="50" y1="50" x2="${(50 + len * Math.cos(r)).toFixed(1)}"
             y2="${(50 + len * Math.sin(r)).toFixed(1)}" stroke="${col}"
             stroke-width="${w}" stroke-linecap="round"/>`;
  };
  const ticks = Array.from({length:12}, (_, i) => {
    const r = (i * 30 - 90) * Math.PI / 180;
    return `<text x="${(50 + 38 * Math.cos(r)).toFixed(1)}" y="${(50 + 38 * Math.sin(r) + 4).toFixed(1)}"
             text-anchor="middle" font-size="9" font-weight="700" fill="#4A5568">${ar(i === 0 ? 12 : i)}</text>`;
  }).join('');
  return `<svg class="clock" viewBox="0 0 100 100" role="img" aria-label="ساعة">
      <circle cx="50" cy="50" r="47" fill="#fff" stroke="#7A5CFF" stroke-width="4"/>
      ${ticks}
      ${hand(ha, 24, 5, '#2D3748')}
      ${hand(ma, 34, 3, '#7A5CFF')}
      <circle cx="50" cy="50" r="3.5" fill="#2D3748"/>
    </svg>`;
}
const clockWord = (h, m) => m === 0 ? `${ar(h)} تمام` : `${ar(h)} والنص`;

Generators.clock = function(lv){
  const h = rnd(1, 12);
  const m = lv >= 3 && Math.random() < .5 ? 30 : 0;   // النص بيظهر من المستوى التالت
  const ans = clockWord(h, m);

  const set = new Set([ans]);
  let guard = 0;
  while(set.size < Math.min(lv >= 3 ? 4 : 3, 6) && guard++ < 60){
    set.add(clockWord(rnd(1, 12), lv >= 3 && Math.random() < .5 ? 30 : 0));
  }

  return {
    type:'clock', mode:'choice', skill:'clock:' + h + ':' + m, numeric:false, wide:true,
    ask:'كام الساعة؟', speak:'كام الساعة؟',
    visual:`<div class="clockwrap">${clockFace(h, m)}</div>`,
    choices: shuffle([...set]),
    answer: ans,
    hint:'العقرب القصير = الساعة، والطويل = الدقايق ⏰',
    speakHint:'العقرب القصير يقول الساعة',
    sayRight: ans
  };
};
