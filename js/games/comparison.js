/* ============================================================
   js/games/comparison.js — لعبة أكبر / أصغر / يساوي
   ============================================================ */
Generators.comparison = function(lv){
  const L = LEVELS[lv];
  const a = rnd(1,L.max);
  let b = Math.random()<.25 ? a : rnd(1,L.max);
  const ans = a>b ? '>' : (a<b ? '<' : '=');
  const visual = lv<=2
    ? (()=> { const it = sample(ITEMS);
        return `<div class="expr">
          <div class="side"><div class="pics">${pics(it.e,a)}</div><div class="num-tile">${ar(a)}</div></div>
          <div class="num-tile blank">؟</div>
          <div class="side"><div class="pics">${pics(it.e,b)}</div><div class="num-tile">${ar(b)}</div></div>
        </div>`; })()
    : `<div class="expr"><div class="num-tile">${ar(a)}</div><div class="num-tile blank">؟</div><div class="num-tile">${ar(b)}</div></div>`;
  return {
    type:'comparison', mode:'choice', skill:`cmp:${a}${ans}${b}`, clips:[nk(a),'and',nk(b),'pick_sign'],
    ask:'اختار العلامة الصحيحة',
    speak:`${arNum(a)} ... و ... ${arNum(b)}. اختار العلامة الصحيحة: أكبر من، أصغر من، ولا يساوي؟`,
    visual, choices:['>','<','='], answer:ans, big:true,
    hint:'الفم المفتوح يتجه ناحية الرقم الأكبر 🐊',
    speakHint:`بُقّ التمساح بيفتح ناحية الرقم الكبير. ${arNum(a)} و ${arNum(b)}`
  };
};
