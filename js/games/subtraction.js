/* ============================================================
   js/games/subtraction.js — لعبة الطرح
   ============================================================ */
Generators.subtraction = function(lv, o){
  const L = LEVELS[lv];
  const f = o && o.focus ? String(o.focus).split('-').map(Number) : null;
  const a = (f && f[0] >= 2 && f[0] <= L.sumMax) ? f[0] : rnd(2, L.sumMax);
  const b = rnd(1, a-1);
  const ans = a-b;
  const it = sample(ITEMS);
  const visual = lv<=3
    ? `<div class="stage-items">${pics(it.e,a,a-b)}</div>
       <div class="expr"><div class="num-tile">${ar(a)}</div><div class="op">−</div><div class="num-tile">${ar(b)}</div><div class="op">=</div><div class="num-tile blank">؟</div></div>`
    : `<div class="expr"><div class="num-tile">${ar(a)}</div><div class="op">−</div><div class="num-tile">${ar(b)}</div><div class="op">=</div><div class="num-tile blank">؟</div></div>`;
  return {
    type:'subtraction', mode:'choice', skill:`sub:${a}-${b}`, clips:[nk(a),'minus',nk(b),'equals'],
    ask: lv<=3 ? `كم ${it.e} باقي؟` : `${ar(a)} − ${ar(b)} = ؟`,
    speak:`${arNum(a)} ناقص ${arNum(b)} يساوي كام؟`,
    visual, choices:numberChoices(ans, L.choices, 0, L.sumMax), answer:ans,
    hint:'عُدّ اللي فاضل من غير المشطوب ✖',
    speakHint:`عُد اللي فاضل بس، من غير المشطوب. ${arNum(a)} شيلنا منهم ${arNum(b)}`
  };
};
