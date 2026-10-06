/* ============================================================
   js/games/listenNum.js — لعبة «اسمع واختار»
   ------------------------------------------------------------
   الرقم بيتنطق بس — مش مكتوب في السؤال — والطفل يختاره من
   الاختيارات. بتدرّب مهارة مختلفة تمامًا عن باقي الألعاب:
   السمع والربط بين صوت الرقم وشكله.
   زرار 🔊 جنب السؤال بيعيد النطق أي عدد مرات.
   ============================================================ */
Generators.listenNum = function(lv){
  const L = LEVELS[lv];
  const n = rnd(1, L.max);
  return {
    type:'listenNum', mode:'choice', skill:'listen:' + n, bigChoices:true,
    /* السؤال مكتوب من غير الرقم — المعلومة في الصوت بس */
    ask:'اسمع الرقم كويس… واختاره 👂',
    speak:arNum(n), clips:[nk(n)],
    visual:`<div class="listenbox"><button class="earbtn" data-say="${arNum(n)}" aria-label="اسمع الرقم">👂</button>
            <div class="order-hint">اضغط الودن عشان تسمع تاني</div></div>`,
    choices: numberChoices(n, L.choices, 1, L.max),
    answer: n,
    hint:'اضغط 🔊 واسمع تاني بالراحة',
    speakHint:'اسمع تاني بالراحة',
    sayRight:arNum(n)
  };
};
