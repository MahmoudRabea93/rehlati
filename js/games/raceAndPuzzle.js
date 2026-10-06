/* ============================================================
   js/games/raceAndPuzzle.js — «سباق الأرقام» و«بازل الصورة»
   ------------------------------------------------------------
   اللعبتين بيستخدموا أسئلة حساب عادية، لكن المكافأة بتتغيّر:
     • السباق  → الطفل بيتقدّم خطوة على المسار مع كل إجابة صح
     • البازل  → قطعة من الصورة بتتكشف مع كل إجابة صح
   المتعة هنا في التقدّم المرئي، مش في نوع السؤال — وده بيخلّي
   نفس المحتوى يتلعب مرات كتير من غير ملل.
   ============================================================ */

/* سؤال حساب بسيط مناسب للمستوى — مشترك بين اللعبتين */
function raceQuestion(lv){
  const L = LEVELS[lv];
  if(lv >= 2 && Math.random() < .55){
    const a = rnd(1, Math.min(9, L.max - 1));
    const b = rnd(1, Math.min(9, L.max - a));
    const r = a + b;
    return {ask:`${ar(a)} + ${ar(b)} = ؟`, speak:`${arNum(a)} زائد ${arNum(b)} يساوي كام؟`,
            answer:r, choices:numberChoices(r, L.choices, 1, L.max), skill:'sum:' + r, sayRight:arNum(r)};
  }
  const items = rnd(1, Math.min(L.max, 9));
  const e = sample(['🍎','🐥','🌸','⭐','🍌','🐞','🎈']);
  return {ask:'عُدّ وقول كام؟', speak:'عُدّ الصور وقول كام؟',
          visual:`<div class="stage-items">${(e + ' ').repeat(items).trim().split(' ')
                    .map(x => `<span class="item">${x}</span>`).join('')}</div>`,
          answer:items, choices:numberChoices(items, L.choices, 1, L.max),
          skill:'count:' + items, sayRight:arNum(items)};
}

/* 🐢 سباق الأرقام — اللاعب ضد السلحفاة */
Generators.race = function(lv){
  const q = raceQuestion(lv);
  return Object.assign({
    type:'race', mode:'choice', track:true, bigChoices:true,
    hint:'كل إجابة صح = خطوة للأمام 🏁', speakHint:'كل إجابة صح تقدمك خطوة'
  }, q);
};

/* 🧩 بازل الصورة — صورة بتتكشف قطعة قطعة */
const PUZZLE_PICS = ['🦁','🐘','🦋','🌻','🚀','🐬','🦉','🍉'];

Generators.puzzle = function(lv){
  const q = raceQuestion(lv);
  return Object.assign({
    type:'puzzle', mode:'choice', bigChoices:true,
    /* الصورة ثابتة طول الجولة عشان الطفل يفضل فضولي يشوفها كاملة */
    puzzle: PUZZLE_PICS[new Date().getDate() % PUZZLE_PICS.length],
    hint:'كل إجابة صح بتكشف قطعة من الصورة 🧩', speakHint:'كل إجابة صح بتكشف قطعة من الصورة'
  }, q);
};
