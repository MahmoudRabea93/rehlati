/* ============================================================
   js/visits.js — عدّاد زيارات الموقع المنشور
   ------------------------------------------------------------
   الزيادة: مرة واحدة لكل جلسة، وعلى github.io بس.
   القراءة: من أي مكان (محلي أو منشور) عشان المطوّر يشوف الرقم.
   مفيش اسم ولا صورة بتتبعت — فتحة بس.
   ============================================================ */
const Visits = (() => {
  const NS = 'MahmoudRabea93';
  const KEY = 'rehlati';
  const CACHE = 'rehlati.visits.total';
  const PINGED = 'rehlati.visits.pinged';
  const url = action => `https://abacus.jasoncameron.dev/${action}/${NS}/${KEY}`;
  const LIVE = () => /github\.io$/i.test(location.hostname);

  let total = 0;
  try{ total = Number(localStorage.getItem(CACHE)) || 0; }catch(e){}

  function save(n){
    total = n;
    try{ localStorage.setItem(CACHE, String(n)); }catch(e){}
    return n;
  }

  function parse(j){
    const n = Number(j && j.value);
    return isFinite(n) ? save(n) : total;
  }

  function api(action){
    return fetch(url(action), {mode:'cors'})
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(parse);
  }

  function ping(){
    let hit = false;
    if(LIVE()){
      try{
        if(!sessionStorage.getItem(PINGED)){
          sessionStorage.setItem(PINGED, '1');
          hit = true;
        }
      }catch(e){ hit = true; }
    }
    return api(hit ? 'hit' : 'get').catch(() => total);
  }

  return {ping, get:() => total, live: LIVE};
})();
