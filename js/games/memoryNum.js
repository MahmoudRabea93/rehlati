/* ============================================================
   js/games/memoryNum.js — لعبة الذاكرة «الرقم وصاحبه»
   ------------------------------------------------------------
   كروت مقلوبة: كل رقم له صاحب = نفس العدد على شكل دواير.
   بتدرّب الذاكرة البصرية وربط الرقم بالكمية في نفس الوقت.
   بتستخدم وضع memory الموجود في المحرك.
   ============================================================ */
Generators.memoryNum = function(lv){
  const pairs = lv >= 3 ? 5 : 4;                 // ٨ أو ١٠ كروت
  const max   = lv >= 3 ? 6 : 5;   /* أكتر من ٦ دواير تبقى صعبة العدّ على الكارت */
  const nums  = shuffle(Array.from({length:max}, (_, i) => i + 1)).slice(0, pairs);

  const cards = [];
  nums.forEach(n => {
    cards.push({k:'n' + n, ch:ar(n), say:arNum(n)});
    /* الدواير في شبكة مرتّبة — أسهل في العدّ من صف نقط ملزوق */
    cards.push({
      k:'n' + n, ch:String(n), say:arNum(n),
      html:`<span class="dots d${n}">${'<i></i>'.repeat(n)}</span>`
    });
  });

  return {
    type:'memoryNum', mode:'memory', lang:'ar', skill:'memory',
    skillOf:k => 'num:' + k.slice(1),
    pairs,
    ask:'لاقي الرقم وصاحبه',
    speak:'اقلب كارتين ولاقي الرقم مع العدد اللي يساويه',
    hint:'الرقم بيساوي عدد الدواير 🔵',
    speakHint:'الرقم بيساوي عدد الدواير',
    cards: shuffle(cards)
  };
};
