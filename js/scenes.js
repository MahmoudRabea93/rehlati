/* ============================================================
   js/scenes.js — مشاهد العوالم
   رسومات SVG مرسومة بالكامل هنا (مفيش إيموجي ولا صور خارجية):
   قطر بيمشي، قطة بتتمشى، عربية، بالونات، سحاب، شمس.
   ============================================================ */
const Art = {

  sun(){
    return `<svg class="art sun" viewBox="0 0 120 120" aria-hidden="true">
      <g class="rays" stroke="#FFCF4A" stroke-width="7" stroke-linecap="round">
        ${[...Array(8)].map((_,i)=>{
          const a = i*Math.PI/4, c = 60;
          return `<line x1="${c+Math.cos(a)*40}" y1="${c+Math.sin(a)*40}"
                        x2="${c+Math.cos(a)*54}" y2="${c+Math.sin(a)*54}"/>`;
        }).join('')}
      </g>
      <circle cx="60" cy="60" r="32" fill="#FFD95E"/>
      <circle cx="50" cy="55" r="3.6" fill="#E09B00"/>
      <circle cx="70" cy="55" r="3.6" fill="#E09B00"/>
      <path d="M50 68 q10 9 20 0" stroke="#E09B00" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    </svg>`;
  },

  cloud(){
    return `<svg class="art" viewBox="0 0 130 56" aria-hidden="true">
      <g fill="#fff">
        <ellipse cx="36" cy="34" rx="26" ry="17"/>
        <ellipse cx="66" cy="26" rx="23" ry="21"/>
        <ellipse cx="95" cy="35" rx="20" ry="15"/>
        <rect x="18" y="33" width="92" height="17" rx="8.5"/>
      </g>
    </svg>`;
  },

  /* بالونة بحرف أو رقم جواها */
  balloon(ch, color){
    return `<svg class="art" viewBox="0 0 64 104" aria-hidden="true">
      <ellipse cx="32" cy="33" rx="25" ry="30" fill="${color}"/>
      <ellipse cx="23" cy="23" rx="7" ry="10" fill="#fff" opacity=".35"/>
      <path d="M32 62 l-6 9 h12 z" fill="${color}"/>
      <path d="M32 71 q8 12 0 24" stroke="#ffffffcc" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <text x="32" y="43" text-anchor="middle" font-size="27" font-weight="800"
            fill="#fff" font-family="inherit">${ch}</text>
    </svg>`;
  },

  /* قطر بعربيات فيها أرقام */
  train(wagons, colors){
    const wagon = (x, ch, c) => `
      <g transform="translate(${x},0)">
        <rect x="0" y="30" width="46" height="34" rx="9" fill="${c}"/>
        <text x="23" y="56" text-anchor="middle" font-size="24" font-weight="800"
              fill="#fff" font-family="inherit">${ch}</text>
        <g class="wheel"><circle cx="12" cy="70" r="9" fill="#3B4A63"/><circle cx="12" cy="70" r="3.2" fill="#C9D6E8"/></g>
        <g class="wheel"><circle cx="34" cy="70" r="9" fill="#3B4A63"/><circle cx="34" cy="70" r="3.2" fill="#C9D6E8"/></g>
        <rect x="-8" y="52" width="10" height="5" rx="2.5" fill="#6B7A94"/>
      </g>`;
    return `<svg class="art" viewBox="0 0 ${80 + wagons.length*54} 86" aria-hidden="true">
      ${wagons.map((w,i) => wagon(i*54, w, colors[i % colors.length])).join('')}
      <g transform="translate(${wagons.length*54},0)">
        <rect x="0" y="22" width="56" height="42" rx="10" fill="#E8564F"/>
        <rect x="30" y="4" width="24" height="24" rx="7" fill="#C7403A"/>
        <rect x="35" y="9" width="14" height="12" rx="4" fill="#BFE3FF"/>
        <rect x="6" y="2" width="13" height="22" rx="5" fill="#C7403A"/>
        <circle class="puff p1" cx="12" cy="-2" r="7" fill="#ffffffcc"/>
        <circle class="puff p2" cx="12" cy="-2" r="6" fill="#ffffffaa"/>
        <circle class="puff p3" cx="12" cy="-2" r="5" fill="#ffffff88"/>
        <g class="wheel"><circle cx="14" cy="70" r="11" fill="#3B4A63"/><circle cx="14" cy="70" r="4" fill="#C9D6E8"/></g>
        <g class="wheel"><circle cx="42" cy="70" r="11" fill="#3B4A63"/><circle cx="42" cy="70" r="4" fill="#C9D6E8"/></g>
      </g>
    </svg>`;
  },

  /* قطة بتتمشى وديلها بيتحرك */
  cat(){
    return `<svg class="art" viewBox="0 0 110 80" aria-hidden="true">
      <path class="tail" d="M28 50 q-20 0 -18 -18 q1 -11 11 -9"
            stroke="#E8973A" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="54" cy="52" rx="30" ry="18" fill="#F7AE4A"/>
      <g class="legs">
        <rect x="36" y="63" width="8" height="14" rx="4" fill="#E8973A"/>
        <rect x="64" y="63" width="8" height="14" rx="4" fill="#E8973A"/>
      </g>
      <rect x="48" y="63" width="8" height="14" rx="4" fill="#F7AE4A"/>
      <circle cx="86" cy="36" r="19" fill="#FBB85C"/>
      <path d="M72 23 l-2 -14 l13 7 z" fill="#FBB85C"/>
      <path d="M100 23 l3 -14 l-13 7 z" fill="#FBB85C"/>
      <path d="M74 22 l-1 -8 l7 4 z" fill="#F08C94"/>
      <path d="M98 22 l2 -8 l-7 4 z" fill="#F08C94"/>
      <circle cx="79" cy="34" r="3.4" fill="#36405A"/>
      <circle cx="93" cy="34" r="3.4" fill="#36405A"/>
      <path d="M86 41 l-4 3 h8 z" fill="#F08C94"/>
      <path d="M86 44 q-5 5 -9 1 M86 44 q5 5 9 1" stroke="#36405A" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },

  /* عربية صغيرة */
  car(){
    return `<svg class="art" viewBox="0 0 140 76" aria-hidden="true">
      <path d="M12 52 q0 -14 14 -14 l12 0 q10 -16 28 -16 l16 0 q14 0 20 16 l14 0 q14 0 14 14 l0 6 q0 6 -6 6 l-106 0 q-6 0 -6 -6 z"
            fill="#4CB8FF"/>
      <path d="M50 38 q8 -12 18 -12 l10 0 l0 12 z" fill="#CFEBFF"/>
      <path d="M84 26 q10 0 15 12 l-15 0 z" fill="#CFEBFF"/>
      <circle cx="40" cy="38" r="5" fill="#FFE08A"/>
      <g class="wheel"><circle cx="40" cy="64" r="12" fill="#3B4A63"/><circle cx="40" cy="64" r="4.5" fill="#D7E3F2"/></g>
      <g class="wheel"><circle cx="104" cy="64" r="12" fill="#3B4A63"/><circle cx="104" cy="64" r="4.5" fill="#D7E3F2"/></g>
    </svg>`;
  },

  /* طيارة ورق */
  kite(){
    return `<svg class="art" viewBox="0 0 70 130" aria-hidden="true">
      <path d="M35 4 L62 40 L35 78 L8 40 Z" fill="#FF7A59"/>
      <path d="M35 4 L35 78 M8 40 L62 40" stroke="#ffffff99" stroke-width="2.5"/>
      <path d="M35 78 q10 16 -4 26 q-12 10 2 22" stroke="#FFC43D" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M28 92 l14 0 M24 108 l14 0" stroke="#2FC9B4" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
  },

  /* تلال خضرا في الأفق */
  hills(c1, c2){
    return `<svg class="art hills" viewBox="0 0 400 110" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 58 q60 -34 120 -4 q55 27 110 -8 q60 -38 170 8 L400 110 L0 110 Z" fill="${c2}"/>
      <path d="M0 80 q70 -26 140 2 q70 28 140 -4 q60 -26 120 6 L400 110 L0 110 Z" fill="${c1}"/>
    </svg>`;
  }
};

/* ---------- تركيب مشهد كل عالم ---------- */
const WORLD_SCENES = {
  math: {
    sky:['#8FD6FF','#D8F1FF'], hills:['#63C96A','#8ADB7E'],
    build: () => `
      ${Art.sun()}
      <span class="drift c1">${Art.cloud()}</span>
      <span class="drift c2">${Art.cloud()}</span>
      <span class="drift c3">${Art.cloud()}</span>
      <span class="floaty f1">${Art.balloon('٤','#FF6B6B')}</span>
      <span class="floaty f2">${Art.balloon('٧','#7A5CFF')}</span>
      <span class="floaty f3">${Art.balloon('٩','#2FC9B4')}</span>
      <span class="rider train">${Art.train(['١','٢','٣'], ['#FFC43D','#2FC9B4','#7A5CFF'])}</span>`
  },
  arabic: {
    sky:['#FFC98A','#FFF0D6'], hills:['#5FC46B','#86D77C'],
    build: () => `
      ${Art.sun()}
      <span class="drift c1">${Art.cloud()}</span>
      <span class="drift c2">${Art.cloud()}</span>
      <span class="floaty f1">${Art.balloon('أ','#FF9F1C')}</span>
      <span class="floaty f2">${Art.balloon('ب','#E8564F')}</span>
      <span class="floaty f3">${Art.balloon('ت','#7A5CFF')}</span>
      <span class="swinger">${Art.kite()}</span>
      <span class="rider cat">${Art.cat()}</span>`
  },
  english: {
    sky:['#9FD8FF','#E6F6FF'], hills:['#5BBF8E','#84D6A6'],
    build: () => `
      ${Art.sun()}
      <span class="drift c1">${Art.cloud()}</span>
      <span class="drift c2">${Art.cloud()}</span>
      <span class="drift c3">${Art.cloud()}</span>
      <span class="floaty f1">${Art.balloon('A','#4CB8FF')}</span>
      <span class="floaty f2">${Art.balloon('b','#FF6B6B')}</span>
      <span class="floaty f3">${Art.balloon('C','#FFC43D')}</span>
      <span class="rider car">${Art.car()}</span>`
  },
  /* عالم الألعاب: سما مليانة بالونات ملوّنة */
  games: {
    sky:['#FFD9E2','#FFF4E6'], hills:['#4CC9A7','#7FE0C2'],
    build: () => `
      ${Art.sun()}
      <span class="drift c1">${Art.cloud()}</span>
      <span class="drift c3">${Art.cloud()}</span>
      <span class="floaty f1">${Art.balloon('٧','#FF6B6B')}</span>
      <span class="floaty f2">${Art.balloon('٣','#4CC9A7')}</span>
      <span class="floaty f3">${Art.balloon('٥','#4C9BFF')}</span>`
  }
};

function worldScene(world){
  const s = WORLD_SCENES[world];
  if(!s) return '';
  return `<div class="wscene" aria-hidden="true"
            style="background:linear-gradient(180deg, ${s.sky[0]} 0%, ${s.sky[1]} 62%, ${s.sky[1]} 100%)">
      ${s.build()}
      ${Art.hills(s.hills[0], s.hills[1])}
    </div>`;
}
