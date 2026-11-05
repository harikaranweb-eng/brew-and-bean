/* ===================================================
   BREW & BEAN — Customer Authentication & Profile Service
   Separate from Admin Authentication (Isolated)
   =================================================== */

/**
 * Get current authenticated customer session and profile
 */
async function getCurrentCustomer() {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (sessionError || !session || !session.user) return null;

    const user = session.user;

    // Fetch customer profile
    const { data: profile, error: profError } = await sb
      .from('customer_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profError) {
      console.warn('Customer profile fetch note:', profError.message);
    }

    return {
      user,
      profile: profile || {
        full_name: user.user_metadata?.full_name || 'Coffee Lover',
        email: user.email,
        phone: user.user_metadata?.phone || ''
      }
    };
  } catch (err) {
    console.error('Error fetching customer session:', err);
    return null;
  }
}

/**
 * Customer Registration
 */
async function customerRegister(fullName, email, phone, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Database client not available.");

  // 1. Register with Supabase Auth
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const cleanName = fullName.trim();

  const { data: authData, error: authError } = await sb.auth.signUp({
    email: cleanEmail,
    password: password,
    options: {
      data: {
        full_name: cleanName,
        phone: cleanPhone
      }
    }
  });

  if (authError) {
    throw new Error(authError.message || "Registration failed. Please try again.");
  }

  const user = authData.user;
  if (!user) {
    throw new Error("Registration completed. Please check your email to confirm your account.");
  }

  // 2. Create customer profile record
  try {
    const { error: profileError } = await sb
      .from('customer_profiles')
      .upsert({
        id: user.id,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.warn("Profile creation note:", profileError.message);
    }
  } catch (e) {
    console.warn("Profile upsert note:", e);
  }

  return user;
}

/**
 * Customer Login
 */
async function customerLogin(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Database client not available.");

  const { data: authData, error: authError } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password
  });

  if (authError) {
    throw new Error(authError.message || "Invalid email or password.");
  }

  const user = authData.user;
  if (!user) throw new Error("Login failed. No account returned.");

  // Ensure customer profile exists
  try {
    const { data: existingProfile } = await sb
      .from('customer_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      await sb.from('customer_profiles').insert([{
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Coffee Lover',
        email: user.email,
        phone: user.user_metadata?.phone || ''
      }]);
    }
  } catch (e) {
    console.warn("Profile auto-sync note:", e);
  }

  return user;
}

/**
 * Customer Logout
 */
async function customerLogout() {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch (e) {
      console.warn("Sign out note:", e);
    }
  }
  window.location.href = 'index.html';
}

/**
 * Update Customer Profile
 */
async function customerUpdateProfile(fullName, phone) {
  const sb = getSupabase();
  if (!sb) throw new Error("Database client not available.");

  const { data: { session } } = await sb.auth.getSession();
  if (!session || !session.user) throw new Error("You must be logged in to update your profile.");

  const cleanName = fullName.trim();
  const cleanPhone = phone.trim();

  // 1. Update customer_profiles table
  const { error } = await sb
    .from('customer_profiles')
    .update({
      full_name: cleanName,
      phone: cleanPhone,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.user.id);

  if (error) throw error;

  // 2. Also update Auth metadata
  await sb.auth.updateUser({
    data: { full_name: cleanName, phone: cleanPhone }
  });

  return true;
}

/**
 * Request Password Reset Email
 */
async function customerResetPassword(email) {
  const sb = getSupabase();
  if (!sb) throw new Error("Database client not available.");

  // Determine redirect URL
  const origin = window.location.origin;
  const path = window.location.pathname;
  const folder = path.substring(0, path.lastIndexOf('/') + 1);
  const redirectUrl = `${origin}${folder}reset-password.html`;

  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: redirectUrl
  });

  if (error) throw error;
  return true;
}

/**
 * Update Password (after reset or inside account)
 */
async function customerUpdatePassword(newPassword) {
  const sb = getSupabase();
  if (!sb) throw new Error("Database client not available.");

  const { error } = await sb.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return true;
}

/**
 * Dynamically updates website navigation on all customer pages
 */
async function updateCustomerNav() {
  const customer = await getCurrentCustomer();
  const navLinks = document.querySelector('.nav-links');
  const mobileNav = document.querySelector('.mobile-nav');
  const navActions = document.querySelector('.nav-actions');

  if (!navLinks) return;

  // Check if auth links already injected
  const existingAuthLink = document.getElementById('nav-customer-link');
  if (existingAuthLink) existingAuthLink.remove();

  const existingMobileAuth = document.getElementById('mobile-customer-auth');
  if (existingMobileAuth) existingMobileAuth.remove();

  if (customer && customer.user) {
    // ── Logged In Navigation ──
    const displayName = customer.profile?.full_name ? customer.profile.full_name.split(' ')[0] : 'Account';

    // Desktop Nav links
    const accountDropdown = document.createElement('div');
    accountDropdown.id = 'nav-customer-link';
    accountDropdown.className = 'nav-user-dropdown';
    accountDropdown.innerHTML = `
      <a href="account.html" class="nav-account-btn" title="My Account">
        👤 <span>${escapeHtml(displayName)}</span>
      </a>
    `;
    navLinks.appendChild(accountDropdown);

    // Mobile Nav
    if (mobileNav) {
      const mobileDiv = document.createElement('div');
      mobileDiv.id = 'mobile-customer-auth';
      mobileDiv.innerHTML = `
        <div style="margin: 12px 0 6px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 0.8rem; color: var(--caramel-light); text-transform: uppercase; letter-spacing: 1px;">My Account</div>
        <a href="account.html">👤 My Profile &amp; Orders</a>
        <a href="javascript:void(0)" onclick="customerLogout()" style="color: #ff9999;">🚪 Logout</a>
      `;
      mobileNav.appendChild(mobileDiv);
    }

  } else {
    // ── Logged Out Navigation ──
    const authLinksDiv = document.createElement('div');
    authLinksDiv.id = 'nav-customer-link';
    authLinksDiv.style.display = 'inline-flex';
    authLinksDiv.style.gap = '14px';
    authLinksDiv.style.alignItems = 'center';
    authLinksDiv.style.marginLeft = '8px';
    authLinksDiv.innerHTML = `
      <a href="login.html" class="nav-auth-link" style="color: var(--coffee); font-weight: 600;">Sign In</a>
      <a href="register.html" class="btn btn-sm btn-primary" style="padding: 6px 14px; font-size: 0.82rem;">Register</a>
    `;
    navLinks.appendChild(authLinksDiv);

    // Mobile Nav
    if (mobileNav) {
      const mobileDiv = document.createElement('div');
      mobileDiv.id = 'mobile-customer-auth';
      mobileDiv.innerHTML = `
        <div style="margin: 12px 0 6px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 0.8rem; color: var(--caramel-light); text-transform: uppercase; letter-spacing: 1px;">Customer Account</div>
        <a href="login.html">🔑 Sign In</a>
        <a href="register.html">✨ Register Account</a>
      `;
      mobileNav.appendChild(mobileDiv);
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

// Automatically update customer nav upon DOM load
document.addEventListener('DOMContentLoaded', () => {
  updateCustomerNav();
});

