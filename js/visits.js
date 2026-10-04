/* ============================================================
   js/visits.js — عدّاد زيارات الموقع المنشور
   ------------------------------------------------------------
   الزيادة بطلب صورة (مش محتاج CORS) مرة واحدة لكل جهاز/جلسة.
   القراءة من أكتر من مصدر عشان الرقم يبان حتى من الملف المحلي.
   ============================================================ */
const Visits = (() => {
  const NS = 'MahmoudRabea93', KEY = 'rehlati';
  const CACHE = 'rehlati.visits.total';
  const PINGED = 'rehlati.visits.pinged';
  const abacus = action => `https://abacus.jasoncameron.dev/${action}/${NS}/${KEY}?t=${Date.now()}`;
  const hitsJson = () => `https://hits.sh/mahmoudrabea93.github.io/rehlati.json?t=${Date.now()}`;
  const hitsSvg  = () => `https://hits.sh/mahmoudrabea93.github.io/rehlati.svg?t=${Date.now()}`;
  const proxy = u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`;

  const hosted = () => {
    const h = location.hostname || '';
    if(location.protocol === 'file:' || !h) return false;
    if(h === 'localhost' || h === '127.0.0.1') return false;
    return true;
  };

  let total = 0;
  try{ total = Number(localStorage.getItem(CACHE)) || 0; }catch(e){}

  function save(n){
    n = Number(n);
    if(!isFinite(n) || n < 0) return total;
    total = n;
    try{ localStorage.setItem(CACHE, String(n)); }catch(e){}
    return n;
  }

  function beacon(src){
    try{ const i = new Image(); i.referrerPolicy = 'no-referrer'; i.src = src; }catch(e){}
  }

  function json(u){
    return fetch(u, {mode:'cors', cache:'no-store'}).then(r => {
      if(!r.ok) throw new Error('http');
      return r.json();
    });
  }

  function pick(j){
    if(j == null) return null;
    const n = Number(j.value ?? j.hits ?? j.count ?? j.total);
    return isFinite(n) ? n : null;
  }

  function read(){
    return json(abacus('get'))
      .then(pick)
      .catch(() => json(proxy(abacus('get'))).then(pick))
      .catch(() => json(hitsJson()).then(pick))
      .catch(() => json(proxy(hitsJson())).then(pick))
      .then(n => n == null ? total : save(n));
  }

  function ping(){
    if(hosted()){
      let first = true;
      try{
        if(sessionStorage.getItem(PINGED)) first = false;
        else sessionStorage.setItem(PINGED, '1');
      }catch(e){}
      if(first){
        /* طلب صورة بيوصل للسيرفر حتى لو fetch متعطّل */
        beacon(abacus('hit'));
        beacon(hitsSvg());
      }
    }
    return Promise.race([
      read(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))
    ]).catch(() => total);
  }

  return {ping, get:() => total, live: hosted};
})();
