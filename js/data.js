/* ============================================================
   js/data.js — البيانات الثابتة والمستويات
   ============================================================ */
/* الأرقام تُعرض بالصيغة العربية الهندية ٠١٢٣٤٥٦٧٨٩ — القيم الداخلية تفضل أرقام عادية */
const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const ar = v => String(v).replace(/[0-9]/g, d => AR_DIGITS[+d]);

const ITEMS = [
  {e:'🍎', q:'كم تفاحة؟'},   {e:'🍌', q:'كم موزة؟'},
  {e:'🍓', q:'كم فراولة؟'},  {e:'🎈', q:'كم بالونة؟'},
  {e:'🐥', q:'كم كتكوت؟'},   {e:'🐟', q:'كم سمكة؟'},
  {e:'🍪', q:'كم بسكويتة؟'}, {e:'🌸', q:'كم وردة؟'},
  {e:'🚗', q:'كم سيارة؟'},   {e:'⭐', q:'كم نجمة؟'}
];

/* حدود كل مستوى — لا يُولَّد أي سؤال خارجها */
const LEVELS = {
  1:{max:5,  sumMax:5,  steps:[1],       choices:3},
  2:{max:10, sumMax:10, steps:[1],       choices:3},
  3:{max:20, sumMax:10, steps:[1],       choices:4},
  /* العد بالاثنين يبدأ في المستوى الرابع بس، وبنسبة قليلة —
     طفل ٤–٦ سنين لسه بيثبّت العد بواحد */
  4:{max:20, sumMax:20, steps:[1,1,1,2], choices:4}
};

const PALETTE = ['#FF6B6B','#7A5CFF','#2FC9B4','#FF9F1C','#4CB8FF','#1FAE9B','#E05FA8','#5FBF5F','#FFC43D','#6C7BFF','#FF7A59','#1FA9D6','#C06BE8'];

const STAGES = [
  {id:'counting',       icon:'🔢', name:'العد',            base:1},
  {id:'chooseNumber',   icon:'🎯', name:'اختر الرقم',      base:1},
  {id:'nextNumber',     icon:'➡️', name:'العدد التالي',    base:1},
  {id:'previousNumber', icon:'⬅️', name:'العدد السابق',    base:1},
  {id:'neighbors',      icon:'↔️', name:'السابق والتالي',  base:2},
  {id:'sequence',       icon:'🔗', name:'أكمل التسلسل',    base:2},
  {id:'completeTable',  icon:'🧮', name:'أكمل الجدول',     base:2},
  {id:'emptyTable',     icon:'🗒️', name:'الجدول الفاضي',   base:2, count:3},
  {id:'ascending',      icon:'📈', name:'ترتيب تصاعدي',    base:2},
  {id:'descending',     icon:'📉', name:'ترتيب تنازلي',    base:3},
  {id:'comparison',     icon:'⚖️', name:'أكبر وأصغر',      base:2},
  {id:'addition',       icon:'➕', name:'الجمع',           base:3},
  {id:'subtraction',    icon:'➖', name:'الطرح',           base:3}
].map((s,i)=>({...s, n:i+1, color:PALETTE[i]}));

const PRAISE  = ['ممتاز! 🎉','أحسنت! 🌟','رائع يا بطل! 👏','شاطر جدًا! 🦁'];
/* جُمل التشجيع المنطوقة ومفاتيح مقاطعها المسجّلة */
const PRAISE_SAY = [['ممتاز يا بطل','praise1'],['أحسنت','praise2'],['شاطر جدًا','praise3'],['برافو عليك','praise4']];
const SIGN_CLIP  = {'>':'gt','<':'lt','=':'eq'};
/* مفتاح مقطع الرقم — المسجّل عندنا من ٠ لـ ٢٠ فقط */
const nk = n => (Number.isInteger(n) && n>=0 && n<=20) ? 'n'+n : null;
const RETRY   = ['حاول مرة أخرى ❤️','قريب جدًا، جرّب تاني 💪','مش مشكلة، فكّر شوية 🙂'];
const QUESTIONS_PER_ROUND = 10;
const PRACTICE_COUNT = 5;

/* --- مساعدات عامة --- */
const rnd    = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const sample = a => a[rnd(0,a.length-1)];
const shuffle= a => { for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]];} return a; };
const pics   = (emoji,n,goneFrom) => {
  let out='';
  for(let i=0;i<n;i++) out += `<span class="item${goneFrom!==undefined && i>=goneFrom?' gone':''}">${emoji}</span>`;
  return out;
};
/* اختيارات رقمية فريدة حول الإجابة وداخل حدود المستوى */
function numberChoices(answer, count, min, max){
  const set = new Set([answer]);
  let guard = 0;
  while(set.size < count && guard++ < 80){
    const delta = sample([-3,-2,-1,1,2,3]);
    const c = answer + delta;
    if(c>=min && c<=max) set.add(c);
  }
  let v = min;
  while(set.size < count && v<=max){ set.add(v++); }
  return shuffle([...set]);
}

/* كل لعبة تسجّل مولّدها هنا (js/games/*.js) */
const Generators = {};
