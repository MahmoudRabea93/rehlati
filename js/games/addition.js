/* ============================================================
   js/games/addition.js — لعبة الجمع
   ============================================================ */
Generators.addition = function(lv, o){
  const L = LEVELS[lv];
  /* التعلّم المتكيّف: لو الطفل بيغلط في مسألة، نرجّع مسائل شبهها */
  const f = o && o.focus ? String(o.focus).split('+').map(Number) : null;
  const a = (f && f[0] >= 1 && f[0] <= L.sumMax-1) ? f[0] : rnd(1, Math.max(1,L.sumMax-1));
  const b = rnd(1, L.sumMax - a);
  const ans = a+b;
  const visual = lv<=3
    ? (()=>{ const it = sample(ITEMS);
        return `<div class="expr">
          <div class="side"><div class="pics">${pics(it.e,a)}</div></div>
          <div class="op">+</div>
          <div class="side"><div class="pics">${pics(it.e,b)}</div></div>
          <div class="op">=</div><div class="num-tile blank">؟</div></div>`; })()
    : `<div class="expr"><div class="num-tile">${ar(a)}</div><div class="op">+</div><div class="num-tile">${ar(b)}</div><div class="op">=</div><div class="num-tile blank">؟</div></div>`;
  return {
    type:'addition', mode:'choice', skill:`add:${a}+${b}`, clips:[nk(a),'plus',nk(b),'equals'],
    ask: lv<=2 ? 'كم العدد كله؟' : `${ar(a)} + ${ar(b)} = ؟`,
    speak:`${arNum(a)} زائد ${arNum(b)} يساوي كام؟`,
    visual, choices:numberChoices(ans, L.choices, 1, L.sumMax+2), answer:ans,
    hint:'عُدّ المجموعتين مع بعض 🤝',
    speakHint:`عُد المجموعتين مع بعض: ${arList(Array.from({length:Math.min(ans,20)},(_,i)=>i+1))}`
  };
};
