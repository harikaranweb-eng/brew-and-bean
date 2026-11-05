/* ===================================================
   BREW & BEAN — Guest Coffee Subscriptions
   Plans: Simple (₹49/mo) and Premium (₹99/mo)
   =================================================== */

let selectedPlanForModal = 'Simple';
let selectedPriceForModal = 49;

/**
 * Open Guest Subscription Modal
 */
function openSubscriptionModal(planName, price) {
  selectedPlanForModal = planName;
  selectedPriceForModal = price;

  const modal = document.getElementById('subscription-modal');
  const titleEl = document.getElementById('sub-modal-title');
  const priceEl = document.getElementById('sub-modal-price');

  if (titleEl) titleEl.textContent = `${planName} Plan`;
  if (priceEl) priceEl.textContent = `₹${price} / month`;

  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeSubscriptionModal() {
  const modal = document.getElementById('subscription-modal');
  if (modal) modal.style.display = 'none';
}

/**
 * Handle subscription submission
 */
async function handleGuestSubscription(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('sub-cust-name');
  const emailInput = document.getElementById('sub-cust-email');
  const phoneInput = document.getElementById('sub-cust-phone');
  const submitBtn = document.getElementById('btn-confirm-subscription');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!name) {
    showToast('Please enter your full name', 'error');
    nameInput?.focus();
    return;
  }
  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address', 'error');
    emailInput?.focus();
    return;
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    showToast('Please enter your 10-digit mobile number', 'error');
    phoneInput?.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '☕ Activating Membership...';
  }

  try {
    const sb = getSupabase();
    let subResult = null;

    if (sb) {
      // Call Supabase RPC to validate & insert with duplicate active check
      const { data, error } = await sb.rpc('create_guest_subscription', {
        p_customer_name: name,
        p_customer_email: email,
        p_customer_phone: phone,
        p_plan_name: selectedPlanForModal,
        p_is_demo_payment: true // Clearly marked demo simulation
      });

      if (!error && data) {
        subResult = data;
      } else if (error) {
        console.warn('Supabase subscription note:', error.message);
      }
    }

    // Handle duplicate check
    if (subResult && !subResult.success) {
      showToast(subResult.message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Complete Demo Activation (₹' + selectedPriceForModal + ')';
      }
      return;
    }

    // Local fallback if Supabase tables haven't been seeded yet
    if (!subResult) {
      const cleanPhone = phone.replace(/\D/g, '');
      const localSubs = JSON.parse(localStorage.getItem('bb_subscriptions') || '[]');
      const existing = localSubs.find(s => s.phone === cleanPhone && s.status === 'Active');

      if (existing) {
        showToast(`An active subscription already exists for this phone (${existing.plan} Plan, Ref: ${existing.ref}).`, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Complete Demo Activation (₹' + selectedPriceForModal + ')';
        }
        return;
      }

      const ref = `SUB-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${Math.floor(1000 + Math.random()*9000)}`;
      subResult = {
        success: true,
        subscription_ref: ref,
        plan_name: selectedPlanForModal,
        amount: selectedPriceForModal,
        status: 'Active',
        payment_status: 'Paid (Demo Verified)'
      };

      localSubs.push({
        ref,
        name,
        email,
        phone: cleanPhone,
        plan: selectedPlanForModal,
        amount: selectedPriceForModal,
        status: 'Active',
        payment_status: 'Paid (Demo Verified)',
        date: new Date().toISOString()
      });
      localStorage.setItem('bb_subscriptions', JSON.stringify(localSubs));
    }

    closeSubscriptionModal();
    showSubscriptionSuccessModal(subResult, name);

  } catch (err) {
    console.error('Subscription error:', err);
    showToast('Failed to process subscription. Please try again.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Complete Demo Activation';
    }
  }
}

/**
 * Show subscription success modal
 */
function showSubscriptionSuccessModal(subData, customerName) {
  const modal = document.getElementById('sub-success-modal');
  if (!modal) return;

  document.getElementById('sub-success-name').textContent = customerName;
  document.getElementById('sub-success-ref').textContent = subData.subscription_ref;
  document.getElementById('sub-success-plan').textContent = `${subData.plan_name} Plan (₹${subData.amount}/mo)`;
  modal.style.display = 'flex';
}

function closeSuccessModal() {
  const modal = document.getElementById('sub-success-modal');
  if (modal) modal.style.display = 'none';
}

/**
 * Open Cancellation Modal
 */
function openCancelModal() {
  const modal = document.getElementById('cancel-modal');
  if (modal) modal.style.display = 'flex';
}

function closeCancelModal() {
  const modal = document.getElementById('cancel-modal');
  if (modal) modal.style.display = 'none';
}

/**
 * Cancel Guest Subscription
 */
async function handleCancelSubscription(event) {
  if (event) event.preventDefault();

  const refInput = document.getElementById('cancel-ref');
  const phoneInput = document.getElementById('cancel-phone');
  const ref = refInput ? refInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!ref || !phone) {
    showToast('Please enter both your Subscription Reference and Phone Number', 'error');
    return;
  }

  try {
    const sb = getSupabase();
    let cancelled = false;

    if (sb) {
      const { data, error } = await sb.rpc('cancel_guest_subscription', {
        p_sub_ref: ref,
        p_phone: phone
      });

      if (!error && data) {
        if (data.success) {
          showToast(data.message, 'success');
          cancelled = true;
        } else {
          showToast(data.message, 'error');
          return;
        }
      }
    }

    // Local fallback
    if (!cancelled) {
      const cleanPhone = phone.replace(/\D/g, '');
      const localSubs = JSON.parse(localStorage.getItem('bb_subscriptions') || '[]');
      const sub = localSubs.find(s => s.ref.toUpperCase() === ref.toUpperCase() && s.phone === cleanPhone);

      if (sub) {
        sub.status = 'Cancelled';
        localStorage.setItem('bb_subscriptions', JSON.stringify(localSubs));
        showToast(`Subscription ${ref} has been cancelled.`, 'success');
      } else {
        showToast('No active subscription found with those credentials.', 'error');
        return;
      }
    }

    closeCancelModal();

  } catch (err) {
    console.error('Cancel error:', err);
    showToast('Error processing cancellation request.', 'error');
  }
}

