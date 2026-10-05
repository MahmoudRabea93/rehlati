/* ============================================================
   js/progress.js — التقدّم و localStorage
   ============================================================ */
const Progress = (() => {
  const KEY = 'rehlati.math.v1';
  const base = () => ({
    name:'', stars:0, correct:0, wrong:0, games:0, timeMs:0, lastActivity:null, lastStage:null,
    unlocked:['counting','ar_learn','en_learn'], best:{}, starsBy:{},
    quran:{}, learn:{}, skills:{}, achievements:[],
    settings:{speech:true, sfx:true, dev:false}
  });
  let state = base();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw) state = Object.assign(base(), JSON.parse(raw));
      if(!state.settings) state.settings = base().settings;
    }catch(e){ state = base(); }
    return state;
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
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
      state.lastActivity = Date.now();
      save();
    },
    /* كل إجابة تتحسب لحظتها — لو الطفل ساب الجولة في النص، اللي عمله ما يضيعش */
    addAnswer(ok){
      ok ? state.correct++ : state.wrong++;
      state.lastActivity = Date.now();
      save();
    },

    addResult(id, correct, total){
      state.games = (state.games||0) + 1;
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
    addTime(ms){ state.timeMs = (state.timeMs||0) + ms; state.lastActivity = Date.now(); },
    reset(){ const keep = state.settings; state = base(); state.settings = keep; save(); }
  };
})();
