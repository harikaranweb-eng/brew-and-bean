/* ===================================================
   BREW & BEAN — Order Confirmation & Guest Orders
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderOrderConfirmation();
});

/**
 * Renders details on order-confirmation.html
 */
async function renderOrderConfirmation() {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get('order');
  const phone = params.get('phone');

  const numEl = document.getElementById('conf-order-num');
  const linkEl = document.getElementById('conf-track-link');
  const itemsContainer = document.getElementById('conf-items-container');
  const totalEl = document.getElementById('conf-total-amount');
  const nameEl = document.getElementById('conf-customer-name');

  let orderData = null;

  // Retrieve cached recent order summary if available
  const cached = JSON.parse(sessionStorage.getItem('bb_latest_order') || 'null');
  if (cached && (!orderNumber || cached.order_number === orderNumber)) {
    orderData = cached;
  }

  // Attempt to fetch full order from Supabase
  if (orderNumber && phone) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.rpc('track_guest_order', {
          p_order_number: orderNumber,
          p_phone: phone
        });
        if (!error && data && data.success && data.order) {
          orderData = data.order;
        }
      } catch (e) {
        console.warn('Could not fetch order from Supabase for confirmation:', e);
      }
    }
  }

  const finalOrderNumber = orderData ? orderData.order_number : (orderNumber || 'BB-CONFIRMED');
  const finalPhone = orderData ? orderData.customer_phone : (phone || '');

  if (numEl) numEl.textContent = `#${finalOrderNumber}`;
  if (linkEl) {
    linkEl.href = `track-order.html?order=${encodeURIComponent(finalOrderNumber)}&phone=${encodeURIComponent(finalPhone)}`;
  }
  if (totalEl && orderData) {
    totalEl.textContent = `₹${orderData.total_amount}`;
  }
  if (nameEl && orderData) {
    nameEl.textContent = orderData.customer_name;
  }
}

