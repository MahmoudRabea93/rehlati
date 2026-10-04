/* ============================================================
   js/games/descending.js — لعبة ترتيب تنازلي
   ============================================================ */
Generators.descending = function(lv){
  const q = Generators.ascending(lv);
  return {...q, type:'descending', clips:['sort_desc', ...q.items.map(nk)],
    ask:'رتّب من الأكبر للأصغر',
    speak:`رتب الأرقام من الأكبر للأصغر: ${arList(q.items)}`,
    answer:[...q.items].sort((a,b)=>b-a),
    hint:'ابدأ بالرقم الأكبر 🦁',
    speakHint:'دوّر على أكبر رقم فاضل واضغط عليه'};
};
