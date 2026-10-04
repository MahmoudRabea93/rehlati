/* ============================================================
   js/worlds.js — سجل المراحل المركزي
   ------------------------------------------------------------
   أي عالم جديد = بيانات + مولّدات + سطر registerStages واحد.
   المحرك والواجهة والنجوم والتقدّم مشتركين، مفيش تكرار.
   ============================================================ */
const PACKS = {};        // id -> المرحلة
const WORLD_STAGES = {}; // world -> ترتيب مراحله

const WORLDS_META = {
  math:    {icon:'🧮', name:'الحساب',        color:'#7A5CFF', tone:'#5B3FD6', title:'🔢 عالم الحساب'},
  quran:   {icon:'📖', name:'القرآن الكريم', color:'#2FC9B4', tone:'#1C8E7F', title:'📖 عالم القرآن'},
  arabic:  {icon:'🔤', name:'العربي',        color:'#FF9F1C', tone:'#CC7A00', title:'🔤 عالم العربي'},
  english: {icon:'🇬🇧', name:'English',      color:'#4CB8FF', tone:'#1E86CC', title:'🇬🇧 English World'}
};

function registerStages(world, stages){
  WORLD_STAGES[world] = stages.map(s => s.id);
  stages.forEach((s,i) => { PACKS[s.id] = Object.assign({world, n:i+1}, s); });
}

/* مراحل الحساب الموجودة أصلاً تدخل نفس السجل بدون تغيير منطقها */
registerStages('math', STAGES.map(s => ({...s, gen:(lv,o) => Generators[s.id](lv,o)})));

/* ============================================================
   شاشة تعلّم الحروف — يستخدمها العربي و English بنفس الكود
   ============================================================ */
const LetterBoard = (() => {
  const screen = () => document.getElementById('screen');
  const esc = t => String(t).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  function visited(packId){
    const st = Progress.get();
    st.learn = st.learn || {};
    st.learn[packId] = st.learn[packId] || [];
    return st.learn[packId];
  }

  function open(pack){
    const items = pack.items, en = pack.lang === 'en';
    const seen = visited(pack.id);
    UI.bar({back:pack.world, title:pack.name});
    screen().innerHTML = `
      <section class="hero">
        <div class="banner" style="background:${pack.color};box-shadow:0 7px 0 ${WORLDS_META[pack.world].tone};color:#fff">
          ${pack.icon} ${esc(pack.name)}
        </div>
        <p>${en ? 'Tap a letter to hear it' : 'اضغط على أي حرف تسمعه'}</p>
      </section>
      <div class="lboard ${en?'ltr':''}">
        ${items.map((it,i) => `<button class="lcell ${seen.includes(it.l)?'seen':''}" data-i="${i}">${esc(it.l)}</button>`).join('')}
      </div>
      <div id="lcard"></div>
      <div class="bubble" id="bubble">${en ? `${ar(seen.length)} / ${ar(items.length)} letters` : `اتعلمت ${ar(seen.length)} من ${ar(items.length)} حرف`}</div>`;

    screen().querySelectorAll('.lcell').forEach(b => b.onclick = () => show(pack, +b.dataset.i));
  }

  function show(pack, i){
    const it = pack.items[i], en = pack.lang === 'en';
    const seen = visited(pack.id);
    if(!seen.includes(it.l)){ seen.push(it.l); Progress.save(); }

    document.getElementById('lcard').innerHTML = `
      <div class="qcard center lcard-in">
        <div class="bigletter ${en?'ltr':''}">${esc(it.l)}</div>
        <div class="bigemoji">${it.e}</div>
        <div class="lword ${en?'ltr':''}">${en ? esc(it.w) : `${esc(it.l)} مثل ${esc(it.w)}`}</div>
        <button class="btn" id="lsay">🔊 ${en ? 'Listen' : 'اسمع'}</button>
      </div>`;
    const say = () => en
      ? Audio_.speakEn(`${it.l} . ${it.w}`)
      : Audio_.speak(`${it.l} . ${it.l} مثل ${it.w}`);
    document.getElementById('lsay').onclick = say;
    say();

    const cell = screen().querySelectorAll('.lcell')[i];
    if(cell) cell.classList.add('seen');
    const left = pack.items.length - seen.length;
    UI.setBubble(en ? `${ar(seen.length)} / ${ar(pack.items.length)} letters`
                    : `اتعلمت ${ar(seen.length)} من ${ar(pack.items.length)} حرف`);

    /* نجمة لما يخلص كل الحروف — مرة واحدة */
    if(left === 0 && !Progress.get().best[pack.id]){
      Progress.addResult(pack.id, 1, 1);
      Progress.addStar(3, pack.world);
      if(window.UI && UI.bumpStars) UI.bumpStars();
      Progress.unlockNext(pack.id);
      Audio_.win();
      UI.setBubble(en ? 'All letters done! ⭐' : 'خلّصت كل الحروف! ⭐', 'ok');
      if(window.Rewards) Rewards.check();
    }
  }

  return {open};
})();
