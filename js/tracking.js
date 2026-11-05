/* ===================================================
   BREW & BEAN — Secure Guest Order Tracking
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Check URL parameters for quick-tracking
  const params = new URLSearchParams(window.location.search);
  const urlOrder = params.get('order');
  const urlPhone = params.get('phone');

  if (urlOrder) {
    const orderInput = document.getElementById('track-order-number');
    if (orderInput) orderInput.value = urlOrder;
  }
  if (urlPhone) {
    const phoneInput = document.getElementById('track-phone');
    if (phoneInput) phoneInput.value = urlPhone;
  }

  if (urlOrder && urlPhone) {
    trackOrder();
  }
});

/**
 * Validates inputs and fetches order via Supabase RPC
 */
async function trackOrder(event) {
  if (event) event.preventDefault();

  const orderNumInput = document.getElementById('track-order-number');
  const phoneInput = document.getElementById('track-phone');
  const resultContainer = document.getElementById('tracking-result');
  const trackBtn = document.getElementById('btn-track-submit');

  const orderNumber = orderNumInput ? orderNumInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!orderNumber) {
    showToast('Please enter your Order Number', 'error');
    orderNumInput?.focus();
    return;
  }
  if (!phone) {
    showToast('Please enter your Mobile Number', 'error');
    phoneInput?.focus();
    return;
  }

  if (trackBtn) {
    trackBtn.disabled = true;
    trackBtn.innerHTML = '🔍 Locating Order...';
  }

  let orderData = null;

  try {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.rpc('track_guest_order', {
        p_order_number: orderNumber,
        p_phone: phone
      });

      if (!error && data && data.success && data.order) {
        orderData = data.order;
      } else if (error) {
        console.warn('Supabase tracking note:', error.message);
      }
    }

    // Fallback: Check local guest orders if not found in Supabase
    if (!orderData) {
      const cleanPhone = phone.replace(/\D/g, '');
      const localOrders = JSON.parse(localStorage.getItem('bb_guest_orders') || '[]');
      const found = localOrders.find(o => 
        o.order_number.toUpperCase() === orderNumber.toUpperCase() &&
        o.customer_phone.replace(/\D/g, '') === cleanPhone
      );
      if (found) orderData = found;
    }

    if (!orderData) {
      resultContainer.style.display = 'block';
      resultContainer.innerHTML = `
        <div class="checkout-card" style="text-align: center; padding: 48px 24px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
          <h3 style="margin-bottom: 8px;">Order Not Found</h3>
          <p style="color: var(--gray-600); max-width: 440px; margin: 0 auto 20px;">
            We could not find an order matching <strong>#${orderNumber}</strong> and mobile number ending in <strong>${phone.slice(-4)}</strong>.
          </p>
          <p style="font-size: 0.85rem; color: var(--gray-400);">
            Please verify your 10-digit mobile number and order number format (e.g., BB-20241030-1234).
          </p>
        </div>
      `;
      return;
    }

    // Render Order Tracking View
    renderOrderTrackingResult(orderData);

  } catch (err) {
    console.error('Tracking error:', err);
    showToast('Failed to retrieve order tracking information.', 'error');
  } finally {
    if (trackBtn) {
      trackBtn.disabled = false;
      trackBtn.innerHTML = 'Track Order Status';
    }
  }
}

/**
 * Renders status stepper and detailed order review
 */
function renderOrderTrackingResult(order) {
  const container = document.getElementById('tracking-result');
  if (!container) return;

  const statuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const currentStatus = order.order_status || 'Confirmed';
  const isCancelled = currentStatus === 'Cancelled';

  const currentIndex = statuses.indexOf(currentStatus);

  // Stepper HTML
  let stepperHTML = '';
  if (isCancelled) {
    stepperHTML = `
      <div style="background: rgba(192,57,43,0.1); border-left: 4px solid var(--error); padding: 16px 20px; border-radius: var(--radius-md); margin-bottom: 28px; color: var(--error);">
        <strong>Order Cancelled:</strong> This order has been cancelled. For refunds or inquiries, please contact hello@brewandbean.in.
      </div>
    `;
  } else {
    stepperHTML = `
      <div class="tracking-stepper" style="display:flex; justify-content:space-between; position:relative; margin: 32px 0 40px; gap:8px; overflow-x:auto;">
        ${statuses.map((st, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const icon = idx === 0 ? '📝' : idx === 1 ? '✅' : idx === 2 ? '☕' : idx === 3 ? '🛵' : '🎉';
          return `
            <div style="flex:1; text-align:center; min-width:80px; position:relative;">
              <div style="
                width:44px; height:44px; border-radius:50%; margin:0 auto 8px;
                display:flex; align-items:center; justify-content:center; font-size:1.2rem;
                background:${isDone ? 'var(--coffee)' : 'var(--gray-200)'};
                color:${isDone ? 'white' : 'var(--gray-400)'};
                box-shadow:${isCurrent ? '0 0 0 4px rgba(198,139,89,0.3)' : 'none'};
                transition:var(--transition);
              ">
                ${icon}
              </div>
              <div style="font-size:0.78rem; font-weight:${isCurrent ? '700' : '500'}; color:${isDone ? 'var(--dark)' : 'var(--gray-400)'};">
                ${st}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Items List HTML
  const items = order.items || [];
  const itemsHTML = items.map(item => `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--gray-200);">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="${item.image_url || 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=120&q=80'}" style="width:48px; height:48px; border-radius:8px; object-fit:cover;">
        <div>
          <div style="font-weight:600; font-size:0.95rem;">${item.product_name}</div>
          <div style="font-size:0.8rem; color:var(--gray-400);">Size: ${item.selected_size} • Qty: ${item.quantity}</div>
        </div>
      </div>
      <div style="font-weight:700; color:var(--coffee);">₹${item.subtotal || (item.product_price * item.quantity)}</div>
    </div>
  `).join('');

  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  container.style.display = 'block';
  container.innerHTML = `
    <div class="checkout-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--gray-200);">
        <div>
          <span style="font-size:0.8rem; color:var(--gray-400); text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Order Reference</span>
          <h2 style="font-size:1.6rem; color:var(--coffee); margin-top:2px;">#${order.order_number}</h2>
          <span style="font-size:0.85rem; color:var(--gray-600);">Placed on ${orderDate}</span>
        </div>
        <div>
          <span style="background:rgba(45,138,78,0.12); color:var(--success); padding:6px 16px; border-radius:999px; font-weight:700; font-size:0.85rem;">
            ● Status: ${order.order_status}
          </span>
        </div>
      </div>

      ${stepperHTML}

      <div class="form-grid-2" style="margin-bottom:28px;">
        <div style="background:var(--cream); padding:16px; border-radius:var(--radius-md);">
          <div style="font-size:0.75rem; color:var(--gray-400); text-transform:uppercase; font-weight:700; margin-bottom:4px;">Delivery Address</div>
          <div style="font-weight:600; color:var(--dark);">${order.customer_name}</div>
          <div style="font-size:0.9rem; color:var(--gray-600);">${order.delivery_address}, ${order.city || ''} - ${order.pincode || ''}</div>
          <div style="font-size:0.85rem; color:var(--gray-600); margin-top:4px;">📱 ${order.customer_phone}</div>
        </div>

        <div style="background:var(--cream); padding:16px; border-radius:var(--radius-md);">
          <div style="font-size:0.75rem; color:var(--gray-400); text-transform:uppercase; font-weight:700; margin-bottom:4px;">Payment Info</div>
          <div style="font-weight:600; color:var(--dark);">${order.payment_method || 'Cash on Delivery'}</div>
          <div style="font-size:0.9rem; color:var(--gray-600);">Payment Status: <strong style="color:var(--coffee);">${order.payment_status || 'Pending'}</strong></div>
          <div style="font-size:0.85rem; color:var(--success); margin-top:4px;">⚡ 30-Min Fast Delivery Target</div>
        </div>
      </div>

      <h4 style="margin-bottom:12px;">Ordered Brews</h4>
      <div style="margin-bottom:20px;">
        ${itemsHTML || '<p style="color:var(--gray-400);">No item details available.</p>'}
      </div>

      <div style="border-top:1px solid var(--gray-200); padding-top:16px; max-width:320px; margin-left:auto;">
        <div class="summary-row">
          <span class="label">Subtotal:</span>
          <span class="value">₹${order.subtotal}</span>
        </div>
        <div class="summary-row">
          <span class="label">Delivery Fee:</span>
          <span class="value">${Number(order.delivery_fee) === 0 ? 'FREE' : '₹' + order.delivery_fee}</span>
        </div>
        <div class="summary-row total">
          <span>Total Amount:</span>
          <span style="color:var(--coffee);">₹${order.total_amount}</span>
        </div>
      </div>

      <div style="text-align:center; margin-top:28px; padding-top:20px; border-top:1px solid var(--gray-200);">
        <a href="menu.html" class="btn btn-secondary btn-sm">Order More Coffee</a>
      </div>
    </div>
  `;

  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

