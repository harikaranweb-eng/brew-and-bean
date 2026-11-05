/* ===================================================
   BREW & BEAN — Admin Overview Dashboard
   Loads real metrics & recent activity from Supabase
   =================================================== */

async function loadDashboardMetrics() {
  const sb = getSupabase();
  if (!sb) return;

  try {
    // 1. Fetch total products
    const { count: productsCount, error: pErr } = await sb
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (!pErr && productsCount !== null) {
      const el = document.getElementById('stat-total-products');
      if (el) el.textContent = productsCount;
    }

    // 2. Fetch total orders & pending orders
    const { data: orders, error: oErr } = await sb
      .from('orders')
      .select('id, total_amount, order_status, payment_status, created_at, customer_name, order_number');

    if (!oErr && orders) {
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.order_status === 'Pending').length;
      
      // Calculate revenue (excluding cancelled orders)
      const validOrders = orders.filter(o => o.order_status !== 'Cancelled');
      const revenue = validOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      const elTotal = document.getElementById('stat-total-orders');
      const elPending = document.getElementById('stat-pending-orders');
      const elRev = document.getElementById('stat-total-revenue');

      if (elTotal) elTotal.textContent = totalOrders;
      if (elPending) elPending.textContent = pendingOrders;
      if (elRev) elRev.textContent = `₹${Math.round(revenue).toLocaleString('en-IN')}`;

      // Render 5 most recent orders
      renderRecentOrders(orders.slice(0, 5));
    }

    // 3. Fetch active subscriptions
    const { data: subs, error: sErr } = await sb
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!sErr && subs) {
      const activeSubs = subs.filter(s => s.subscription_status === 'Active').length;
      const elSubs = document.getElementById('stat-active-subs');
      if (elSubs) elSubs.textContent = activeSubs;

      // Render 5 most recent subscriptions
      renderRecentSubscriptions(subs.slice(0, 5));
    }

  } catch (err) {
    console.error("Error loading dashboard metrics:", err);
  }
}

function renderRecentOrders(orders) {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--gray-400); font-size: 0.85rem;">
        No customer orders received yet.
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(o => `
    <div class="recent-item">
      <div class="ri-icon">📦</div>
      <div class="ri-info">
        <div class="ri-name">${o.order_number} — ${escapeHtml(o.customer_name)}</div>
        <div class="ri-sub">${new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • Status: <strong>${o.order_status}</strong></div>
      </div>
      <div class="ri-amount">₹${Math.round(o.total_amount)}</div>
    </div>
  `).join('');
}

function renderRecentSubscriptions(subs) {
  const container = document.getElementById('recent-subs-list');
  if (!container) return;

  if (!subs || subs.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--gray-400); font-size: 0.85rem;">
        No active coffee subscriptions yet.
      </div>
    `;
    return;
  }

  container.innerHTML = subs.map(s => `
    <div class="recent-item">
      <div class="ri-icon">⭐</div>
      <div class="ri-info">
        <div class="ri-name">${escapeHtml(s.customer_name)} (${s.plan_name} Club)</div>
        <div class="ri-sub">${s.subscription_ref} • Status: <strong>${s.subscription_status}</strong></div>
      </div>
      <div class="ri-amount">₹${Math.round(s.amount)}/mo</div>
    </div>
  `).join('');
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

