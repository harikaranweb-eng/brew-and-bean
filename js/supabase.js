/* ===================================================
   BREW & BEAN — Centralized Supabase Configuration
   =================================================== */

// Supabase Project Credentials (Only Publishable/Anon Key in Frontend)
const SUPABASE_CONFIG = {
  url: "https://szjrhlxsghjwxapjnmvj.supabase.co",
  anonKey: "sb_publishable_OoxS1p90-MIoXDpQbE9LKg_BvhkEcHi"
};

let _supabaseClient = null;

/**
 * Initializes and returns the Supabase JavaScript client
 */
function getSupabase() {
  if (_supabaseClient) return _supabaseClient;

  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    _supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return _supabaseClient;
  }

  console.warn("Supabase JS SDK is not loaded yet. Make sure to include @supabase/supabase-js in HTML.");
  return null;
}

// Auto-initialize when window loads
window.addEventListener('DOMContentLoaded', () => {
  getSupabase();
});

