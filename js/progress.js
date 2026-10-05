/* ============================================================
   js/progress.js — التقدّم و localStorage
   ============================================================ */
const Progress = (() => {
  const KEY = 'rehlati.math.v1';
  const base = () => ({
    name:'', stars:0, correct:0, wrong:0, games:0, timeMs:0, lastActivity:null, lastStage:null,
    unlocked:['counting','ar_learn','en_learn'], best:{}, starsBy:{},
    quran:{}, learn:{}, skills:{}, achievements:[],
    /* سجل يومي مختصر: 'YYYY-MM-DD' -> {stars, correct, wrong, games, ms, done}
       بيغذّي السلسلة والهدف اليومي والتقرير الأسبوعي */
    days:{},
    settings:{speech:true, sfx:true, music:true, dev:false,
              goal:20,      /* هدف اليوم بالنجوم */
              limitMin:0}   /* حد أقصى لوقت اللعب بالدقايق — ٠ = مفيش حد */
  });
  let state = base();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw) state = Object.assign(base(), JSON.parse(raw));
      if(!state.settings) state.settings = base().settings;
      if(state.settings.music === undefined) state.settings.music = true;   /* إعداد جديد للمستخدمين القدام */
      if(state.settings.goal === undefined) state.settings.goal = 20;
      if(state.settings.limitMin === undefined) state.settings.limitMin = 0;
      if(!state.days) state.days = {};
      prune();
    }catch(e){ state = base(); }
    return state;
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
  }

  /* ---------- السجل اليومي ---------- */
  /* مفتاح اليوم بتوقيت الجهاز (مش UTC) عشان "النهاردة" تبقى نهاردة فعلاً */
  const dayKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const shift = n => { const d = new Date(); d.setDate(d.getDate() + n); return dayKey(d); };
  /* بنحتفظ بآخر ٧٠ يوم بس — التخزين محدود والتقرير أسبوعي */
  function prune(){
    const keys = Object.keys(state.days || {}).sort();
    if(keys.length > 70) keys.slice(0, keys.length - 70).forEach(k => delete state.days[k]);
  }
  function today(){
    const k = dayKey();
    const d = state.days[k] = state.days[k] || {stars:0, correct:0, wrong:0, games:0, ms:0, done:0};
    return d;
  }
  /* سلسلة الأيام: بتتحسب من النهاردة (أو من إمبارح لو لسه ملعبش النهاردة)
     عشان الطفل ما يفقدش السلسلة بمجرد ما يصحى الصبح */
  function streak(){
    let n = 0, i = state.days[dayKey()] ? 0 : -1;
    if(i === -1 && !state.days[shift(-1)]) return 0;
    while(state.days[shift(i)]){ n++; i--; }
    return n;
  }
  return {
    load, save,
    get:()=>state,
    isUnlocked(id){
      if(state.settings.dev || state.unlocked.includes(id)) return true;
      /* مرحلة ليها after بتتفتح أول ما المرحلة دي تتنجح (٨٠٪+) — بتشتغل للتقدّم القديم كمان */
      const pk = PACKS[id];
      return !!(pk && pk.after && (state.best[pk.after] || 0) >= 2);
    },
    unlockNext(id){
      const pack = PACKS[id]; if(!pack) return null;
      const order = WORLD_STAGES[pack.world] || [];
      const nxtId = order[order.indexOf(id) + 1];
      if(nxtId && !state.unlocked.includes(nxtId)){ state.unlocked.push(nxtId); save(); return PACKS[nxtId]; }
      return null;
    },
    /* النجمة بتتسجّل فورًا مع كل إجابة صح عشان الطفل يشوفها بتزيد.
       بتتقيّد على العالم كمان عشان مجموع نجوم العوالم يساوي الإجمالي */
    addStar(n = 1, world){
      state.stars += n;
      if(world) state.starsBy[world] = (state.starsBy[world] || 0) + n;
      today().stars += n;
      state.lastActivity = Date.now();
      save();
    },
    /* كل إجابة تتحسب لحظتها — لو الطفل ساب الجولة في النص، اللي عمله ما يضيعش */
    addAnswer(ok){
      ok ? state.correct++ : state.wrong++;
      ok ? today().correct++ : today().wrong++;
      state.lastActivity = Date.now();
      save();
    },

    addResult(id, correct, total){
      state.games = (state.games||0) + 1;
      today().games++;
      state.lastActivity = Date.now();
      const medals = correct===total ? 3 : (correct/total>=.8 ? 2 : 1);
      state.best[id] = Math.max(state.best[id]||0, medals);
      state.lastStage = id;
      save();
    },
    /* مستوى الطفل = أعلى مستوى وصلت إليه المراحل المفتوحة */
    level(world){
      const ids = world ? (WORLD_STAGES[world] || []) : Object.keys(PACKS);
      let lv = 1;
      ids.forEach(id => { if(this.isUnlocked(id)) lv = Math.max(lv, PACKS[id].base); });
      return ids.length && ids.every(id => state.best[id]) ? 4 : lv;
    },
    /* نسبة إنجاز عالم — للوحة ولي الأمر */
    worldPct(world){
      const ids = WORLD_STAGES[world] || [];
      if(!ids.length) return 0;
      const got = ids.reduce((s,id)=> s + Math.min(state.best[id]||0, 3), 0);
      return Math.round(got / (ids.length*3) * 100);
    },
    /* النجوم اللي الطفل كسبها فعلاً في العالم ده */
    starsIn(world){ return state.starsBy[world] || 0; },
    addTime(ms){ state.timeMs = (state.timeMs||0) + ms; today().ms += ms; state.lastActivity = Date.now(); },

    /* ---------- الهدف اليومي والسلسلة ---------- */
    dayKey, shift, today, streak,
    goal:()=> state.settings.goal || 0,
    todayStars:()=> today().stars,
    goalPct(){
      const g = this.goal();
      return g ? Math.min(100, Math.round(today().stars / g * 100)) : 0;
    },
    goalDone(){ const g = this.goal(); return !!g && today().stars >= g; },
    /* بترجّع true مرة واحدة بس في اليوم — عشان الاحتفال ما يتكررش */
    celebrate(){
      if(!this.goalDone() || today().done) return false;
      today().done = 1; save();
      return true;
    },

    /* ---------- حد وقت اللعب ---------- */
    limitMin:()=> state.settings.limitMin || 0,
    todayMin:()=> Math.round(today().ms / 60000),
    limitLeft(){
      const lim = this.limitMin();
      return lim ? Math.max(0, lim - this.todayMin()) : Infinity;
    },
    limitReached(){ return this.limitMin() > 0 && this.limitLeft() <= 0; },

    /* ---------- التقرير الأسبوعي ---------- */
    /* آخر ٧ أيام بالترتيب (الأقدم الأول)، وكل يوم بسجلّه حتى لو فاضي */
    week(offset = 0){
      const out = [];
      for(let i = 6 + offset * 7; i >= offset * 7; i--){
        const k = shift(-i);
        out.push({key:k, d:new Date(k + 'T00:00:00'), ...(state.days[k] || {stars:0, correct:0, wrong:0, games:0, ms:0})});
      }
      return out;
    },
    weekSum(offset = 0){
      return this.week(offset).reduce((a, d) => ({
        stars:a.stars + d.stars, correct:a.correct + d.correct, wrong:a.wrong + d.wrong,
        games:a.games + d.games, ms:a.ms + d.ms, days:a.days + (d.games || d.stars ? 1 : 0)
      }), {stars:0, correct:0, wrong:0, games:0, ms:0, days:0});
    },
    reset(){ const keep = state.settings; state = base(); state.settings = keep; save(); }
  };
})();
