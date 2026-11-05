/* ===================================================
   BREW & BEAN — Dynamic Products & Menu Integration
   Connects to Supabase with product_variants
   =================================================== */

let _cachedProducts = [];
let _cachedCategories = [];

/**
 * Clear in-memory product cache to force fresh fetch
 */
function clearProductsCache() {
  _cachedProducts = [];
  _cachedCategories = [];
}

/**
 * Fetch all available products and their size variants from Supabase
 */
async function fetchProducts(forceRefresh = false) {
  if (!forceRefresh && _cachedProducts.length > 0) return _cachedProducts;

  const sb = getSupabase();
  if (sb) {
    try {
      // Query products joined with product_variants
      const { data, error } = await sb
        .from('products')
        .select('*, product_variants(id, size, price)')
        .eq('is_available', true)
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        _cachedProducts = data.map(p => {
          const variants = (p.product_variants && p.product_variants.length > 0)
            ? p.product_variants
            : [{ size: 'Regular', price: Number(p.price) }];

          // Sort variants: Small -> Medium -> Large
          const order = { 'small': 1, 'medium': 2, 'large': 3, 'regular': 1, 'choco': 1, 'blueberry': 2 };
          variants.sort((a, b) => (order[a.size.toLowerCase()] || 9) - (order[b.size.toLowerCase()] || 9));

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            category_id: p.category_id,
            price: Number(variants[0].price), // Starting/Base price
            variants: variants,
            image_url: p.image_url,
            badge: p.badge || '',
            rating: p.rating || 4.8,
            reviews: p.reviews || 120,
            ingredients: p.ingredients,
            calories: p.calories,
            is_available: p.is_available
          };
        });
        return _cachedProducts;
      }
      if (error) {
        console.warn('Supabase products query note:', error.message);
      }
    } catch (err) {
      console.warn('Error fetching products from Supabase, using client dataset fallback:', err);
    }
  }

  // Fallback to local verified client dataset
  if (typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0) {
    _cachedProducts = PRODUCTS;
    return _cachedProducts;
  }

  return [];
}

/**
 * Fetch all approved categories from Supabase
 */
async function fetchCategories() {
  if (_cachedCategories.length > 0) return _cachedCategories;

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        _cachedCategories = data;
        return _cachedCategories;
      }
    } catch (err) {
      console.warn('Error fetching categories from Supabase:', err);
    }
  }

  // Fallback categories matching client menu
  _cachedCategories = typeof CATEGORIES_DATA !== 'undefined' ? CATEGORIES_DATA : [
    { id: 1, name: "Hot Coffee", slug: "hot-coffee" },
    { id: 2, name: "Cold Coffee", slug: "cold-coffee" },
    { id: 3, name: "Tea & Refreshments", slug: "tea-refreshments" },
    { id: 4, name: "Snacks", slug: "snacks" },
    { id: 5, name: "Desserts", slug: "desserts" }
  ];
  return _cachedCategories;
}

/**
 * Fetch single product by ID with all its variants
 */
async function fetchProductById(id) {
  const numId = Number(id);
  const all = await fetchProducts();
  return all.find(p => Number(p.id) === numId) || all[0];
}

/**
 * Builds HTML card for a product
 */
function buildProductCard(product) {
  const badgeHTML = product.badge
    ? `<span class="product-badge ${product.badge}">${product.badge}</span>`
    : '';

  const img = product.image_url || product.image || 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80';
  
  // Format price & available sizes
  const variants = product.variants || [];
  let priceText = `₹${Math.round(product.price)}`;
  let sizesText = '';

  if (variants.length > 1) {
    const minPrice = Math.min(...variants.map(v => Number(v.price)));
    const maxPrice = Math.max(...variants.map(v => Number(v.price)));
    priceText = minPrice === maxPrice ? `₹${minPrice}` : `From ₹${minPrice}`;
    sizesText = `<span style="font-size:0.75rem; color:var(--caramel); font-weight:600; margin-left:6px;">(${variants.map(v => v.size).join(', ')})</span>`;
  }

  // Pretty category label
  const catMap = {
    'hot-coffee': 'Hot Coffee',
    'cold-coffee': 'Cold Coffee',
    'tea-refreshments': 'Tea & Refreshments',
    'snacks': 'Snacks',
    'desserts': 'Desserts'
  };
  const categoryLabel = catMap[product.category] || product.categoryLabel || 'Artisanal';

  return `
    <div class="product-card reveal" data-id="${product.id}" data-category="${product.category}">
      <div class="product-card-img">
        <img src="${img}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&q=80'">
        ${badgeHTML}
      </div>
      <div class="product-card-body">
        <span class="product-category">${categoryLabel}</span>
        <h4 class="product-name">${product.name}</h4>
        <p class="product-desc">${product.description || ''}</p>
        <div class="product-rating">
          ${renderStars(product.rating || 4.8)}
          <span class="rating-count">(${product.reviews || 120})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price">${priceText} ${sizesText}</span>
        </div>
      </div>
      <div class="product-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="navigateToProduct(${product.id})">Customize & Details</button>
        <button class="btn btn-primary btn-sm" onclick="quickAddToCart(${product.id})">
          <span>🛒</span> Add
        </button>
      </div>
    </div>
  `;
}

/**
 * Navigate to product detail page
 */
function navigateToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

/**
 * Quick add first/primary size of product
 */
async function quickAddToCart(productId) {
  const prod = await fetchProductById(productId);
  if (prod) {
    const defaultSize = (prod.variants && prod.variants.length > 0) ? prod.variants[0].size : 'Regular';
    addToCart(prod, defaultSize, 1);
  }
}

/**
 * Render star icons
 */
function renderStars(rating, total = 5) {
  let html = '<span class="stars">';
  const num = Number(rating) || 5;
  for (let i = 1; i <= total; i++) {
    if (i <= Math.floor(num)) html += '★';
    else if (i - 0.5 <= num) html += '★';
    else html += '☆';
  }
  html += '</span>';
  return html;
}
