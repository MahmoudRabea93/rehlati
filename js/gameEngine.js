/* ============================================================
   js/gameEngine.js — إدارة الجولة والأسئلة والنجوم
   ============================================================ */
const Engine = (() => {
  let stage, level, list, idx, correct, tries, mistakes, practice, picked, t0, sel, matched, mem, streak;

  function makeQuestion(type, lv, opt){ return Generators[type](Math.min(lv,4), opt); }
  /* مفتاح المقطع المناسب لاختيار الطفل (رقم أو علامة مقارنة) */
  const valueClip = v => typeof v === 'number' ? nk(v) : SIGN_CLIP[v];
  const packOf = () => stage;
  /* إجابة صح من أول محاولة: نجمة محسوبة على عالم المرحلة + إحصائية فورية */
  function award(){ Progress.addStar(1, stage.world); Progress.addAnswer(true); UI.bumpStars(); hook(true); }
  /* أول غلطة في السؤال بس — عشان السؤال الواحد ما يتحسبش غلط أكتر من مرة */
  function penalize(){ Progress.addAnswer(false); hook(false); }
  /* مراحل ليها إحصائيات خاصة (زي المدود) بتسجّل نتيجة كل سؤال مرة واحدة */
  function hook(ok){ if(stage && stage.onAnswer){ try{ stage.onAnswer(current(), ok); }catch(e){} } }

  function start(stageId, opts={}){
    stage    = PACKS[stageId];
    practice = !!opts.practice;
    t0       = Date.now();
    level    = Math.max(stage.base, 1);
    const childLv = Progress.level(stage.world);
    level = Math.min(Math.max(stage.base, Math.min(childLv, stage.base+1)), 4);

    /* مراحل طويلة (زي الجدول الفاضي) ممكن تحدّد عدد أسئلتها بنفسها */
    const count = practice ? PRACTICE_COUNT : (stage.count || QUESTIONS_PER_ROUND);
    list = [];
    if(practice && opts.types && opts.types.length){
      for(let i=0;i<count;i++) list.push(makeQuestion(sample(opts.types), level));
    }else{
      const focus = Adaptive.focus(stage.id);
      for(let i=0;i<count;i++){
        /* تدرّج لطيف داخل الجولة: آخر سؤالين أصعب قليلًا */
        const lv = i >= count-2 ? Math.min(level+1,4) : level;
        /* تعلّم متكيّف: لو فيه مهارة الطفل بيغلط فيها، نرجّعها له */
        const opt = (focus && Math.random() < .45) ? {focus} : null;
        list.push(makeQuestion(stage.id, lv, opt));
      }
    }
    idx = 0; correct = 0; mistakes = []; picked = []; streak = 0;
    UI.gameScreen();
    render();
  }

  function current(){ return list[idx]; }
  function state(){ return {stage, level, idx, correct, total:list.length, mistakes, practice, picked}; }

  function render(){
    tries = 0; picked = []; sel = null; matched = []; mem = {first:null, found:0, lock:false};
    const q = current();
    UI.renderQuestion(q, state());
    if(q.lang === 'en') Audio_.speakEn(q.speak);
    else Audio_.speak(idx===0 ? [`${stage.name}. يلا بينا!`, q.speak] : q.speak, q.clips);
  }
  /* زرار 🔊 يعيد نطق السؤال */
  function repeat(){ const q = current(); q.lang === 'en' ? Audio_.speakEn(q.speak) : Audio_.speak(q.speak, q.clips); }

  function answer(value, btn){
    const q = current();
    const said = typeof value === 'number' ? arNum(value) : (SIGN_WORD[value] || value);
    if(q.answer === value){
      correct += tries===0 ? 1 : 0;
      streak = tries===0 ? streak + 1 : 0;
      if(tries===0){ Adaptive.hit(stage.id, q.skill); award(); }
      UI.correct(btn, tries===0, streak);
      if(q.okMsg) UI.setBubble(q.okMsg, 'ok');
      if(q.reveal) q.reveal();
      streak >= 3 && tries===0 ? Audio_.combo(streak) : Audio_.good();
      const pr = sample(PRAISE_SAY);
      if(q.lang === 'en') Audio_.speakEn([String(value), 'Very good!']);
      else if(q.sayRight) Audio_.speak([q.sayRight, pr[0]]);
      else Audio_.speak([said, pr[0]], [valueClip(value), pr[1]]);
      setTimeout(next, 1400);
    }else{
      tries++; streak = 0;
      if(tries===1){ if(!mistakes.includes(q.type)) mistakes.push(q.type); Adaptive.miss(stage.id, q.skill); penalize(); }
      UI.wrong(btn, q, tries);
      Audio_.bad();
      if(q.lang === 'en') Audio_.speakEn([String(value), 'Try again', q.speakHint || '']);
      else Audio_.speak([said, 'حاول مرة تانية', q.speakHint || q.hint],
                   [valueClip(value), 'retry'].concat(q.clipsHint || []));
    }
  }

  /* ترتيب: تحقّق فوري عند كل ضغطة */
  function pick(value, btn){
    const q = current();
    const expected = q.answer[picked.length];
    if(value === expected){
      picked.push(value);
      UI.fillSlot(picked.length-1, value, btn);
      Audio_.good();
      if(picked.length === q.answer.length){
        correct += tries===0 ? 1 : 0;
        streak = tries===0 ? streak + 1 : 0;
        if(tries===0){ Adaptive.hit(stage.id, q.skill); award(); }
        UI.correct(null, tries===0, streak);
        if(q.okMsg) UI.setBubble(q.okMsg, 'ok');
        const pr = sample(PRAISE_SAY);
        if(q.sayRight) Audio_.speak([q.sayRight, pr[0]]);
        else Audio_.speak([arNum(value), pr[0]], [nk(value), pr[1]]);
        setTimeout(next, 1400);
      }else{
        Audio_.speak(arNum(value), [nk(value)]);
      }
    }else{
      tries++;
      if(tries===1){ if(!mistakes.includes(q.type)) mistakes.push(q.type); penalize(); }
      UI.wrong(btn, q, tries);
      Audio_.bad();
      Audio_.speak([arNum(value), 'حاول مرة تانية', q.speakHint || q.hint], [nk(value), 'retry']);
    }
  }

  /* وضع التوصيل: اختار من العمود الأول ثم ما يقابله في التاني */
  function pairPick(value, side, btn){
    const q = current();
    if(side === 'a'){
      if(sel && sel.btn) sel.btn.classList.remove('sel');
      sel = {value, btn};
      btn.classList.add('sel');
      Audio_.speakEn(value);
      return;
    }
    if(!sel){ UI.setBubble('اضغط حرف كابيتل الأول 👆'); Audio_.bad(); return; }
    /* المهارة بتتسجّل على الحرف اللي الطفل اشتغل عليه فعلاً، مش على المجموعة كلها */
    const sk = q.skillOf ? q.skillOf(sel.value) : q.skill;
    if(q.map[sel.value] === value){
      [sel.btn, btn].forEach(b => { b.classList.remove('sel'); b.classList.add('matched'); b.disabled = true; });
      matched.push(value); sel = null;
      Adaptive.hit(stage.id, sk);
      Audio_.good(); Audio_.speakEn(value);
      UI.setBubble(`${ar(matched.length)} / ${ar(q.items.length)} ✅`, 'ok');
      if(matched.length === q.items.length){
        correct += tries === 0 ? 1 : 0;
        if(tries === 0) award();
        UI.correct(null, tries === 0);
        setTimeout(next, 1200);
      }
    }else{
      tries++; streak = 0;
      if(!mistakes.includes(q.type)) mistakes.push(q.type);
      if(tries === 1) penalize();
      Adaptive.miss(stage.id, sk);
      UI.wrong(btn, q, tries);
      Audio_.bad(); Audio_.speakEn('Try again');
      if(sel.btn) sel.btn.classList.remove('sel');
      sel = null;
    }
  }

  /* نجاح السؤال بأي وضع — نفس الحساب في كل مكان */
  function solved(q){
    correct += tries === 0 ? 1 : 0;
    streak = tries === 0 ? streak + 1 : 0;
    if(tries === 0) award();
    UI.correct(null, tries === 0, streak);
    streak >= 3 && tries === 0 ? Audio_.combo(streak) : Audio_.good();
    setTimeout(next, 1200);
  }

  /* ضع دائرة: الطفل يلاقي كل تكرارات الحرف */
  function findPick(i, btn){
    const q = current();
    if(btn.disabled) return;
    if(q.cells[i].hit){
      btn.classList.add('circled'); btn.disabled = true;
      matched.push(i);
      Audio_.good(); Audio_.speakEn(q.cells[i].ch);
      UI.setBubble(`${ar(matched.length)} / ${ar(q.hits)} ✅`, 'ok');
      if(matched.length === q.hits){
        if(tries === 0) Adaptive.hit(stage.id, q.skill);
        solved(q);
      }
    }else{
      tries++;
      if(!mistakes.includes(q.type)) mistakes.push(q.type);
      if(tries === 1) penalize();
      Adaptive.miss(stage.id, q.skill);
      UI.wrong(btn, q, tries);
      Audio_.bad(); Audio_.speakEn('Not this one');
    }
  }

  /* لعبة الأصحاب: اقلب كارتين ولاقي الحرف وصاحبه */
  function memoryPick(i, btn){
    const q = current();
    if(mem.lock || btn.disabled) return;
    if(mem.first && mem.first.i === i) return;

    btn.classList.add('flip');
    btn.textContent = q.cards[i].ch;
    Audio_.speakEn(q.cards[i].ch);

    if(!mem.first){ mem.first = {i, btn}; return; }
    const a = mem.first, b = {i, btn};
    mem.first = null;
    const sk = q.skillOf ? q.skillOf(q.cards[a.i].k) : q.skill;

    if(q.cards[a.i].k === q.cards[b.i].k){
      [a,b].forEach(x => { x.btn.classList.add('matched'); x.btn.disabled = true; });
      mem.found++;
      Adaptive.hit(stage.id, sk);
      Audio_.good();
      UI.setBubble(`${ar(mem.found)} / ${ar(q.pairs)} ✅`, 'ok');
      if(mem.found === q.pairs) solved(q);
    }else{
      tries++;
      if(!mistakes.includes(q.type)) mistakes.push(q.type);
      if(tries === 1) penalize();
      Adaptive.miss(stage.id, sk);
      Audio_.bad();
      UI.setBubble('مش أصحاب — جرّب تاني ❤️', 'no');
      mem.lock = true;
      setTimeout(() => {
        [a,b].forEach(x => { x.btn.classList.remove('flip'); x.btn.textContent = '❓'; });
        mem.lock = false;
      }, 1000);
    }
  }

  /* اقرأ المقطع: مفيش إجابة غلط — الطفل يسمع ويقرأ ويؤكد */
  function readDone(btn){
    const q = current();
    Adaptive.hit(stage.id, q.skill);
    const pr = sample(PRAISE_SAY);
    Audio_.speak(pr[0], [pr[1]]);
    solved(q);
  }

  /* صنّف: اختار بطاقة ثم الصندوق (أو اسحبها). غلطة = تلميح لطيف، مش عقاب */
  function sortSelect(i, btn){
    const q = current();
    if(btn.disabled) return;
    if(sel && sel.btn) sel.btn.classList.remove('sel');
    sel = {i, btn};
    btn.classList.add('sel');
    Audio_.speak(q.cards[i].say);
  }
  function sortPlace(type, box){
    const q = current();
    if(!sel){ UI.setBubble('اختر مقطعًا أولًا 👆'); return; }
    const card = q.cards[sel.i], sk = 'madd:' + card.type;
    if(card.type === type){
      UI.sortPlace(sel.btn, box);
      matched.push(sel.i); sel = null;
      Adaptive.hit(stage.id, sk);
      Audio_.good(); Audio_.speak(card.say);
      UI.setBubble(`${ar(matched.length)} / ${ar(q.cards.length)} ✅`, 'ok');
      if(matched.length === q.cards.length) solved(q);
    }else{
      tries++; streak = 0;
      if(!mistakes.includes(q.type)) mistakes.push(q.type);
      if(tries === 1) penalize();
      Adaptive.miss(stage.id, sk);
      UI.wrong(box, q, tries);
      Audio_.bad();
      if(sel.btn) sel.btn.classList.remove('sel');
      sel = null;
    }
  }

  function next(){
    /* الوقت بيتحسب سؤال بسؤال — لو الطفل ساب الجولة، اللي ذاكره يتسجّل */
    Progress.addTime(Date.now() - t0);
    t0 = Date.now();
    idx++;
    if(idx >= list.length) finish();
    else render();
  }

  function finish(){
    const total = list.length;
    let unlocked = null;
    if(!practice){
      const before = Progress.get().best[stage.id] || 0;
      Progress.addResult(stage.id, correct, total);
      if(correct/total >= .8) unlocked = Progress.unlockNext(stage.id);
      if(stage.onFinish) stage.onFinish({correct, total, first: before < 2});
    }
    Progress.save();
    if(window.Rewards) Rewards.check();
    correct / total >= .8 ? Audio_.win() : Audio_.aww();
    UI.resultScreen({stage, correct, total, mistakes, unlocked, practice});
  }

  return {start, answer, pick, pairPick, findPick, memoryPick, readDone, sortSelect, sortPlace, state, repeat, pack:packOf, replay:()=>start(stage.id),
          trainMistakes:()=>start(stage.id,{practice:true, types:mistakes.slice()})};
})();
