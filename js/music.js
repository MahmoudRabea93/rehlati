/* ============================================================
   js/music.js — موسيقى خلفية هادية (تهويدة علبة موسيقى)
   ------------------------------------------------------------
   مفيش ملفات صوت خارجية: الموسيقى بتتولّد لحظيًا بـ Web Audio.

   الفرق عن أي "نغمات عشوائية": دي موسيقى بقواعد حقيقية —
     • دورة كوردات ثابتة (دو ← لا صغير ← فا ← صول) بتتكرر بهدوء
     • اللحن بيمشي بخطوات صغيرة جوه الكورد (مفيش قفزات نشاز)
     • صوت العلبة الموسيقية = نغمة أساسية + توافقياتها بذيل طويل
     • باص ناعم جدًا تحت + صدى خفيف = إحساس مكان واسع

   القواعد:
     • بتبدأ بعد أول لمسة من المستخدم (سياسة المتصفحات)
     • بتسكت تمامًا في عالم القرآن (Music.quiet(true))
     • بتهدى تلقائيًا وقت نطق الأسئلة عشان الطفل يسمع كويس
     • بتقف لما الصفحة تبقى في الخلفية
     • ليها مفتاح في الإعدادات ومحفوظة مع باقي الإعدادات
   ============================================================ */
const Music = (() => {
  const BAR = 4;          // عدد النغمات قبل ما الكورد يتغيّر

  /* ---------- دورات كوردات جاهزة ----------
     كل دورة ليها "مزاج" مختلف، والكل في نفس السلّم فمفيش نشاز */
  const PROG = {
    /* دافية ومطمّنة — دو / لا صغير / فا / صول */
    warm:  [{bass:-12,tones:[0,4,7,12]}, {bass:-3,tones:[9,12,16,21]},
            {bass:-7,tones:[5,9,12,17]}, {bass:-5,tones:[7,11,14,19]}],
    /* واسعة وحالمة — فا / دو / صول / لا صغير */
    airy:  [{bass:-7,tones:[5,9,12,17]}, {bass:-12,tones:[0,4,7,16]},
            {bass:-5,tones:[7,11,14,19]}, {bass:-3,tones:[9,12,16,21]}],
    /* فضولية خفيفة — لا صغير / فا / دو / صول */
    curious:[{bass:-3,tones:[9,12,16,21]}, {bass:-7,tones:[5,9,12,17]},
            {bass:-12,tones:[0,4,7,12]}, {bass:-5,tones:[7,11,14,19]}],
    /* نشيطة للسباق — دو / فا / صول / دو */
    bright:[{bass:-12,tones:[0,4,7,12]}, {bass:-7,tones:[5,9,12,17]},
            {bass:-5,tones:[7,11,14,19]}, {bass:-12,tones:[4,7,12,16]}]
  };

  /* ---------- مزاج موسيقي لكل شاشة ----------
     step = البطء (ثواني بين النغمات) | vol = الصوت | tone = نبرة الجرس
     المفتاح = id المرحلة، وإلا id العالم، وإلا 'home' */
  const THEMES = {
    home:      {prog:'warm',    step:1.45, vol:.11, tone:[1,.22,.08], bass:.07},
    math:      {prog:'warm',    step:1.5,  vol:.09, tone:[1,.18,.06], bass:.06},
    arabic:    {prog:'airy',    step:1.7,  vol:.09, tone:[1,.14,.05], bass:.07},
    english:   {prog:'curious', step:1.4,  vol:.09, tone:[1,.25,.09], bass:.05},
    games:     {prog:'airy',    step:1.3,  vol:.10, tone:[1,.3,.12],  bass:.05},
    /* ألعاب لها طابعها الخاص */
    balloons:  {prog:'airy',    step:1.15, vol:.10, tone:[1,.34,.14], bass:.04},
    memoryNum: {prog:'curious', step:1.9,  vol:.08, tone:[1,.16,.05], bass:.06},
    listenNum: {prog:'warm',    step:2.6,  vol:.04, tone:[1,.1,.03],  bass:.03},
    race:      {prog:'bright',  step:0.8,  vol:.11, tone:[1,.4,.18],  bass:.08},
    puzzle:    {prog:'airy',    step:1.6,  vol:.09, tone:[1,.2,.07],  bass:.06},
    colorNum:  {prog:'warm',    step:2.1,  vol:.08, tone:[1,.12,.04], bass:.05},
    pattern:   {prog:'curious', step:1.6,  vol:.09, tone:[1,.18,.06], bass:.06},
    letterHunt:{prog:'airy',    step:1.15, vol:.10, tone:[1,.34,.14], bass:.04},
    rhythm:    {prog:'warm',    step:3.2,  vol:.03, tone:[1,.08,.02], bass:.02},
    shapes:    {prog:'curious', step:1.5,  vol:.09, tone:[1,.22,.08], bass:.05},
    sizeOrder: {prog:'warm',    step:1.8,  vol:.08, tone:[1,.16,.05], bass:.06},
    clock:     {prog:'airy',    step:2.0,  vol:.08, tone:[1,.14,.05], bass:.06}
  };

  let T = THEMES.home;                    // المزاج الشغّال دلوقتي
  const CHORDS = () => PROG[T.prog];

  let ctx = null, master = null, bus = null, bassOsc = null, bassGain = null;
  let timer = null, playing = false, quiet = false, watch = null;
  let beat = 0, last = 12;                // آخر نغمة اتعزفت (عشان نمشي بخطوات صغيرة)

  const on = () => !!(Progress.get().settings || {}).music;
  /* تغيير المزاج: نخفت، نبدّل الإعدادات، نرجّع بالتدريج — من غير قطع */
  function theme(id){
    const t = THEMES[id] || THEMES[(PACKS[id] || {}).world] || THEMES.home;
    if(t === T) return;
    T = t;
    beat = 0;
    if(!playing) return;
    fade(0, .5);
    clearTimeout(timer);
    setTimeout(() => {
      if(!playing) return;
      if(bassGain) bassGain.gain.setTargetAtTime(T.bass, ctx.currentTime, .3);
      fade(target(), 1.6);
      tick();
    }, 600);
  }
  const freq = n => 261.63 * Math.pow(2, n / 12);   // دو الأوسط = درجة ٠
  const speaking = () => { try{ return !!(window.speechSynthesis && speechSynthesis.speaking); }catch(e){ return false; } };

  /* ---------- السلسلة الصوتية ---------- */
  function build(){
    if(ctx) return true;
    try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){ return false; }

    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    /* فلتر بيشيل الحدة عن النغمات فتبقى ناعمة على ودن الطفل */
    bus = ctx.createBiquadFilter();
    bus.type = 'lowpass'; bus.frequency.value = 2600; bus.Q.value = .3;
    bus.connect(master);

    /* صدى خفيف — بيدي اتساع من غير ما يعمل دوشة */
    const dly = ctx.createDelay(1.5);
    dly.delayTime.value = .55;
    const fb = ctx.createGain(); fb.gain.value = .28;
    const dampen = ctx.createBiquadFilter(); dampen.type = 'lowpass'; dampen.frequency.value = 1400;
    const wet = ctx.createGain(); wet.gain.value = .5;
    dly.connect(dampen).connect(fb).connect(dly);
    dampen.connect(wet).connect(master);
    bus.__echo = dly;

    /* باص مستمر ناعم جدًا — بيدي دفء تحت اللحن */
    bassOsc = ctx.createOscillator(); bassOsc.type = 'sine';
    bassGain = ctx.createGain(); bassGain.gain.value = T.bass;
    const bLp = ctx.createBiquadFilter(); bLp.type = 'lowpass'; bLp.frequency.value = 320;
    bassOsc.connect(bassGain).connect(bLp).connect(master);
    bassOsc.frequency.value = freq(CHORDS()[0].bass);
    bassOsc.start();
    return true;
  }

  /* نغمة علبة موسيقى: أساسي + توافقيتين خفاف + ذيل طويل */
  function bell(n, at, vol){
    const t = ctx.currentTime + at;
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .035);        // ضربة ناعمة
    g.gain.exponentialRampToValueAtTime(.0001, t + 3.4);       // ذيل طويل زي الجرس
    g.connect(bus); g.connect(bus.__echo);
    T.tone.forEach((amp, k) => {
      const mult = k + 1;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq(n) * mult;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og).connect(g);
      o.start(t); o.stop(t + 3.6);
    });
  }

  /* اللحن: خطوة صغيرة لأقرب نغمة في الكورد الحالي */
  function nextNote(tones){
    const pool = tones.concat(tones.map(t => t + 12));
    /* أقرب تلات نغمات لآخر نغمة — فاللحن يمشي مش ينطّ */
    const near = pool.slice().sort((a, b) => Math.abs(a - last) - Math.abs(b - last)).slice(0, 3);
    const n = near[Math.floor(Math.random() * near.length)];
    last = n;
    return n;
  }

  function tick(){
    if(!playing) return;
    const prog = CHORDS();
    const ch = prog[Math.floor(beat / BAR) % prog.length];
    const pos = beat % BAR;

    if(pos === 0 && bassOsc){        // الكورد بيتغيّر بانزلاق ناعم مش فجأة
      bassOsc.frequency.cancelScheduledValues(ctx.currentTime);
      bassOsc.frequency.setTargetAtTime(freq(ch.bass), ctx.currentTime, .4);
    }
    bell(nextNote(ch.tones), 0, pos === 0 ? .17 : .12);
    /* نغمة مرافقة أخف بعد نص المسافة — بتدي إحساس التهويدة */
    if(pos === 1 || pos === 3) bell(ch.tones[0] + 12, T.step * .5, .05);

    beat++;
    timer = setTimeout(tick, T.step * 1000);
  }

  /* ---------- مستوى الصوت ---------- */
  function fade(to, sec){
    if(!master) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, .0001), t);
    master.gain.linearRampToValueAtTime(to, t + sec);
  }
  const target = () => (!on() || quiet) ? 0 : (speaking() ? T.vol * .25 : T.vol);

  /* ---------- تشغيل وإيقاف ---------- */
  function start(){
    if(playing || !on() || quiet) return;
    if(!build()) return;
    if(ctx.state === 'suspended') ctx.resume();
    playing = true; beat = 0; last = 12;
    fade(target(), 4);            // دخول تدريجي بطيء — ما يفاجئش الطفل
    tick();
    if(!watch) watch = setInterval(() => { if(playing) fade(target(), speaking() ? .4 : 1.5); }, 600);
  }
  function stop(fast){
    if(!playing) return;
    playing = false;
    clearTimeout(timer); timer = null;
    fade(0, fast ? .3 : 1.5);
  }
  /* سكوت مؤقّت (القرآن) من غير ما نقفل الموسيقى من الإعدادات */
  function silence(yes){
    quiet = !!yes;
    if(quiet) stop(true); else setTimeout(start, 400);
  }
  function toggle(){
    const s = Progress.get().settings;
    s.music = !s.music; Progress.save();
    s.music ? start() : stop();
    return s.music;
  }

  window.addEventListener('pointerdown', start);
  window.addEventListener('keydown', start);
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) stop(true); else setTimeout(start, 300);
  });

  return {start, stop, quiet:silence, toggle, theme, playing:()=>playing, on, themeName:()=>T.prog};
})();

/* نسجّل الموديول على window عشان الملفات التانية تلاقيه (const مابيتسجّلش تلقائيًا) */
window.Music = Music;
