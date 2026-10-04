/* ============================================================
   js/games/nextNumber.js — لعبة العدد التالي
   ============================================================ */
Generators.nextNumber = function(lv){
  const L = LEVELS[lv], n = rnd(1, L.max-1), a = n+1;
  return {
    type:'nextNumber', mode:'choice', clips:['after', nk(n)],
    ask:'ما العدد التالي؟', speak:`إيه الرقم اللي بعد ${arNum(n)}؟`,
    visual:`<div class="expr rtl"><div class="num-tile">${ar(n)}</div><div class="op">←</div><div class="num-tile blank">؟</div></div>`,
    choices: numberChoices(a, L.choices, 1, L.max),
    answer: a,
    hint:`بعد ${ar(n)} بواحد 👉`,
    speakHint:`عُد من الأول: ${arList([Math.max(1,n-2),Math.max(1,n-1),n].filter((v,i,ar)=>ar.indexOf(v)===i))} وبعدين؟`
  };
};
