/* Ochre Morocco — public Supabase client
 * This file intentionally contains only the publishable/anon key.
 * Database and Storage security is enforced by Supabase RLS policies.
 */
(function (window) {
  'use strict';

  var SUPABASE_URL = 'https://zuwvqoxurgwjyjgtnlmm.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_fXNJdsJcuVQyq_u2BXOZwQ_6pg295dS';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[Ochre] Supabase CDN did not load.');
    return;
  }

  window.ochreSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  window.OchreSupabase = {
    client: window.ochreSupabase,
    imageUrl: function (path) {
      if (!path) return '';
      if (/^https?:\/\//i.test(path)) return path;
      if (/^(?:\.\/)?assets\//i.test(path)) return path.replace(/^\.\/+/, '');
      return window.ochreSupabase.storage.from('excursion-images').getPublicUrl(path).data.publicUrl;
    },
    slugify: function (value) {
      return String(value || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || ('excursion-' + Date.now());
    }
  };
})(window);