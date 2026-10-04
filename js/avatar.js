/* ============================================================
   js/avatar.js — صورة الطفل
   ------------------------------------------------------------
   الصورة بتتصغّر في المتصفح قبل ما تتخزّن، وبتتحفظ في مفتاح
   مستقل عن ملف التقدّم — عشان لو التخزين امتلأ، تقدّم الطفل
   يفضل محفوظ ومتأثرش.
   الصورة بتفضل على الجهاز بس، ومابتترفعش لأي مكان.
   ============================================================ */
/* الصورة الافتراضية — بتظهر لحد ما ولي الأمر يحط صورة الطفل */
const DEFAULT_PHOTO = 'data:image/jpeg;base64,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';

const Avatar = (() => {
  const KEY = 'rehlati.photo.v1';
  let cached = null, loaded = false;

  function get(){
    if(!loaded){
      try{ cached = localStorage.getItem(KEY); }catch(e){ cached = null; }
      loaded = true;
    }
    return cached;
  }

  function store(data){
    try{ localStorage.setItem(KEY, data); cached = data; return true; }
    catch(e){ return false; }
  }

  function clear(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    cached = null;
    return true;
  }

  /* قص مربّع من النص + تصغير — عشان الصورة تبقى عشرات الكيلوبايت مش ميجات */
  function shrink(file, size){
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try{
          const s = Math.min(img.width, img.height);
          const c = document.createElement('canvas');
          c.width = c.height = size;
          const cx = c.getContext('2d');
          cx.drawImage(img, (img.width - s)/2, (img.height - s)/2, s, s, 0, 0, size, size);
          URL.revokeObjectURL(url);
          res(c.toDataURL('image/jpeg', .82));
        }catch(e){ URL.revokeObjectURL(url); rej(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('الملف ده مش صورة')); };
      img.src = url;
    });
  }

  /* يفتح معرض الصور أو الكاميرا، ويرجّع true لو اتخزّنت */
  function pick(onDone){
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      inp.remove();
      if(!f) return;
      if(!/^image\//.test(f.type)) return onDone(false, 'لازم تختار صورة');
      try{
        /* لو التخزين رفض، نجرّب مقاسات أصغر قبل ما نستسلم */
        for(const size of [256, 192, 128]){
          const data = await shrink(f, size);
          if(store(data)) return onDone(true);
        }
        onDone(false, 'مساحة التخزين في المتصفح ممتلئة');
      }catch(e){ onDone(false, e.message || 'مش قادر أقرا الصورة'); }
    };
    inp.click();
  }

  /* المصدر المعروض: صورة الطفل لو موجودة، وإلا الافتراضية */
  const src = () => get() || DEFAULT_PHOTO;
  const isCustom = () => !!get();

  function html(cls){
    return `<span class="avatar ${cls||''} ${isCustom()?'':'fallback'}"><img src="${src()}" alt=""></span>`;
  }

  /* الحجم التقريبي بالكيلوبايت — بيظهر لولي الأمر */
  function sizeKB(){
    const p = get();
    return p ? Math.round(p.length * 0.75 / 1024) : 0;
  }

  return {get, src, isCustom, pick, clear, html, sizeKB};
})();
