/* ============================================================
   js/config.js — إعدادات عالم القرآن
   ------------------------------------------------------------
   كل مصادر النص والتلاوة متجمّعة هنا. لتغيير المصدر غيّر قيمة
   textSource أو reciter فقط — مفيش أي نص قرآني مكتوب داخل الكود،
   النص بيتجاب من المصدر الموثوق وقت التشغيل ويتخزّن محليًا.
   ============================================================ */
const QURAN_CONFIG = {

  /* نطاق السور المعروضة — جزء تبارك (٦٧) + جزء عمّ (٧٨) إلى الناس (١١٤) */
  range: { from: 67, to: 114 },
  /* ترتيب العرض: من الناس للأصغر — السور القصيرة الأول (ترتيب الحفظ المعتاد) */
  order: 'desc',
  /* اسم الجزء حسب رقم السورة — بيظهر كعنوان فاصل في قائمة السور */
  juzOf: n => n >= 78 ? 'جزء عمّ' : 'جزء تبارك',
  rangeTitle: 'جزء عمّ وتبارك',

  /* ---------- مصدر النص ---------- */
  /* القيمة المستخدمة حاليًا: مفتاح من sources بالأسفل */
  textSource: 'quran.com',

  sources: {
    'quran.com': {
      label: 'Quran.com API v4 — النص العثماني (مجمع الملك فهد)',
      chaptersUrl: 'https://api.quran.com/api/v4/chapters?language=ar',
      versesUrl: n => `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${n}`,
      parseChapters: j => (j.chapters || []).map(c => ({
        number: c.id, name: c.name_arabic, ayahs: c.verses_count
      })),
      parseVerses: j => (j.verses || []).map(v => ({
        number: Number(String(v.verse_key).split(':')[1]), text: v.text_uthmani
      }))
    },

    'alquran.cloud': {
      label: 'AlQuran Cloud — النص العثماني (مشروع تنزيل)',
      chaptersUrl: 'https://api.alquran.cloud/v1/surah',
      versesUrl: n => `https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`,
      parseChapters: j => (j.data || []).map(c => ({
        number: c.number, name: c.name, ayahs: c.numberOfAyahs
      })),
      parseVerses: j => ((j.data && j.data.ayahs) || []).map(a => ({
        number: a.numberInSurah, text: a.text
      }))
    }
  },

  /* ---------- التلاوة ---------- */
  /* تلاوات مرتّلة معروفة ومعتمدة فقط */
  reciter: 'husary',

  reciters: {
    husary: {
      label: 'الشيخ محمود خليل الحصري',
      folder: 'Husary_128kbps'
    },
    abdulbasit: {
      label: 'الشيخ عبد الباسط عبد الصمد (مرتّل)',
      folder: 'Abdul_Basit_Murattal_192kbps'
    },
    minshawy: {
      label: 'الشيخ محمد صديق المنشاوي (مرتّل)',
      folder: 'Minshawy_Murattal_128kbps'
    },
    /* نسخ "المعلّم": الشيخ بيقرأ والأطفال بيرددوا وراه — الأنسب لتعليم الترديد */
    minshawy_teacher: {
      label: 'المنشاوي — المعلّم (مع ترديد الأطفال)',
      folder: 'Minshawy_Teacher_128kbps',
      teacher: true
    },
    husary_muallim: {
      label: 'الحصري — المعلّم (مع الترديد)',
      folder: 'Husary_Muallim_128kbps',
      teacher: true
    }
  },

  /* القارئ المستخدم في وضع الترديد تحديدًا */
  repeatReciter: 'minshawy_teacher',

  /* رابط تلاوة آية واحدة — الصيغة القياسية لموقع everyayah */
  ayahAudioUrl: (folder, surah, ayah) =>
    `https://everyayah.com/data/${folder}/${String(surah).padStart(3,'0')}${String(ayah).padStart(3,'0')}.mp3`,

  /* ---------- التخزين المحلي ---------- */
  /* بعد أول تحميل ناجح بيشتغل القسم من غير إنترنت */
  cacheKey: 'rehlati.quran.text.v1',

  /* غيّرها لو عايز تمسح الكاش وتعيد التحميل من المصدر */
  cacheVersion: 2
};
