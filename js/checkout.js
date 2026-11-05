/* ===================================================
   BREW & BEAN — Guest Checkout System
   Includes Delivery vs Takeaway & Membership Discounts
   =================================================== */

let activeOrderType = 'Home Delivery';
let activeDiscountPercent = 0; // 5% for Simple, 10% for Premium

document.addEventListener('DOMContentLoaded', async () => {
  // Check stored order type from cart
  const savedType = sessionStorage.getItem('bb_order_type');
  if (savedType) {
    activeOrderType = savedType;
    setCheckoutOrderType(savedType);
  } else {
    setCheckoutOrderType('Home Delivery');
  }

  renderCheckoutSummary();

  // Auto pre-fill if logged in as customer
  try {
    if (typeof getCurrentCustomer === 'function') {
      const customer = await getCurrentCustomer();
      if (customer && customer.user) {
        const nameInput = document.getElementById('cust-name');
        const emailInput = document.getElementById('cust-email');
        const phoneInput = document.getElementById('cust-phone');

        if (nameInput && !nameInput.value) {
          nameInput.value = customer.profile?.full_name || customer.user.user_metadata?.full_name || '';
        }
        if (emailInput && !emailInput.value) {
          emailInput.value = customer.profile?.email || customer.user.email || '';
        }
        if (phoneInput && !phoneInput.value && (customer.profile?.phone || customer.user.user_metadata?.phone)) {
          phoneInput.value = customer.profile?.phone || customer.user.user_metadata?.phone;
          checkSubscriberStatus();
        }
      }
    }
  } catch (e) {
    console.warn('Customer prefill note:', e);
  }

  // Listen to phone number input to auto-detect active membership discount
  const phoneInput = document.getElementById('cust-phone');
  if (phoneInput) {
    phoneInput.addEventListener('blur', checkSubscriberStatus);
  }
});

function setCheckoutOrderType(type) {
  activeOrderType = type;
  const delBtn = document.getElementById('co-btn-delivery');
  const takeBtn = document.getElementById('co-btn-takeaway');
  const addrGroup = document.getElementById('delivery-address-group');

  if (delBtn) delBtn.classList.toggle('selected', type === 'Home Delivery');
  if (takeBtn) takeBtn.classList.toggle('selected', type === 'Takeaway');
  if (addrGroup) {
    addrGroup.style.display = type === 'Home Delivery' ? 'block' : 'none';
  }

  renderCheckoutSummary();
}

/**
 * Check if the customer phone has an active subscription in Supabase
 * Simple: 5% discount
 * Premium: 10% discount + Free delivery
 */
async function checkSubscriberStatus() {
  const phoneInput = document.getElementById('cust-phone');
  const phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
  const discountRow = document.getElementById('co-discount-row');
  const discountLabel = document.getElementById('co-discount-label');

  if (phone.length < 10) return;

  const sb = getSupabase();
  let sub = null;

  if (sb) {
    try {
      const { data, error } = await sb
        .from('subscriptions')
        .select('*')
        .eq('customer_phone', phone)
        .eq('subscription_status', 'Active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) sub = data;
    } catch (e) {
      console.warn('Subscription check note:', e);
    }
  }

  // Local fallback check
  if (!sub) {
    const localSubs = JSON.parse(localStorage.getItem('bb_subscriptions') || '[]');
    sub = localSubs.find(s => s.phone === phone && s.status === 'Active');
  }

  if (sub) {
    if (sub.plan_name === 'Premium' || sub.plan === 'Premium') {
      activeDiscountPercent = 0.10;
      showToast('⭐ Active Premium Member verified! 10% discount & Free Delivery applied.', 'success');
      if (discountLabel) discountLabel.textContent = 'Premium Member (10%)';
    } else {
      activeDiscountPercent = 0.05;
      showToast('⭐ Active Simple Member verified! 5% discount applied.', 'success');
      if (discountLabel) discountLabel.textContent = 'Simple Member (5%)';
    }
  } else {
    activeDiscountPercent = 0;
  }

  renderCheckoutSummary();
}

/**
 * Render items in checkout sidebar with verified calculations
 */
function renderCheckoutSummary() {
  const cart = getCart();
  const listEl = document.getElementById('checkout-items-list');
  if (!listEl) return;

  if (!cart || cart.length === 0) {
    showToast('Your cart is empty. Redirecting to menu...', 'warning');
    setTimeout(() => {
      window.location.href = 'menu.html';
    }, 1200);
    return;
  }

  listEl.innerHTML = cart.map(item => `
    <div class="order-item">
      <img src="${item.image}" alt="${item.name}" class="order-item-img">
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-size">Portion / Size: ${item.size} • Qty: ${item.qty}</div>
      </div>
      <div class="order-item-price">₹${item.price * item.qty}</div>
    </div>
  `).join('');

  const subtotal = getCartTotal();
  const discountAmount = Math.round(subtotal * activeDiscountPercent);
  const discountedSubtotal = subtotal - discountAmount;

  // Delivery: ₹30 fee, Free above ₹499 or Takeaway or Premium subscriber (activeDiscountPercent === 0.10)
  const isPremiumSub = (activeDiscountPercent === 0.10);
  const delivery = calculateDeliveryFee(discountedSubtotal, activeOrderType, isPremiumSub);
  const total = discountedSubtotal + delivery;

  const subEl = document.getElementById('co-subtotal');
  const discRow = document.getElementById('co-discount-row');
  const discEl = document.getElementById('co-discount');
  const delEl = document.getElementById('co-delivery');
  const totEl = document.getElementById('co-total');

  if (subEl) subEl.textContent = `₹${subtotal}`;

  if (discRow && discEl) {
    if (discountAmount > 0) {
      discRow.style.display = 'flex';
      discEl.textContent = `-₹${discountAmount}`;
    } else {
      discRow.style.display = 'none';
    }
  }

  if (delEl) delEl.textContent = delivery === 0 ? 'FREE' : `₹${delivery}`;
  if (totEl) totEl.textContent = `₹${total}`;
}

/**
 * Validates and submits guest order to Supabase
 */
async function submitGuestOrder(event) {
  if (event) event.preventDefault();

  const cart = getCart();
  if (!cart || cart.length === 0) {
    showToast('Your cart is empty. Please add coffee before checking out.', 'warning');
    return;
  }

  // Gather customer info
  const nameInput = document.getElementById('cust-name');
  const emailInput = document.getElementById('cust-email');
  const phoneInput = document.getElementById('cust-phone');
  const addrInput = document.getElementById('cust-address');
  const cityInput = document.getElementById('cust-city');
  const pinInput = document.getElementById('cust-pincode');
  const notesInput = document.getElementById('cust-notes');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addrInput ? addrInput.value.trim() : (activeOrderType === 'Takeaway' ? 'Store Pickup' : '');
  const city = cityInput ? cityInput.value.trim() : 'Bangalore';
  const pincode = pinInput ? pinInput.value.trim() : '';
  const notes = notesInput ? notesInput.value.trim() : '';

  // Validation
  if (!name) {
    showToast('Please enter your full name', 'error');
    nameInput?.focus();
    return;
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    phoneInput?.focus();
    return;
  }
  if (activeOrderType === 'Home Delivery' && !address) {
    showToast('Please provide your complete delivery address', 'error');
    addrInput?.focus();
    return;
  }

  // Payment method
  const selectedPayEl = document.querySelector('input[name="payment_method"]:checked');
  const paymentMethodVal = selectedPayEl ? selectedPayEl.value : 'cod';
  const paymentMethodLabel = paymentMethodVal === 'upi' ? 'UPI (Cash/UPI upon delivery)' : 'Cash on Delivery (COD)';

  // Format order items with exact variant info
  const itemsPayload = cart.map(item => ({
    product_id: Number(item.id),
    quantity: Number(item.qty),
    size: item.size || 'Regular'
  }));

  const submitBtn = document.getElementById('btn-place-order');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '☕ Placing Your Order...';
  }

  let finalOrderNumber = '';
  let finalTotal = 0;

  try {
    const sb = getSupabase();
    let supabaseSuccess = false;

    // Detect if customer is authenticated to link order to account
    let currentAuthUserId = null;
    try {
      if (typeof getCurrentCustomer === 'function') {
        const cust = await getCurrentCustomer();
        if (cust && cust.user) {
          currentAuthUserId = cust.user.id;
        }
      }
    } catch (e) {
      console.warn('Customer auth check during checkout note:', e);
    }

    if (sb) {
      // Execute Supabase RPC with server-side trusted price verification
      const { data, error } = await sb.rpc('create_guest_order', {
        p_customer_name: name,
        p_customer_email: email,
        p_customer_phone: phone,
        p_delivery_address: address || 'Store Pickup (42 MG Road, Bangalore)',
        p_city: city,
        p_pincode: pincode,
        p_payment_method: paymentMethodLabel,
        p_order_notes: notes,
        p_items: itemsPayload,
        p_order_type: activeOrderType,
        p_user_id: currentAuthUserId
      });

      if (!error && data && data.success) {
        supabaseSuccess = true;
        finalOrderNumber = data.order_number;
        finalTotal = data.total_amount;
      } else if (error) {
        console.warn('Supabase create_guest_order RPC note:', error.message);
      }
    }

    // Fallback if Supabase tables haven't been seeded yet
    if (!supabaseSuccess) {
      const today = new Date();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalOrderNumber = `BB-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${randomSuffix}`;
      const subtotal = getCartTotal();
      const discount = Math.round(subtotal * activeDiscountPercent);
      const delivery = calculateDeliveryFee(subtotal - discount, activeOrderType, activeDiscountPercent === 0.10);
      finalTotal = (subtotal - discount) + delivery;

      // Save to local guest orders for tracking
      const localOrders = JSON.parse(localStorage.getItem('bb_guest_orders') || '[]');
      localOrders.unshift({
        order_number: finalOrderNumber,
        customer_name: name,
        customer_email: email,
        customer_phone: phone.replace(/\D/g, ''),
        delivery_address: address || 'Takeaway Pickup (42 MG Road)',
        city,
        pincode,
        subtotal,
        discount,
        delivery_fee: delivery,
        total_amount: finalTotal,
        payment_method: paymentMethodLabel,
        payment_status: 'Pending',
        order_status: 'Confirmed',
        order_type: activeOrderType,
        created_at: new Date().toISOString(),
        items: cart.map(i => ({
          product_name: i.name,
          quantity: i.qty,
          selected_size: i.size,
          product_price: i.price,
          subtotal: i.price * i.qty,
          image_url: i.image
        }))
      });
      localStorage.setItem('bb_guest_orders', JSON.stringify(localOrders));
    }

    // Clear cart after order is registered
    clearCart();

    // Store recent order summary for confirmation screen
    sessionStorage.setItem('bb_latest_order', JSON.stringify({
      order_number: finalOrderNumber,
      customer_name: name,
      customer_phone: phone,
      total_amount: finalTotal,
      order_type: activeOrderType,
      payment_method: paymentMethodLabel
    }));

    // Redirect to Order Confirmation
    window.location.href = `order-confirmation.html?order=${encodeURIComponent(finalOrderNumber)}&phone=${encodeURIComponent(phone)}`;

  } catch (err) {
    console.error('Checkout error:', err);
    showToast('There was an issue processing your order. Please try again.', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Place Order Now';
    }
  }
}
