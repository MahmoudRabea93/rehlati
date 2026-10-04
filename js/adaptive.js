/* ============================================================
   js/adaptive.js — تعلّم متكيّف
   بيراقب أخطاء الطفل ويرجّع نفس نوع المهارة تاني لحد ما يتقنها
   ============================================================ */
const Adaptive = {
  store(){
    const st = Progress.get();
    st.skills = st.skills || {};
    return st.skills;
  },
  /* مفتاح موحّد: المرحلة + المهارة */
  k: (pack, skill) => pack + '|' + skill,

  miss(pack, skill){
    if(!skill) return;
    const s = this.store();
    s[this.k(pack, skill)] = Math.min((s[this.k(pack, skill)] || 0) + 1, 6);
    Progress.save();
  },
  hit(pack, skill){
    if(!skill) return;
    const s = this.store(), key = this.k(pack, skill);
    if(!s[key]) return;
    s[key] -= 1;
    if(s[key] <= 0) delete s[key];
    Progress.save();
  },
  /* أضعف مهارة في المرحلة دي — لو الطفل غلط فيها مرتين أو أكتر */
  focus(pack){
    const s = this.store();
    const mine = Object.keys(s).filter(k => k.startsWith(pack + '|') && s[k] >= 2);
    if(!mine.length) return null;
    mine.sort((a,b) => s[b] - s[a]);
    return mine[0].split('|')[1].split(':').slice(1).join(':') || null;
  },
  /* أكتر المهارات اللي محتاجة تدريب — للوحة ولي الأمر */
  weakest(n = 5){
    const s = this.store();
    return Object.keys(s).filter(k => s[k] >= 2)
      .sort((a,b) => s[b] - s[a]).slice(0, n)
      .map(k => ({pack:k.split('|')[0], skill:k.split('|')[1], misses:s[k]}));
  }
};
