/* ===================================================
   BREW & BEAN — Admin Subscription Management
   Handles: Subscriptions List, Status Management
   =================================================== */

let _subsList = [];

async function loadAdminSubscriptions() {
  const sb = getSupabase();
  if (!sb) return;

  const tableBody = document.getElementById('subs-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty">
          <div class="spinner" style="margin: 0 auto 12px;"></div>
          <p>Loading subscriptions from Supabase...</p>
        </td>
      </tr>
    `;
  }

  try {
    const { data, error } = await sb
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    _subsList = data || [];
    renderSubsTable();
  } catch (err) {
    console.error("Error loading subscriptions:", err);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty">
            <div class="empty-icon">⚠️</div>
            <p>Failed to load subscriptions: ${escapeHtml(err.message)}</p>
          </td>
        </tr>
      `;
    }
  }
}

function renderSubsTable() {
  const tableBody = document.getElementById('subs-table-body');
  if (!tableBody) return;

  const search = (document.getElementById('subs-search')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('subs-status-filter')?.value || 'all';

  const filtered = _subsList.filter(s => {
    const matchStatus = statusFilter === 'all' || s.subscription_status === statusFilter;
    const matchSearch = !search ||
      s.subscription_ref.toLowerCase().includes(search) ||
      s.customer_name.toLowerCase().includes(search) ||
      s.customer_phone.includes(search);
    return matchStatus && matchSearch;
  });

  const countBadge = document.getElementById('subs-count-badge');
  if (countBadge) countBadge.textContent = `${filtered.length} memberships`;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty">
          <div class="empty-icon">⭐</div>
          <p>No subscriptions found.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(s => {
    const startStr = s.start_date ? new Date(s.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const endStr = s.end_date ? new Date(s.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const statusBadgeClass = {
      'Active': 'badge-success',
      'Pending': 'badge-warning',
      'Cancelled': 'badge-error',
      'Expired': 'badge-secondary'
    }[s.subscription_status] || 'badge-secondary';

    const payBadgeClass = s.payment_status.toLowerCase().includes('paid') ? 'badge-success' : 'badge-warning';

    return `
      <tr>
        <td>
          <strong style="color: var(--coffee); font-family: monospace;">${escapeHtml(s.subscription_ref)}</strong>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(s.customer_name)}</div>
          <div style="font-size: 0.78rem; color: var(--gray-400);">${escapeHtml(s.customer_phone)}</div>
          ${s.customer_email ? `<div style="font-size:0.75rem; color:var(--gray-400);">${escapeHtml(s.customer_email)}</div>` : ''}
        </td>
        <td>
          <span class="badge ${s.plan_name === 'Premium' ? 'badge-coffee' : 'badge-secondary'}">
            ${escapeHtml(s.plan_name)} Club
          </span>
        </td>
        <td>
          <strong>₹${Math.round(s.amount)}</strong><span style="font-size:0.72rem; color:var(--gray-400);">/mo</span>
        </td>
        <td style="font-size: 0.8rem;">
          <div>${startStr}</div>
          <div style="color: var(--gray-400); font-size: 0.72rem;">to ${endStr}</div>
        </td>
        <td>
          <span class="badge ${payBadgeClass}">
            ${escapeHtml(s.payment_status)}
          </span>
        </td>
        <td>
          <span class="badge ${statusBadgeClass}">
            ${escapeHtml(s.subscription_status)}
          </span>
        </td>
        <td>
          <div class="action-btns">
            ${s.subscription_status !== 'Active' ? `
              <button 
                class="btn btn-success btn-xs" 
                onclick="promptActivateSub('${s.id}', '${escapeHtml(s.customer_name)}', '${s.plan_name}')"
                title="Verify payment and activate membership"
              >
                Activate
              </button>
            ` : `
              <button 
                class="btn btn-danger btn-xs" 
                onclick="cancelSubByAdmin('${s.id}', '${escapeHtml(s.customer_name)}')"
                title="Cancel subscription"
              >
                Cancel
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Verify payment & activate subscription
 */
async function promptActivateSub(subId, customerName, planName) {
  const confirmed = confirm(
    `Confirm Subscription Activation:\n\nHave you verified payment received for ${customerName} (${planName} Club)?\n\nClick OK to mark payment as Verified and activate subscription.`
  );
  if (!confirmed) return;

  const sb = getSupabase();
  if (!sb) return;

  try {
    const { error } = await sb
      .from('subscriptions')
      .update({
        subscription_status: 'Active',
        payment_status: 'Paid (Owner Verified)'
      })
      .eq('id', subId);

    if (error) throw error;

    showAdminToast(`Subscription for ${customerName} activated!`, 'success');
    await loadAdminSubscriptions();
  } catch (err) {
    console.error("Activate subscription error:", err);
    showAdminToast(`Failed to activate: ${err.message}`, 'error');
  }
}

/**
 * Cancel subscription by admin
 */
async function cancelSubByAdmin(subId, customerName) {
  const confirmed = confirm(`Are you sure you want to cancel the subscription for ${customerName}?`);
  if (!confirmed) return;

  const sb = getSupabase();
  if (!sb) return;

  try {
    const { error } = await sb
      .from('subscriptions')
      .update({ subscription_status: 'Cancelled' })
      .eq('id', subId);

    if (error) throw error;

    showAdminToast(`Subscription for ${customerName} cancelled.`, 'info');
    await loadAdminSubscriptions();
  } catch (err) {
    console.error("Cancel subscription error:", err);
    showAdminToast(`Failed to cancel: ${err.message}`, 'error');
  }
}

