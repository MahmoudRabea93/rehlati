/* ============================================================
   js/games/emptyTable.js — لعبة «الجدول الفاضي»
   ------------------------------------------------------------
   الجدول كله فاضي، والطفل يملاه بالترتيب من ١ لحد ٢٠
   (من ١ لـ ١٠ في المستويات الأولى) باختيار الأرقام من البنك.
   بيستخدم وضع grid الموجود: المحرك بيتحقق مع كل ضغطة،
   فلو ضغط رقم مش دوره يسمع تلميح لطيف ويعيد.
   ============================================================ */
Generators.emptyTable = function(lv){
  const MAX = lv <= 2 ? 10 : 20;
  const nums = Array.from({length:MAX}, (_, i) => i + 1);
  const cells = nums.map(() => '<div class="cell slot"></div>').join('');
  return {
    type:'emptyTable', mode:'grid',
    clips:['complete_table'],
    ask:'املأ الجدول بالترتيب',
    speak:`املأ الجدول من واحد لحد ${arNum(MAX)}`,
    orderHint:`اضغط الأرقام بالترتيب: واحد، اتنين، تلاتة… لحد ${ar(MAX)}`,
    visual:`<div class="grid ar" id="slots">${cells}</div>`,
    items: shuffle([...nums]),
    answer: nums,
    hint:'ابدأ من ١ وكمّل بالترتيب 👆',
    speakHint:'ابدأ من واحد وكمّل بالترتيب'
  };
};
