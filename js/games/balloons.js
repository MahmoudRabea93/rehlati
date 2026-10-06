/* ============================================================
   js/games/balloons.js — لعبة «فرقع البالونة»
   ------------------------------------------------------------
   بالونات بتطفو لفوق وتنزل تاني في حركة مستمرة، والطفل يفرقع
   الصح. مفيش عدّاد وقت ولا فشل — الحركة هي المتعة، والضغط
   النفسي مش مناسب لسن ٤–٦. الإجابة بتتحقق بنفس آلية
   أسئلة الاختيار العادية.
   ============================================================ */
const BALLOON_COLORS = ['#FF6B6B','#FFC43D','#4CC9A7','#4C9BFF','#C06BE8','#FF9F45','#2FC9B4'];

Generators.balloons = function(lv){
  const L = LEVELS[lv];
  const n = Math.min(L.choices + 1, 6);          // ٤–٦ بالونات

  /* في المستويات الأعلى السؤال بيبقى عملية جمع بسيطة بدل رقم مجرّد */
  const asSum = lv >= 3 && Math.random() < .5;
  let target, ask, speak, skill;

  if(asSum){
    const a = rnd(1, Math.min(9, L.max - 1));
    const b = rnd(1, Math.min(9, L.max - a));
    target = a + b;
    ask = `فرقع البالونة اللي عليها ${ar(a)} + ${ar(b)}`;
    speak = `فرقع البالونة اللي عليها ${arNum(a)} زائد ${arNum(b)}`;
    skill = 'sum:' + target;
  }else{
    target = rnd(1, L.max);
    ask = `فرقع البالونة رقم ${ar(target)}`;
    speak = `فرقع البالونة رقم ${arNum(target)}`;
    skill = 'num:' + target;
  }

  const vals = numberChoices(target, n, 1, L.max);
  const colors = shuffle(BALLOON_COLORS.slice());

  return {
    type:'balloons', mode:'balloon', skill,
    ask, speak,
    /* لكل بالونة لون ومكان وسرعة مختلفة عشان الحركة تبقى طبيعية */
    balloons: vals.map((v, i) => ({
      v,
      color: colors[i % colors.length],
      left:  Math.round(4 + i * (92 / vals.length) + rnd(0, 4)),
      dur:   (5 + Math.random() * 3).toFixed(1),
      /* تأخير سالب بطول المسار كله: البالونات تبقى موزّعة من أول لحظة
         بدل ما تكون كلها مستنية تحت السما */
      delay: (Math.random() * 8).toFixed(1),
      sway:  (2.2 + Math.random() * 1.6).toFixed(1)
    })),
    answer: target,
    hint:'البالونات بتتحرك — استنى وركّز 🎈',
    speakHint:'ركز كويس واختار البالونة الصح'
  };
};
