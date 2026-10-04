/* ============================================================
   js/games/completeTable.js — لعبة أكمل الجدول (١ إلى ٢٠)
   ============================================================ */
Generators.completeTable = function(lv){
  const MAX = 20;
  const holeCount = [2,3,4,5][Math.min(lv,4)-1];
  const holes = new Set();
  while(holes.size < holeCount) holes.add(rnd(1,MAX));
  const sorted = [...holes].sort((a,b)=>a-b);
  const cells = Array.from({length:MAX},(_,i)=>i+1)
    .map(v => sorted.includes(v) ? '<div class="cell slot"></div>' : `<div class="cell">${ar(v)}</div>`)
    .join('');
  /* الاختيارات: الأرقام الناقصة + مشتّت واحد في المستويات الأعلى */
  const opts = [...sorted];
  if(lv >= 3){
    let d; let guard = 0;
    do{ d = rnd(1,MAX); }while(holes.has(d) && guard++ < 40);
    opts.push(d);
  }
  return {
    type:'completeTable', mode:'grid',
    clips:['complete_table'],
    ask:'أكمل الجدول', speak:'أكمل الجدول، إيه الأرقام الناقصة؟',
    visual:`<div class="grid ar" id="slots">${cells}</div>`,
    items: shuffle(opts),
    answer: sorted,
    hint:'عُدّ من أول الصف لحد الخانة الفاضية 👆',
    speakHint:'عُد من أول الصف لحد الخانة الفاضية'
  };
};
