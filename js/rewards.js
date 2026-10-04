/* ============================================================
   js/rewards.js — نظام الإنجازات (Badges) المركزي
   ============================================================ */
const BADGES = [
  {id:'first_game',  icon:'🏆', name:'أول لعبة',          when:p => (p.games||0) >= 1},
  {id:'stars10',     icon:'⭐', name:'١٠ نجوم',            when:p => p.stars >= 10},
  {id:'stars50',     icon:'🌟', name:'٥٠ نجمة',            when:p => p.stars >= 50},
  {id:'stars100',    icon:'💯', name:'١٠٠ نجمة',           when:p => p.stars >= 100},
  {id:'first_surah', icon:'📖', name:'أول سورة',           when:p => Object.keys(p.quran||{}).length >= 1},
  {id:'num_master',  icon:'🔢', name:'إتقان الأرقام',      when:p => (p.best.counting||0) >= 2 && (p.best.chooseNumber||0) >= 2},
  {id:'add_master',  icon:'➕', name:'إتقان الجمع',         when:p => (p.best.addition||0) >= 2},
  {id:'sub_master',  icon:'➖', name:'إتقان الطرح',         when:p => (p.best.subtraction||0) >= 2},
  {id:'ar_letters',  icon:'🔤', name:'إتقان الحروف',       when:p => ((p.learn||{}).ar_learn||[]).length >= 28},
  {id:'en_words10',  icon:'🇬🇧', name:'أول ١٠ كلمات English', when:p => ((p.learn||{}).en_learn||[]).length >= 10},
  {id:'quran5',      icon:'🕌', name:'٥ أنشطة قرآن',        when:p => Object.keys(p.quran||{}).length >= 5}
];

const Rewards = {
  earned(){ return Progress.get().achievements || []; },
  check(){
    const p = Progress.get();
    p.achievements = p.achievements || [];
    const fresh = BADGES.filter(b => !p.achievements.includes(b.id) && b.when(p));
    if(!fresh.length) return [];
    fresh.forEach(b => p.achievements.push(b.id));
    Progress.save();
    fresh.forEach((b,i) => setTimeout(() => this.toast(b), i * 1800));
    return fresh;
  },
  toast(b){
    const t = document.createElement('div');
    t.className = 'badge-toast';
    t.innerHTML = `<span class="bi">${b.icon}</span><span><b>إنجاز جديد!</b><br>${b.name}</span>`;
    document.body.appendChild(t);
    Audio_.win();
    Audio_.speak(`إنجاز جديد! ${b.name}`);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 500); }, 3200);
  },
  screen(){
    const got = this.earned();
    document.getElementById('screen').innerHTML = `
      <div class="qcard">
        <h2 class="center" style="margin:0 0 4px">🏆 إنجازاتي</h2>
        <div class="order-hint">${ar(got.length)} من ${ar(BADGES.length)}</div>
        <div class="badges">
          ${BADGES.map(b => `<div class="badge ${got.includes(b.id)?'got':''}">
             <span class="bi">${got.includes(b.id) ? b.icon : '🔒'}</span>
             <span class="bn">${b.name}</span></div>`).join('')}
        </div>
      </div>`;
  }
};
