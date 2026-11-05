/* ===================================================
   BREW & BEAN — Guest Cart Management (localStorage)
   =================================================== */

const CART_STORAGE_KEY = 'bb_cart';

/**
 * Returns current cart items from localStorage
 */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch (e) {
    console.error('Error reading cart from localStorage', e);
    return [];
  }
}

/**
 * Saves cart array to localStorage and updates UI badges
 */
function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving cart to localStorage', e);
  }
  updateCartBadges();
}

/**
 * Resolves exact price for a product given its selected size/flavor
 */
function getProductPrice(product, size) {
  if (!product) return 0;

  // 1. Check if product has explicit variants array (from DB or data.js)
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    if (size) {
      const match = product.variants.find(v => v.size.toLowerCase() === size.toLowerCase());
      if (match) return Number(match.price);
    }
    return Number(product.variants[0].price);
  }

  // 2. Check product_variants from Supabase join
  if (product.product_variants && Array.isArray(product.product_variants) && product.product_variants.length > 0) {
    if (size) {
      const match = product.product_variants.find(v => v.size.toLowerCase() === size.toLowerCase());
      if (match) return Number(match.price);
    }
    return Number(product.product_variants[0].price);
  }

  // 3. Fallback to base price
  return Number(product.price) || 0;
}

/**
 * Adds an item with exact variant price to the guest cart
 */
function addToCart(product, size, qty = 1) {
  if (!product || !product.id) return;
  const cart = getCart();

  // Determine default size if not provided
  let selectedSize = size;
  if (!selectedSize) {
    if (product.variants && product.variants.length > 0) {
      selectedSize = product.variants[0].size;
    } else if (product.product_variants && product.product_variants.length > 0) {
      selectedSize = product.product_variants[0].size;
    } else {
      selectedSize = 'Regular';
    }
  }

  const unitPrice = getProductPrice(product, selectedSize);
  const key = `${product.id}-${selectedSize}`;

  const existingIndex = cart.findIndex(i => i.key === key);
  if (existingIndex > -1) {
    cart[existingIndex].qty += qty;
  } else {
    cart.push({
      key,
      id: Number(product.id),
      name: product.name,
      category: product.category || 'Coffee',
      size: selectedSize,
      price: unitPrice,
      qty: Math.max(1, qty),
      image: product.image_url || product.image || 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80'
    });
  }

  saveCart(cart);
  showToast(`${product.name} (${selectedSize}) added to cart! ☕`, 'success');
}

/**
 * Removes an item by key from the cart
 */
function removeFromCart(key) {
  let cart = getCart();
  cart = cart.filter(i => i.key !== key);
  saveCart(cart);
}

/**
 * Updates quantity of an item
 */
function updateCartItemQty(key, delta) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(cart);
}

/**
 * Clears all items in the cart
 */
function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartBadges();
}

/**
 * Calculates current subtotal of the cart
 */
function getCartTotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
}

/**
 * Calculates delivery fee based on client rules:
 * - Free for Takeaway (orderType === 'Takeaway')
 * - Free for orders above ₹499 (subtotal > 499)
 * - Free for active Premium subscribers
 * - Otherwise ₹30
 */
function calculateDeliveryFee(subtotal, orderType = 'Home Delivery', isPremiumSubscriber = false) {
  if (orderType === 'Takeaway') return 0;
  if (isPremiumSubscriber) return 0;
  if (subtotal > 499) return 0;
  return 30.00; // Client approved delivery fee
}

/**
 * Updates cart badge counters on all open navbar cart icons
 */
function updateCartBadges() {
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

/**
 * Shows interactive toast notification
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadges();
});
