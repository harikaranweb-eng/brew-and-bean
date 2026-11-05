/* ===================================================
   BREW & BEAN — Global JavaScript
   Handles: Navbar, Scroll Reveal, Countdown, FAQ,
            Password Toggles, Form Validation, Utilities
   NOTE: Cart functions are in cart.js
         Product functions are in products.js
   =================================================== */

/* ===== NAVIGATION ===== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Hamburger toggle
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav?.classList.toggle('open');
    document.body.style.overflow = mobileNav?.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile nav on link click
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active nav link
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href === currentPage || href.endsWith(currentPage))) {
      a.classList.add('active');
    }
  });
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ===== COUNTDOWN TIMER ===== */
function initCountdown(endDate) {
  function update() {
    const diff = new Date(endDate) - Date.now();
    if (diff <= 0) return;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const fmt = (n) => String(n).padStart(2, '0');
    const el = (id) => document.getElementById(id);
    if (el('timer-h')) el('timer-h').textContent = fmt(h);
    if (el('timer-m')) el('timer-m').textContent = fmt(m);
    if (el('timer-s')) el('timer-s').textContent = fmt(s);
  }
  update();
  setInterval(update, 1000);
}

/* ===== FORMAT CURRENCY ===== */
function formatRupees(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/* ===== FORM VALIDATION ===== */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  field?.classList.add('error');
  if (error) { error.textContent = message; error.classList.add('show'); }
}
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  field?.classList.remove('error');
  error?.classList.remove('show');
}
function clearAllErrors(formEl) {
  formEl?.querySelectorAll('.form-input').forEach(f => f.classList.remove('error'));
  formEl?.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
}

/* ===== PASSWORD TOGGLE ===== */
function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.togglePassword;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  });
}

/* ===== FAQ ACCORDION ===== */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ===== NAVBAR HTML BUILDER ===== */
function getNavbarHTML() {
  const cartItems = typeof getCart === 'function' ? getCart() : JSON.parse(localStorage.getItem('bb_cart') || '[]');
  const cartCount = cartItems.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  return `
  <nav class="navbar" id="main-navbar">
    <div class="container">
      <a href="index.html" class="nav-logo">
        <div class="logo-icon">☕</div>
        Brew &amp; Bean
      </a>
      <div class="nav-links">
        <a href="index.html">Home</a>
        <a href="menu.html">Menu</a>
        <a href="subscription.html">Subscription</a>
        <a href="track-order.html">Track Order</a>
      </div>
      <div class="nav-actions">
        <a href="track-order.html" class="nav-icon-btn" title="Track Order">🚚</a>
        <a href="cart.html" class="nav-icon-btn" title="Cart" style="position:relative">
          🛒
          <span class="cart-badge" style="display:${cartCount > 0 ? 'inline-flex' : 'none'}">${cartCount}</span>
        </a>
        <div class="hamburger" id="hamburger">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </nav>
  <div class="mobile-nav" id="mobile-nav">
    <a href="index.html">🏠 Home</a>
    <a href="menu.html">☕ Menu</a>
    <a href="subscription.html">⭐ Subscription</a>
    <a href="track-order.html">🚚 Track Order</a>
    <a href="cart.html">🛒 Cart${cartCount > 0 ? ` (${cartCount})` : ''}</a>
  </div>
  `;
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initPasswordToggles();
  initFAQ();

  // Update cart badge using cart.js function (preferred) or fallback
  if (typeof updateCartBadges === 'function') {
    updateCartBadges();
  } else if (typeof updateCartBadge === 'function') {
    updateCartBadge();
  }

  // Offer countdown: next midnight
  const tmr = new Date();
  tmr.setHours(24, 0, 0, 0);
  initCountdown(tmr);
});
