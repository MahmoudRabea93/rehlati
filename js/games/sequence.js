/* ============================================================
   js/games/sequence.js — لعبة أكمل التسلسل
   ============================================================ */
Generators.sequence = function(lv){
  const L = LEVELS[lv], step = sample(L.steps);
  const len = 5, start = step===1 ? rnd(1, Math.max(1,L.max-4)) : step;
  const seq = Array.from({length:len},(_,i)=>start + i*step);
  const hole = rnd(1, len-2);
  const a = seq[hole];
  const html = seq.map((v,i)=> i===hole
    ? `<div class="num-tile blank">؟</div>`
    : `<div class="num-tile">${ar(v)}</div>`).join('<div class="op sep">•</div>');
  return {
    type:'sequence', mode:'choice', skill:'seq:' + step,
    clips:['sequence', ...seq.map((v,i)=> i===hole ? 'howmuch' : nk(v))],
    ask:'أكمل التسلسل',
    speak:`أكمل التسلسل: ${seq.map((v,i)=> i===hole ? 'كام' : arNum(v)).join('، ')}`,
    visual:`<div class="expr rtl">${html}</div>`,
    choices: numberChoices(a, L.choices, 1, Math.max(a+5, L.max)),
    answer: a,
    hint: step===1 ? 'عُدّ بالترتيب: اللي بعد الرقم ده بواحد 👆'
                   : `بنقفز ${ar(step)} في كل مرة 👆`,
    speakHint: step===1 ? 'بنزود واحد في كل مرة' : `بنزود ${arNum(step)} في كل مرة`
  };
};
