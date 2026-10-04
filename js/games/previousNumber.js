/* ============================================================
   js/games/previousNumber.js — لعبة العدد السابق
   ============================================================ */
Generators.previousNumber = function(lv){
  const L = LEVELS[lv], n = rnd(2, L.max), a = n-1;
  return {
    type:'previousNumber', mode:'choice', clips:['before', nk(n)],
    ask:'ما العدد السابق؟', speak:`إيه الرقم اللي قبل ${arNum(n)}؟`,
    visual:`<div class="expr rtl"><div class="num-tile blank">؟</div><div class="op">←</div><div class="num-tile">${ar(n)}</div></div>`,
    choices: numberChoices(a, L.choices, 1, L.max),
    answer: a,
    hint:`قبل ${ar(n)} بواحد 👈`,
    speakHint:`الرقم اللي قبل ${arNum(n)} بواحد`
  };
};
