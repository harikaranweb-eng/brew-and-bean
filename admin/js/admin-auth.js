/* ===================================================
   BREW & BEAN — Admin Authentication & Security Guard
   Enforces:
   - Supabase Auth email/password login
   - Verification against admin_profiles table
   - Only users with role = 'admin' are permitted
   - Automatic logout and redirection for unauthorized access
   - Session protection on all admin views
   =================================================== */

/**
 * Perform Admin Login via Supabase Auth
 * Strictly checks user role against admin_profiles table.
 */
async function loginAdmin(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase client not initialized.");

  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (authError) {
    throw new Error(authError.message || "Invalid email or password.");
  }

  const user = authData.user;
  if (!user) throw new Error("Authentication failed. No user returned.");

  // 2. Strict role check: Verify ID against admin_profiles table
  const { data: profile, error: profileError } = await sb
    .from('admin_profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    await sb.auth.signOut();
    throw new Error("Security verification error: Unable to verify administrator role. " + profileError.message);
  }

  // 3. Allow access ONLY if the user's role is 'admin' (or 'superadmin')
  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    await sb.auth.signOut();
    throw new Error("Access denied: You do not have administrator permissions.");
  }

  return { user, profile };
}

/**
 * Protect admin pages by checking authenticated session and admin role.
 * Redirects unauthorized users to the admin login page and signs them out.
 */
async function requireAdminAuth() {
  const sb = getSupabase();
  if (!sb) {
    window.location.href = 'login.html';
    return null;
  }

  // 1. Check if user is authenticated with Supabase
  const { data: { session }, error: sessionError } = await sb.auth.getSession();
  if (sessionError || !session || !session.user) {
    window.location.href = 'login.html';
    return null;
  }

  const user = session.user;

  // 2. Check role against admin_profiles table
  const { data: profile, error: profileError } = await sb
    .from('admin_profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle();

  // 3. Deny access if not found in admin_profiles or role is not admin
  if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    console.warn("Unauthorized admin access detected. Terminating session.");
    await sb.auth.signOut();
    window.location.href = 'login.html?error=unauthorized';
    return null;
  }

  // 4. Populate header / sidebar UI elements with verified admin profile data
  const emailEl = document.getElementById('admin-email');
  const roleEl = document.getElementById('admin-role');
  const avatarEl = document.getElementById('admin-avatar');

  if (emailEl) emailEl.textContent = profile.email || user.email || 'Admin';
  if (roleEl) roleEl.textContent = 'Administrator';
  if (avatarEl) avatarEl.textContent = (user.email ? user.email[0].toUpperCase() : 'A');

  return { user, profile };
}

/**
 * Check if already logged in as admin (used on login.html).
 * Redirects authorized admins directly to dashboard.html.
 */
async function redirectIfLoggedIn() {
  const sb = getSupabase();
  if (!sb) return;

  const { data: { session } } = await sb.auth.getSession();
  if (session && session.user) {
    const { data: profile } = await sb
      .from('admin_profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
      window.location.href = 'dashboard.html';
    } else {
      // If signed in but not an admin, sign out immediately
      await sb.auth.signOut();
    }
  }
}

/**
 * Admin Logout
 * Signs out from Supabase and redirects to login.html.
 */
async function logoutAdmin() {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch (e) {
      console.warn("SignOut note:", e);
    }
  }
  window.location.href = 'login.html';
}
