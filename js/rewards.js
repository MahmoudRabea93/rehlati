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

/* ============================================================
   مراحل تقدّم الطفل — كؤوس بتتفتح بالنجوم المجمّعة
   كل مرحلة ليها كأس واسم ولون، والطفل بيشوف الكأس الجاي
   والنجوم الفاضلة عليه — ده أقوى محفّز بعد السلسلة اليومية.
   لزيادة مرحلة: ضيف سطر هنا وبس.
   ============================================================ */
const RANKS = [
  {id:'egg',      icon:'🥚', name:'مبتدئ',        at:0,    color:'#A9B4C2'},
  {id:'bronze',   icon:'🥉', name:'كأس برونزي',   at:50,   color:'#C97B3C'},
  {id:'silver',   icon:'🥈', name:'كأس فضي',      at:150,  color:'#9AA7B4'},
  {id:'gold',     icon:'🏆', name:'كأس ذهبي',     at:350,  color:'#E0A400'},
  {id:'platinum', icon:'🥇', name:'كأس بلاتيني',  at:650,  color:'#5FA8C7'},
  {id:'diamond',  icon:'💎', name:'كأس ماسي',     at:1000, color:'#3FC2D6'},
  {id:'crown',    icon:'👑', name:'بطل الأبطال',  at:1500, color:'#8B5CF6'}
];

const Rewards = {
  /* ---------- المراحل والكؤوس ---------- */
  RANKS,
  rankIndex(stars){
    const s = stars === undefined ? Progress.get().stars : stars;
    let i = 0;
    RANKS.forEach((r, k) => { if(s >= r.at) i = k; });
    return i;
  },
  rank(){ return RANKS[this.rankIndex()]; },
  nextRank(){ return RANKS[this.rankIndex() + 1] || null; },
  /* نسبة التقدّم ناحية الكأس الجاي */
  rankPct(){
    const i = this.rankIndex(), nx = RANKS[i + 1];
    if(!nx) return 100;
    const from = RANKS[i].at, s = Progress.get().stars;
    return Math.max(0, Math.min(100, Math.round((s - from) / (nx.at - from) * 100)));
  },
  starsToNext(){
    const nx = this.nextRank();
    return nx ? Math.max(0, nx.at - Progress.get().stars) : 0;
  },
  /* ترقية؟ بتتنادى بعد كل جولة — بتحتفل مرة واحدة لكل كأس */
  rankCheck(){
    const p = Progress.get();
    const now = this.rankIndex();
    /* أول مرة: بنسجّل المرحلة الحالية من غير احتفال (عشان التقدّم القديم) */
    if(p.rankSeen === undefined){ p.rankSeen = now; Progress.save(); return null; }
    if(now <= p.rankSeen) return null;
    p.rankSeen = now; Progress.save();
    const r = RANKS[now];
    setTimeout(() => this.rankToast(r), 900);
    return r;
  },
  rankToast(r){
    const t = document.createElement('div');
    t.className = 'rank-toast';
    t.style.setProperty('--rc', r.color);
    t.innerHTML = `<span class="bi">${r.icon}</span><span><b>مرحلة جديدة!</b><br>${r.name}</span>`;
    document.body.appendChild(t);
    Audio_.win();
    if(UI && UI.confetti) UI.confetti(80);
    Audio_.speak(`مبروك! وصلت ${r.name}`);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 500); }, 4200);
  },
  /* شريط الكأس — بيتحط في الرئيسية وفي لوحة ولي الأمر */
  rankBar(){
    const r = this.rank(), nx = this.nextRank(), pct = this.rankPct();
    return `
      <div class="rankbar" style="--rc:${r.color}">
        <span class="rkcup">${r.icon}</span>
        <span class="rkmeta">
          <span class="rkname">${r.name}</span>
          <span class="rkbar"><i style="width:${pct}%"></i></span>
          <span class="rknote">${nx
            ? `فاضل ${ar(this.starsToNext())} نجمة على ${nx.icon} ${nx.name}`
            : 'وصلت لأعلى مرحلة — ما شاء الله 🎉'}</span>
        </span>
      </div>`;
  },

  earned(){ return Progress.get().achievements || []; },
  check(){
    const p = Progress.get();
    p.achievements = p.achievements || [];
    this.rankCheck();
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
        ${this.rankBar()}
        <h3 style="margin:16px 0 6px">🏅 مراحل التقدّم</h3>
        <div class="cups">
          ${RANKS.map((r, i) => `<div class="cup ${i <= this.rankIndex() ? 'got' : ''}" style="--rc:${r.color}">
            <span class="ci">${i <= this.rankIndex() ? r.icon : '🔒'}</span>
            <span class="cn">${r.name}</span>
            <span class="cs">${ar(r.at)} ⭐</span>
          </div>`).join('')}
        </div>
        <h3 style="margin:18px 0 6px">⭐ الإنجازات</h3>
        <div class="order-hint">${ar(got.length)} من ${ar(BADGES.length)}</div>
        <div class="badges">
          ${BADGES.map(b => `<div class="badge ${got.includes(b.id)?'got':''}">
             <span class="bi">${got.includes(b.id) ? b.icon : '🔒'}</span>
             <span class="bn">${b.name}</span></div>`).join('')}
        </div>
      </div>`;
  }
};

/* نسجّل الموديول على window عشان المحرك يلاقيه (const مابيتسجّلش تلقائيًا) */
window.Rewards = Rewards;
