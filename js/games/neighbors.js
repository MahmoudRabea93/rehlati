/* ============================================================
   js/games/neighbors.js — لعبة «السابق والتالي»
   ------------------------------------------------------------
   الرقم في النص، والطفل يحط السابق على اليمين والتالي على الشمال.
   بيستخدم وضع الترتيب (order) الموجود في المحرك: الطفل يضغط
   السابق الأول ثم التالي، والمحرك بيتحقق مع كل ضغطة.
   ============================================================ */
Generators.neighbors = function(lv){
  const L = LEVELS[lv];
  const n = rnd(2, L.max - 1);               // لازم يكون ليه سابق وتالي جوه المدى
  const prev = n - 1, next = n + 1;

  /* الاختيارات: الإجابتان + مشتتات قريبة (الرقم نفسه مشتت ممتاز) */
  const set = new Set([prev, next]);
  const extra = L.choices >= 4 ? 3 : 2;
  [n, n - 2, n + 2, n - 3, n + 3].forEach(c => {
    if(set.size < 2 + extra && c >= 1 && c <= L.max && c !== prev && c !== next) set.add(c);
  });

  const cell = (cap, inner) => `<div class="ncell"><span class="ncap">${cap}</span>${inner}</div>`;

  return {
    type:'neighbors', mode:'order', dir:'rtl',
    clips:['before', nk(n), 'after'],
    ask:'مين السابق ومين التالي؟',
    speak:`الرقم ${arNum(n)}. مين الرقم اللي قبله ومين الرقم اللي بعده؟`,
    orderHint:'اضغط السابق الأول (يمين) وبعدين التالي (شمال)',
    visual:`<div class="expr rtl nbrs">
      ${cell('السابق', '<div class="num-tile blank">؟</div>')}
      <div class="op">←</div>
      ${cell('الرقم',  `<div class="num-tile mid">${ar(n)}</div>`)}
      <div class="op">←</div>
      ${cell('التالي', '<div class="num-tile blank">؟</div>')}
    </div>`,
    items: shuffle([...set]),
    answer:[prev, next],
    hint:`السابق أقل بواحد 👈 والتالي أكبر بواحد 👉`,
    speakHint:`السابق أقل بواحد، والتالي أكبر بواحد`,
    okMsg:`⭐ أحسنت! ${ar(prev)} ثم ${ar(n)} ثم ${ar(next)}`,
    sayRight:`${arNum(prev)} ، ${arNum(n)} ، ${arNum(next)}`
  };
};
