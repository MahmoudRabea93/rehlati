/* ============================================================
   js/games/chooseNumber.js — لعبة اختر الرقم
   ============================================================ */
Generators.chooseNumber = function(lv){
  const L = LEVELS[lv], max = Math.min(L.max,10);
  const ii = rnd(0, ITEMS.length-1), it = ITEMS[ii];
  const n = rnd(1,max);
  return {
    type:'chooseNumber', mode:'choice',
    clips:['q'+ii,'pick_number'], clipsHint:['count_with_me', ...Array.from({length:n},(_,i)=>nk(i+1))],
    ask:'اختار الرقم الصحيح', speak:`${it.q} اختار الرقم الصحيح`,
    visual:`<div class="stage-items">${pics(it.e,n)}</div>`,
    choices: numberChoices(n, L.choices, 1, Math.max(max,n+2)),
    answer: n,
    hint:'عُدّ الصور ثم دوّر على نفس الرقم 🔍',
    speakHint:`نعد مع بعض: ${arList(Array.from({length:n},(_,i)=>i+1))}`
  };
};
