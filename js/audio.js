/* ============================================================
   js/audio.js — النطق العربي (Web Speech API) + مؤثرات
   ============================================================ */
/* الأرقام تُنطق بالحروف العربية حتى لا تعتمد على لغة الصوت المثبّت */
const AR_ONES = ['صفر','واحد','اتنين','تلاتة','أربعة','خمسة','ستة','سبعة','تمانية','تسعة','عشرة',
                 'حداشر','اتناشر','تلاتاشر','أربعتاشر','خمستاشر','ستاشر','سبعتاشر','تمنتاشر','تسعتاشر','عشرين'];
const AR_TENS = {20:'عشرين',30:'تلاتين',40:'أربعين',50:'خمسين',60:'ستين',70:'سبعين',80:'تمانين',90:'تسعين'};
function arNum(n){
  n = Number(n);
  if(!isFinite(n)) return String(n);
  if(n <= 20) return AR_ONES[n] || String(n);
  if(n === 100) return 'مية';
  const t = Math.floor(n/10)*10, o = n%10;
  return o ? `${AR_ONES[o]} و${AR_TENS[t]}` : AR_TENS[t];
}
const arList = arr => arr.map(v => typeof v === 'number' ? arNum(v) : v).join('، ');
const SIGN_WORD = {'>':'أكبر من','<':'أصغر من','=':'يساوي'};

/* ---- طبقة المقاطع الصوتية المسجّلة (اختيارية: audio/manifest.js) ----
   لو الملفات موجودة بتتشغّل بصوت حقيقي، ولو ناقصة بيرجع تلقائيًا لنطق المتصفح */
const Clips = (() => {
  const map = () => window.AUDIO_CLIPS || null;
  const cache = {};
  let token = 0;
  const has = k => { const m = map(); return !!(k && m && m[k]); };
  const hasAll = keys => !!(keys && keys.length && keys.every(has));
  function el(key){
    if(!cache[key]){ const a = new Audio('audio/' + map()[key]); a.preload = 'auto'; cache[key] = a; }
    return cache[key];
  }
  function play(keys, onFail){
    const mine = ++token; let i = 0;
    (function next(){
      if(mine !== token || i >= keys.length) return;
      const a = el(keys[i++]);
      try{ a.currentTime = 0; }catch(e){}
      a.onended = next;
      a.onerror = () => { if(mine === token && onFail) onFail(); };
      const pr = a.play();
      if(pr && pr.catch) pr.catch(()=>{ if(mine === token && onFail) onFail(); });
    })();
  }
  function stop(){ token++; Object.keys(cache).forEach(k=>{ try{ cache[k].pause(); }catch(e){} }); }
  return {has, hasAll, play, stop, ready:()=> !!map(), count:()=> map() ? Object.keys(map()).length : 0};
})();

const Audio_ = (() => {
  let voice = null, enVoice = null, ctx = null, scans = 0, unlocked = false, pending = null;
  const diag = { lastEvent:'لسه مجربناش', voices:0, arVoices:[] };
  const synth = window.speechSynthesis;

  /* اختيار أفضل صوت عربي متاح (مصري ← خليجي ← أي عربي) */
  function pickVoice(){
    if(!synth) return false;
    const vs = synth.getVoices() || [];
    if(!vs.length) return false;
    diag.voices = vs.length;
    const ar = vs.filter(v => /^ar/i.test(v.lang) || /arabic|عرب/i.test(v.name||''));
    diag.arVoices = ar.map(v => `${v.name} (${v.lang})`);
    voice = ar.find(v=>/eg/i.test(v.lang)) || ar.find(v=>/sa|ae|jo|ma/i.test(v.lang)) || ar[0] || null;
    const en = vs.filter(v => /^en/i.test(v.lang));
    enVoice = en.find(v=>/us/i.test(v.lang)) || en.find(v=>/gb/i.test(v.lang)) || en[0] || null;
    return true;
  }
  if(synth){
    pickVoice();
    synth.onvoiceschanged = pickVoice;
    /* بعض المتصفحات تُحمّل الأصوات متأخرًا (وأصوات Google بتيجي من الشبكة) */
    const t = setInterval(()=>{ if(pickVoice() || ++scans > 40) clearInterval(t); }, 250);
    /* كروم بيسكّت النطق لو فضل شغال أكتر من ١٥ ثانية — ده بيحافظ عليه صاحي */
    setInterval(()=>{ try{ if(synth.speaking && !synth.paused){ synth.pause(); synth.resume(); } }catch(e){} }, 9000);
  }

  /* المتصفحات بتمنع أول نطق قبل ما المستخدم يلمس الصفحة */
  function unlock(){
    if(!synth) return;
    if(!unlocked){
      unlocked = true;
      try{ const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); }catch(e){}
    }
    if(pending){ const p = pending; pending = null; setTimeout(()=>speak(p[0], p[1], p[2]), 150); }
  }
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  /* إزالة الإيموجي والرموز قبل النطق */
  const clean = t => String(t)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2600}-\u{26FF}]/gu,' ')
    .replace(/\s+/g,' ').trim();

  function utter(text, lang){
    const u = new SpeechSynthesisUtterance(clean(text));
    if(lang === 'en'){
      if(enVoice){ u.voice = enVoice; u.lang = enVoice.lang; } else { u.lang = 'en-US'; }
    }else if(voice){ u.voice = voice; u.lang = voice.lang; }
    else { u.lang = 'ar-EG'; }
    u.rate = lang === 'en' ? .78 : .82; u.pitch = 1.1; u.volume = 1;
    u.onstart = () => diag.lastEvent = 'اشتغل ✅';
    u.onerror = e => diag.lastEvent = 'خطأ: ' + ((e && e.error) || 'غير معروف');
    return u;
  }

  /* speak('جملة') أو speak(['جملة','جملة تانية']) — تُنطق بالترتيب */
  function speak(text, keys, lang){
    const st = Progress.get().settings;
    if(!st.speech){ diag.lastEvent = 'النطق مقفول من الإعدادات'; return; }
    const parts = (Array.isArray(text) ? text : [text]).filter(p => p && clean(p));
    if(!parts.length && !keys) return;
    if(!unlocked){ pending = [text, keys, lang]; diag.lastEvent = 'مستني أول لمسة من المستخدم'; return; }
    Clips.stop();
    /* الإنجليزي مالوش مقاطع مسجّلة — على طول نطق المتصفح */
    if(lang === 'en'){ tts(parts, 'en'); return; }
    /* الأولوية للمقاطع المسجّلة لو كلها متوفرة */
    if(Clips.hasAll(keys)){
      diag.lastEvent = 'مقاطع مسجّلة ✅';
      Clips.play(keys, ()=> tts(parts));
      return;
    }
    if(!synth){ diag.lastEvent = 'المتصفح مش بيدعم النطق'; return; }
    tts(parts);
  }

  function tts(parts, lang){
    if(!synth) return;
    try{ synth.cancel(); synth.resume(); }catch(e){}
    setTimeout(()=>{
      parts.forEach(p=>{ try{ synth.speak(utter(p, lang)); }catch(e){ diag.lastEvent = 'استثناء: ' + e.message; } });
    }, 90);
  }

  /* جملة تُقال أول ما المستخدم يلمس الشاشة (الترحيب مثلًا) */
  function greet(text, keys){ if(unlocked) speak(text, keys); else pending = [text, keys]; }

  function audio(){
    const st = Progress.get().settings;
    if(!st.sfx) return null;
    try{
      ctx = ctx || new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state === 'suspended') ctx.resume();
      return ctx;
    }catch(e){ diag.lastEvent = 'المؤثرات: ' + e.message; return null; }
  }

  /* نغمة واحدة بظرف ناعم — الأساس اللي كل المؤثرات مبنية عليه */
  function note(f, at, dur, {type='triangle', vol=.22, to=null} = {}){
    const c = ctx; if(!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    const t0 = c.currentTime + at;
    o.frequency.setValueAtTime(f, t0);
    if(to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);   /* انزلاق */
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0); o.stop(t0 + dur + .03);
  }

  function tone(freqs, dur=.16){
    if(!audio()) return;
    freqs.forEach((f,i) => note(f, i*dur, dur));
  }

  /* ---- تصفيق الجمهور ----
     التصفيقة الواحدة في الحقيقة ضجيج قصير جدًا، والجمهور = مئات التصفيقات
     العشوائية فوق بعض. فبنعمل مخزن ضجيج واحد ونعيد استخدامه. */
  let noiseBuf = null;
  function noiseSource(c, from){
    if(!noiseBuf){
      const len = c.sampleRate * 3;
      noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    /* كل مصدر يبدأ من مكان مختلف في المخزن عشان التصفيقات ما تتطابقش */
    s.__from = from === undefined ? Math.random() * 2.5 : from;
    return s;
  }

  /* سحابة التصفيق العامة + تصفيقات فردية واضحة فوقها */
  function applause(dur = 2.2, vol = 1){
    const c = ctx; if(!c) return;
    const t0 = c.currentTime;

    const cloud = noiseSource(c);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = .5;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 600;
    const g = c.createGain();
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(.2 * vol, t0 + .22);     /* الجمهور بيولع بسرعة */
    g.gain.setValueAtTime(.2 * vol, t0 + dur * .45);
    g.gain.exponentialRampToValueAtTime(.08 * vol, t0 + dur * .78);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);        /* وبيهدى بالراحة مش فجأة */
    cloud.connect(bp).connect(hp).connect(g).connect(c.destination);
    cloud.start(t0, cloud.__from); cloud.stop(t0 + dur + .05);

    const claps = Math.round(dur * 26);
    for(let i = 0; i < claps; i++){
      const at = t0 + Math.random() * dur * .9;
      const s = noiseSource(c);
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1000 + Math.random() * 2400;   /* كل إيد ليها رنة مختلفة */
      f.Q.value = 1.2;
      const cg = c.createGain();
      cg.gain.setValueAtTime(.0001, at);
      cg.gain.exponentialRampToValueAtTime((.04 + Math.random() * .06) * vol, at + .004);
      cg.gain.exponentialRampToValueAtTime(.0001, at + .05 + Math.random() * .06);
      s.connect(f).connect(cg).connect(c.destination);
      s.start(at, s.__from); s.stop(at + .15);
    }
  }

  /* تقرير تشخيصي يظهر في الإعدادات */
  function report(){
    if(!synth) return ['❌ المتصفح ده مش بيدعم النطق خالص — جرّب Chrome أو Edge'];
    return [
      `أصوات متاحة على الجهاز: ${ar(diag.voices)}`,
      diag.arVoices.length ? `أصوات عربية: ${diag.arVoices.join(' • ')}` : '⚠️ مفيش صوت عربي مثبّت على الجهاز',
      `الصوت المختار: ${voice ? voice.name : 'لا يوجد'}`,
      `آخر محاولة نطق: ${diag.lastEvent}`,
      `مؤثرات اللعبة: ${ctx ? ctx.state : 'لسه مبدأتش'}`,
      Clips.ready() ? `🎙️ مقاطع مسجّلة محمّلة: ${ar(Clips.count())}` : '🎙️ مفيش مقاطع مسجّلة (بنستخدم نطق المتصفح)'
    ];
  }

  return {
    /* 🥁 طبلة من تلاتة: لكل واحدة نبرة مختلفة واضحة للطفل */
    pad(i = 0){
      if(!audio()) return;
      const P = [
        {f:180, to:70,  type:'triangle', dur:.3,  vol:.3},   // طبلة
        {f:900, to:420, type:'square',   dur:.14, vol:.14},  // تصفيقة
        {f:1320,to:1320,type:'sine',     dur:.5,  vol:.2}    // جرس
      ][i] || {f:440, dur:.2, vol:.2};
      note(P.f, 0, P.dur, {type:P.type, vol:P.vol, to:P.to !== P.f ? P.to : null});
    },
    speak, greet, unlock, report,
    speakEn(text){ speak(text, null, 'en'); },
    supported:()=> !!synth,
    voiceName:()=> voice ? `${voice.name} (${voice.lang})` : null,
    /* ✅ إجابة صح: نغمة صاعدة مبهجة + رشة عالية */
    good(){
      if(!audio()) return;
      [523,659,784].forEach((f,i) => note(f, i*.09, .16, {vol:.2}));
      note(1568, .27, .22, {type:'sine', vol:.12});
    },
    /* 🔥 سلسلة إجابات صح: احتفال أكبر + تصفيقة خفيفة */
    combo(n = 3){
      if(!audio()) return;
      [523,659,784,1047,1319].forEach((f,i) => note(f, i*.075, .2, {vol:.2}));
      note(1047, .42, .5, {type:'sine', vol:.16});
      note(1568, .46, .5, {type:'sine', vol:.1});
      applause(1.1, .6);
    },
    /* ❌ إجابة غلط: نغمة هابطة لطيفة — زعلانة مش مخيفة */
    bad(){
      if(!audio()) return;
      note(392, 0, .22, {vol:.17, to:294});
      note(294, .2, .34, {vol:.15, to:196});
    },
    /* 🎉 نهاية الجولة: فانفير قصير والجمهور بيصفّق وراه */
    win(){
      if(!audio()) return;
      [523,659,784,1047].forEach((f,i) => note(f, i*.09, .2, {vol:.19}));
      note(1319, .38, .34, {type:'sine', vol:.13});
      applause(2.6);
    },
    /* 😔 نتيجة ضعيفة — تشجيع مش إحباط */
    aww(){
      if(!audio()) return;
      note(440, 0, .3, {vol:.16, to:349});
      note(349, .28, .42, {vol:.14, to:262});
    },
    clipsReady:()=> Clips.ready(), clipsCount:()=> Clips.count(),
    stop(){ Clips.stop(); try{ synth && synth.cancel(); }catch(e){} }
  };
})();
