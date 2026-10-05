/* ============================================================
   data/madd.js — بيانات قسم المدود (عالم اللغة العربية)
   ------------------------------------------------------------
   المحتوى التعليمي هنا فقط. المنطق والواجهة في js/madd.js.
   لإضافة مثال أو كلمة: ضيفها في المصفوفة المناسبة — مفيش تعديل في الكود.

   قاعدة التشكيل: المقطع = حرف + حركة + حرف المد (المد دايمًا آخر حرف)
   فمثلاً 'بَا' = ب + فتحة + ا  → القاعدة الأساسية بتتحسب من النص نفسه.
   ============================================================ */
const MADD_TYPES = [
  {
    id: 'madd-alif', key: 'alif', type: 'alif',
    name: 'المد بالألف', box: '🟦',
    baseLetter: 'بَ', maddLetter: 'ا', result: 'بَا',
    harakaName: 'الفتحة', harakaWord: 'فتحة', harakaMark: '\u064E',
    letterName: 'الألف', letterWord: 'ألف',
    rule: 'الفتحة + الألف = مد بالألف',
    examples: ['بَا', 'مَا', 'سَا', 'دَا', 'لَا']
  },
  {
    id: 'madd-waw', key: 'waw', type: 'waw',
    name: 'المد بالواو', box: '🟩',
    baseLetter: 'بُ', maddLetter: 'و', result: 'بُو',
    harakaName: 'الضمة', harakaWord: 'ضمة', harakaMark: '\u064F',
    letterName: 'الواو', letterWord: 'واو',
    rule: 'الضمة + الواو = مد بالواو',
    examples: ['بُو', 'مُو', 'سُو', 'تُو', 'نُو']
  },
  {
    id: 'madd-yaa', key: 'yaa', type: 'yaa',
    name: 'المد بالياء', box: '🟨',
    baseLetter: 'بِ', maddLetter: 'ي', result: 'بِي',
    harakaName: 'الكسرة', harakaWord: 'كسرة', harakaMark: '\u0650',
    letterName: 'الياء', letterWord: 'ياء',
    rule: 'الكسرة + الياء = مد بالياء',
    examples: ['بِي', 'مِي', 'سِي', 'لِي', 'فِي']
  }
];

/* كلمات فيها مد — من الأسهل للأصعب (lvl 1 ثم 2).
   w: الكلمة مشكولة | plain: بدون تشكيل (مفتاح الإتقان)
   madd: المقطع الممدود | parts: مقاطع الكلمة بالترتيب من اليمين
   pic:false = الصورة مش واضحة بما يكفي لمطابقتها بالكلمة */
const MADD_WORDS = [
  /* مد بالألف */
  {plain:'باب',  w:'بَاب',  type:'alif', madd:'بَا', parts:['بَا','ب'],        e:'🚪', pic:true,  lvl:1},
  {plain:'دار',  w:'دَار',  type:'alif', madd:'دَا', parts:['دَا','ر'],        e:'🏠', pic:true,  lvl:1},
  {plain:'نار',  w:'نَار',  type:'alif', madd:'نَا', parts:['نَا','ر'],        e:'🔥', pic:true,  lvl:1},
  {plain:'قال',  w:'قَال',  type:'alif', madd:'قَا', parts:['قَا','ل'],        e:'🗣️', pic:false, lvl:1},
  {plain:'مال',  w:'مَال',  type:'alif', madd:'مَا', parts:['مَا','ل'],        e:'💰', pic:false, lvl:1},
  /* مد بالواو */
  {plain:'نور',  w:'نُور',  type:'waw',  madd:'نُو', parts:['نُو','ر'],        e:'💡', pic:true,  lvl:1},
  {plain:'حوت',  w:'حُوت',  type:'waw',  madd:'حُو', parts:['حُو','ت'],        e:'🐋', pic:true,  lvl:1},
  {plain:'سوق',  w:'سُوق',  type:'waw',  madd:'سُو', parts:['سُو','ق'],        e:'🛒', pic:true,  lvl:1},
  {plain:'فول',  w:'فُول',  type:'waw',  madd:'فُو', parts:['فُو','ل'],        e:'🍲', pic:false, lvl:1},
  /* مد بالياء */
  {plain:'فيل',  w:'فِيل',  type:'yaa',  madd:'فِي', parts:['فِي','ل'],        e:'🐘', pic:true,  lvl:1},
  {plain:'دين',  w:'دِين',  type:'yaa',  madd:'دِي', parts:['دِي','ن'],        e:'🕌', pic:true,  lvl:1},
  {plain:'كبير', w:'كَبِير', type:'yaa',  madd:'بِي', parts:['كَ','بِي','ر'],  e:'🏔️', pic:false, lvl:2},
  {plain:'جميل', w:'جَمِيل', type:'yaa',  madd:'مِي', parts:['جَ','مِي','ل'],  e:'🌸', pic:false, lvl:2}
];

/* النطق: لو المقطع محتاج نطق مختلف عن شكله المكتوب، حطه هنا.
   الافتراضي: يُنطق المقطع كما هو مكتوب. */
const MADD_SAY = {};
