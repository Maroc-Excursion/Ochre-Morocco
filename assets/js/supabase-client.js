/* ============================================================
   OCHRE MOROCCO — Supabase Client
   ملف مشترك يُستدعى من جميع الصفحات بعد تحميل مكتبة supabase-js
   ============================================================ */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://zuwvqoxurgwjyjgtnlmm.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1d3Zxb3h1cmd3anlqZ3RubG1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjA0OTYsImV4cCI6MjEwMDU5NjQ5Nn0.TJNM2ywcsGVNOKy9sVyr-OKXaA4OAZ5fG3dTFApixgQ';

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
