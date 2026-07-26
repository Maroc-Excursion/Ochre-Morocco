/*
 * Ochre Morocco — public Supabase client
 *
 * This file intentionally contains only the Supabase anon key.
 * The anon key is designed for browser use; database and storage access
 * must be protected by Supabase RLS policies.
 */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://zuwvqoxurgwjyjgtnlmm.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_fXNJdsJcuVQyq_u2BXOZwQ_6pg295dS';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    window.supabaseClientError = 'The Supabase library could not be loaded.';
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
})();