/* ============================================================
   js/games/counting.js — لعبة العد
   ============================================================ */
Generators.counting = function(lv){
  const L = LEVELS[lv], max = Math.min(L.max,10);
  const ii = rnd(0, ITEMS.length-1), it = ITEMS[ii];
  const n = rnd(1,max);
  return {
    type:'counting', mode:'choice', skill:'count:' + n,
    clips:['q'+ii], clipsHint:['count_with_me', ...Array.from({length:n},(_,i)=>nk(i+1))],
    ask: it.q, speak: it.q,
    visual:`<div class="stage-items">${pics(it.e,n)}</div>`,
    choices: numberChoices(n, L.choices, 1, max),
    answer: n,
    hint:'عُدّ معي بإصبعك واحدة واحدة 👆',
    speakHint:`نعد مع بعض: ${arList(Array.from({length:n},(_,i)=>i+1))}`
  };
};
