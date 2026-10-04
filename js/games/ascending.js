/* ============================================================
   js/games/ascending.js — لعبة ترتيب تصاعدي
   ============================================================ */
Generators.ascending = function(lv){
  const L = LEVELS[lv];
  const set = new Set();
  while(set.size<4) set.add(rnd(1,L.max));
  const nums = shuffle([...set]);
  return {
    type:'ascending', mode:'order', dir:'rtl', orderHint:'اضغط الأرقام بالترتيب من اليمين', clips:['sort_asc', ...nums.map(nk)],
    ask:'رتّب من الأصغر للأكبر',
    speak:`رتب الأرقام من الأصغر للأكبر: ${arList(nums)}`,
    items:nums, answer:[...nums].sort((a,b)=>a-b),
    hint:'ابدأ بالرقم الأصغر 🐣',
    speakHint:'دوّر على أصغر رقم فاضل واضغط عليه'
  };
};
