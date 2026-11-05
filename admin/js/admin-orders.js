/* ===================================================
   BREW & BEAN — Admin Order Management
   Handles: Order Listing, Status Updates, Detailed View
   =================================================== */

let _ordersList = [];

async function loadAdminOrders() {
  const sb = getSupabase();
  if (!sb) return;

  const tableBody = document.getElementById('orders-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty">
          <div class="spinner" style="margin: 0 auto 12px;"></div>
          <p>Fetching orders from Supabase...</p>
        </td>
      </tr>
    `;
  }

  try {
    // Fetch orders joined with order_items
    const { data, error } = await sb
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    _ordersList = data || [];
    renderOrdersTable();
  } catch (err) {
    console.error("Error loading orders:", err);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="table-empty">
            <div class="empty-icon">⚠️</div>
            <p>Failed to load orders: ${escapeHtml(err.message)}</p>
          </td>
        </tr>
      `;
    }
  }
}

function renderOrdersTable() {
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) return;

  const search = (document.getElementById('order-search')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('order-status-filter')?.value || 'all';

  const filtered = _ordersList.filter(o => {
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter;
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search) ||
      o.customer_name.toLowerCase().includes(search) ||
      o.customer_phone.includes(search);
    return matchStatus && matchSearch;
  });

  const countBadge = document.getElementById('orders-count-badge');
  if (countBadge) countBadge.textContent = `${filtered.length} orders`;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="table-empty">
          <div class="empty-icon">📦</div>
          <p>No orders found.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(o => {
    const items = o.order_items || [];
    const itemsSummary = items.length > 0 
      ? items.map(i => `${i.quantity}x ${i.product_name} (${i.selected_size})`).join(', ')
      : 'No items recorded';

    const dateStr = new Date(o.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusOptions = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']
      .map(s => `<option value="${s}" ${o.order_status === s ? 'selected' : ''}>${s}</option>`)
      .join('');

    const statusClassMap = {
      'Pending': 'badge-warning',
      'Confirmed': 'badge-info',
      'Preparing': 'badge-coffee',
      'Out for Delivery': 'badge-warning',
      'Delivered': 'badge-success',
      'Cancelled': 'badge-error'
    };

    return `
      <tr>
        <td>
          <strong style="color: var(--coffee); font-family: monospace;">${escapeHtml(o.order_number)}</strong>
          <div style="font-size: 0.72rem; color: var(--gray-400);">${dateStr}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(o.customer_name)}</div>
          <div style="font-size: 0.78rem; color: var(--gray-400);">${escapeHtml(o.customer_phone)}</div>
        </td>
        <td style="max-width: 200px;">
          <div style="font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(itemsSummary)}">
            ${escapeHtml(itemsSummary)}
          </div>
          <div style="font-size: 0.72rem; color: var(--gray-400);">${items.length} item(s) • ${escapeHtml(o.order_type || 'Home Delivery')}</div>
        </td>
        <td>
          <strong>₹${Math.round(o.total_amount)}</strong>
        </td>
        <td>
          <span style="font-size: 0.8rem;">${escapeHtml(o.payment_method)}</span>
        </td>
        <td>
          <span class="badge ${o.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}">
            ${escapeHtml(o.payment_status)}
          </span>
        </td>
        <td>
          <select 
            class="status-select" 
            onchange="updateOrderStatus('${o.id}', this.value)"
          >
            ${statusOptions}
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-xs" onclick="viewOrderDetails('${o.id}')">View</button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Update order status in Supabase
 */
async function updateOrderStatus(orderId, newStatus) {
  const sb = getSupabase();
  if (!sb) return;

  try {
    const { error } = await sb
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId);

    if (error) throw error;

    // Update locally
    const order = _ordersList.find(o => o.id === orderId);
    if (order) order.order_status = newStatus;

    showAdminToast(`Order status updated to "${newStatus}"`, 'success');
  } catch (err) {
    console.error("Update status error:", err);
    showAdminToast(`Failed to update order status: ${err.message}`, 'error');
    // Refresh to revert select
    renderOrdersTable();
  }
}

/**
 * View Detailed Order Modal
 */
function viewOrderDetails(orderId) {
  const order = _ordersList.find(o => o.id === orderId);
  if (!order) return;

  const items = order.order_items || [];
  const itemsHTML = items.map(i => `
    <div class="oi-row">
      <span><strong>${i.quantity}x</strong> ${escapeHtml(i.product_name)} <em style="color:var(--gray-400); font-size:0.75rem;">(${i.selected_size})</em></span>
      <span>₹${Math.round(i.subtotal)}</span>
    </div>
  `).join('');

  document.getElementById('order-detail-title').textContent = `Order ${order.order_number}`;
  document.getElementById('order-detail-body').innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--gray-400); margin-bottom:4px;">Customer Info</h4>
        <div style="font-weight:600;">${escapeHtml(order.customer_name)}</div>
        <div style="font-size:0.85rem;">📞 ${escapeHtml(order.customer_phone)}</div>
        ${order.customer_email ? `<div style="font-size:0.85rem;">✉️ ${escapeHtml(order.customer_email)}</div>` : ''}
      </div>
      <div>
        <h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--gray-400); margin-bottom:4px;">Delivery Address</h4>
        <div style="font-size:0.85rem;">${escapeHtml(order.delivery_address || 'Takeaway')}</div>
        <div style="font-size:0.85rem;">${escapeHtml(order.city || '')} ${escapeHtml(order.pincode || '')}</div>
        <div style="font-size:0.75rem; color:var(--gray-400); margin-top:2px;">Type: <strong>${escapeHtml(order.order_type || 'Home Delivery')}</strong></div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--gray-400); margin-bottom:8px;">Order Items</h4>
      <div class="order-items-mini">
        ${itemsHTML}
        <div class="oi-row" style="margin-top:8px; border-top:1.5px dashed var(--gray-200); padding-top:8px;">
          <span>Subtotal:</span>
          <span>₹${Math.round(order.subtotal)}</span>
        </div>
        ${Number(order.discount_amount) > 0 ? `
          <div class="oi-row" style="color:var(--success);">
            <span>Discount:</span>
            <span>-₹${Math.round(order.discount_amount)}</span>
          </div>
        ` : ''}
        <div class="oi-row">
          <span>Delivery Fee:</span>
          <span>${Number(order.delivery_fee) === 0 ? 'FREE' : `₹${Math.round(order.delivery_fee)}`}</span>
        </div>
        <div class="oi-row" style="font-size:1rem; font-weight:700; color:var(--coffee); padding-top:6px;">
          <span>Total:</span>
          <span>₹${Math.round(order.total_amount)}</span>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--gray-400); margin-bottom:4px;">Payment Method</h4>
        <div style="font-weight:600;">${escapeHtml(order.payment_method)}</div>
        <span class="badge ${order.payment_status === 'Paid' ? 'badge-success' : 'badge-warning'}" style="margin-top:4px;">
          ${escapeHtml(order.payment_status)}
        </span>
      </div>
      <div>
        <h4 style="font-size:0.8rem; text-transform:uppercase; color:var(--gray-400); margin-bottom:4px;">Order Status</h4>
        <select 
          class="status-select" 
          style="width:100%;"
          onchange="updateOrderStatus('${order.id}', this.value); viewOrderDetails('${order.id}')"
        >
          ${['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']
            .map(s => `<option value="${s}" ${order.order_status === s ? 'selected' : ''}>${s}</option>`)
            .join('')}
        </select>
      </div>
    </div>

    ${order.order_notes ? `
      <div style="margin-top:16px; padding:10px 14px; background:var(--gray-100); border-radius:var(--radius-md); font-size:0.82rem;">
        <strong>Customer Note:</strong> ${escapeHtml(order.order_notes)}
      </div>
    ` : ''}
  `;

  document.getElementById('order-detail-modal').classList.add('open');
}

function closeOrderDetailModal() {
  document.getElementById('order-detail-modal').classList.remove('open');
}

