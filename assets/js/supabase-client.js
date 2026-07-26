/* ============================================================
   OCHRE MOROCCO — Supabase Client
   ملف مشترك يُستدعى من جميع الصفحات بعد تحميل مكتبة supabase-js
   ============================================================ */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://zuwvqoxurgwjyjgtnlmm.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_fXNJdsJcuVQyq_u2BXOZwQ_6pg295dS';

  if (typeof window.supabase === 'undefined') {
    console.warn('[supabase-client] مكتبة Supabase غير محملة بعد. تأكد من تحميل CDN أولاً.');
    return;
  }

  try {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('[supabase-client] خطأ في تهيئة العميل:', e);
  }
})();
