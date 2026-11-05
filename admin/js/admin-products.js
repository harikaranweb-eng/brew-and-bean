/* ===================================================
   BREW & BEAN — Admin Products Management
   Handles: Product Table, Add/Edit Product, Variants,
            Image Upload to Supabase Storage, Toggle Availability
   =================================================== */

let _adminProducts = [];
let _adminCategories = [];
let _editingProductId = null;
let _selectedImageFile = null;

// Fallback categories in case network or DB is temporarily slow
const DEFAULT_CATEGORIES = [
  { id: 1, name: "Hot Coffee", slug: "hot-coffee" },
  { id: 2, name: "Cold Coffee", slug: "cold-coffee" },
  { id: 3, name: "Tea & Refreshments", slug: "tea-refreshments" },
  { id: 4, name: "Snacks", slug: "snacks" },
  { id: 5, name: "Desserts", slug: "desserts" }
];

/**
 * Load and render all products
 */
async function loadAdminProducts() {
  const sb = getSupabase();
  if (!sb) return;

  const tableBody = document.getElementById('products-table-body');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">
          <div class="spinner" style="margin: 0 auto 12px;"></div>
          <p>Loading products from Supabase...</p>
        </td>
      </tr>
    `;
  }

  try {
    // 1. Fetch categories for dropdowns & labels
    const { data: categories, error: catError } = await sb
      .from('categories')
      .select('*')
      .order('id');

    if (!catError && categories && categories.length > 0) {
      _adminCategories = categories;
    } else {
      _adminCategories = DEFAULT_CATEGORIES;
    }
    populateCategoryDropdowns();

    // 2. Fetch products with variants
    const { data, error } = await sb
      .from('products')
      .select('*, product_variants(id, size, price)')
      .order('id', { ascending: false });

    if (error) throw error;

    _adminProducts = data || [];
    renderProductsTable();
  } catch (err) {
    console.error("Error loading products:", err);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">
            <div class="empty-icon">⚠️</div>
            <p>Failed to load products: ${escapeHtml(err.message)}</p>
          </td>
        </tr>
      `;
    }
  }
}

/**
 * Filter & render products table
 */
function renderProductsTable() {
  const tableBody = document.getElementById('products-table-body');
  if (!tableBody) return;

  const search = (document.getElementById('product-search')?.value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('product-category-filter')?.value || 'all';
  const availFilter = document.getElementById('product-avail-filter')?.value || 'all';

  let filtered = _adminProducts.filter(p => {
    const matchCat = categoryFilter === 'all' || 
      p.category === categoryFilter || 
      String(p.category_id) === categoryFilter;
    const matchAvail = availFilter === 'all' || (availFilter === 'available' ? p.is_available : !p.is_available);
    const matchSearch = !search || 
      p.name.toLowerCase().includes(search) || 
      (p.description && p.description.toLowerCase().includes(search));
    return matchCat && matchAvail && matchSearch;
  });

  const countEl = document.getElementById('products-count-badge');
  if (countEl) countEl.textContent = `${filtered.length} products`;

  const sidebarBadge = document.getElementById('sidebar-products-badge');
  if (sidebarBadge) sidebarBadge.textContent = _adminProducts.length;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty">
          <div class="empty-icon">☕</div>
          <p>No products match your criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(p => {
    const imgUrl = p.image_url || 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80';
    const variants = p.product_variants || [];
    
    // Price display
    let priceBadge = `₹${Math.round(p.price)}`;
    if (variants.length > 1) {
      const min = Math.min(...variants.map(v => Number(v.price)));
      const max = Math.max(...variants.map(v => Number(v.price)));
      priceBadge = min === max ? `₹${min}` : `₹${min} – ₹${max}`;
    }

    const sizesList = variants.length > 0 
      ? variants.map(v => `<span class="badge badge-secondary" style="margin-right:2px; font-size:0.7rem;">${escapeHtml(v.size)}: ₹${Math.round(v.price)}</span>`).join('') 
      : `<span class="badge badge-secondary" style="font-size:0.7rem;">Standard: ₹${Math.round(p.price)}</span>`;

    const catObj = _adminCategories.find(c => c.slug === p.category || c.id === p.category_id);
    const catName = catObj ? catObj.name : (p.category || 'Coffee');

    return `
      <tr>
        <td style="width: 60px;">
          <img src="${imgUrl}" alt="${escapeHtml(p.name)}" class="product-thumb" onerror="this.src='https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&q=80'">
        </td>
        <td>
          <div style="font-weight: 600; color: var(--dark);">${escapeHtml(p.name)}</div>
          <div style="font-size: 0.78rem; color: var(--gray-400); max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(p.description || '')}
          </div>
        </td>
        <td>
          <span class="badge badge-coffee">${escapeHtml(catName)}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--coffee);">${priceBadge}</div>
          <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 2px;">
            ${sizesList}
          </div>
        </td>
        <td>
          <button 
            type="button" 
            class="badge ${p.is_available ? 'badge-success' : 'badge-error'}" 
            style="border: none; cursor: pointer;"
            onclick="toggleProductAvailability(${p.id}, ${!p.is_available})"
            title="Click to toggle availability"
          >
            <span class="avail-dot ${p.is_available ? 'on' : 'off'}"></span>
            ${p.is_available ? 'Available' : 'Unavailable'}
          </button>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn btn-secondary btn-xs" onclick="openEditProductModal(${p.id})">✏️ Edit</button>
            <button class="btn btn-danger btn-xs" onclick="confirmDeleteProduct(${p.id}, '${escapeHtml(p.name)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Toggle product availability (instant live update)
 */
async function toggleProductAvailability(productId, newStatus) {
  const sb = getSupabase();
  if (!sb) return;

  try {
    const { error } = await sb
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', productId);

    if (error) throw error;

    // Update locally
    const item = _adminProducts.find(p => p.id === productId);
    if (item) item.is_available = newStatus;

    renderProductsTable();
    showAdminToast(`Product availability updated!`, 'success');
  } catch (err) {
    console.error("Error updating availability:", err);
    showAdminToast(`Failed to update status: ${err.message}`, 'error');
  }
}

/**
 * Populate Category selects in forms and filter
 */
function populateCategoryDropdowns() {
  const filterSelect = document.getElementById('product-category-filter');
  const modalSelect = document.getElementById('product-modal-category');

  const options = _adminCategories.map(c => `<option value="${c.slug}">${escapeHtml(c.name)}</option>`).join('');

  if (filterSelect) {
    filterSelect.innerHTML = `<option value="all">All Categories</option>` + options;
  }
  if (modalSelect) {
    modalSelect.innerHTML = `<option value="">Select Category...</option>` + options;
  }
}

/**
 * Add / Edit Modal Management
 */
function openAddProductModal() {
  _editingProductId = null;
  _selectedImageFile = null;

  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-modal-form').reset();
  document.getElementById('product-modal-id').value = '';
  document.getElementById('product-preview-container').style.display = 'none';
  document.getElementById('product-image-preview').src = '';
  document.getElementById('product-image-url').value = '';
  document.getElementById('product-modal-available').checked = true;

  // Make sure categories dropdown is populated
  if (!_adminCategories || _adminCategories.length === 0) {
    _adminCategories = DEFAULT_CATEGORIES;
  }
  populateCategoryDropdowns();

  // Default variants: Small, Medium, Large
  renderVariantRows([
    { size: 'Small', price: '' },
    { size: 'Medium', price: '' },
    { size: 'Large', price: '' }
  ]);

  document.getElementById('product-modal').classList.add('open');
}

function openEditProductModal(id) {
  const product = _adminProducts.find(p => p.id === id);
  if (!product) return;

  _editingProductId = id;
  _selectedImageFile = null;

  document.getElementById('product-modal-title').textContent = `Edit Product: ${product.name}`;
  document.getElementById('product-modal-id').value = product.id;
  document.getElementById('product-modal-name').value = product.name;
  document.getElementById('product-modal-desc').value = product.description || '';
  document.getElementById('product-modal-available').checked = product.is_available;
  document.getElementById('product-image-url').value = product.image_url || '';

  // Ensure categories are loaded and selected
  populateCategoryDropdowns();
  document.getElementById('product-modal-category').value = product.category || '';

  // Image preview
  if (product.image_url) {
    document.getElementById('product-image-preview').src = product.image_url;
    document.getElementById('product-preview-container').style.display = 'block';
  } else {
    document.getElementById('product-preview-container').style.display = 'none';
  }

  // Load existing variants
  const variants = product.product_variants && product.product_variants.length > 0
    ? product.product_variants.map(v => ({ size: v.size, price: v.price }))
    : [{ size: 'Regular', price: product.price }];

  renderVariantRows(variants);

  document.getElementById('product-modal').classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

/**
 * Preset Buttons Handler (S/M/L, Single Price, Muffin Flavors)
 */
function applyVariantPreset(type) {
  if (type === 'sml') {
    renderVariantRows([
      { size: 'Small', price: '' },
      { size: 'Medium', price: '' },
      { size: 'Large', price: '' }
    ]);
  } else if (type === 'single') {
    renderVariantRows([
      { size: 'Regular', price: '' }
    ]);
  } else if (type === 'muffin') {
    renderVariantRows([
      { size: 'Chocolate', price: '' },
      { size: 'Blueberry', price: '' }
    ]);
  }
}

/**
 * Variants Dynamic Form Rows
 */
function renderVariantRows(variants) {
  const container = document.getElementById('variants-container');
  if (!container) return;

  container.innerHTML = variants.map((v, i) => `
    <div class="variant-row" data-index="${i}">
      <input 
        type="text" 
        class="form-input variant-size-input" 
        placeholder="Size/Option (e.g. Small, Medium, Choco, Regular)" 
        value="${escapeHtml(v.size || '')}" 
      >
      <input 
        type="number" 
        step="1" 
        min="0" 
        class="form-input variant-price-input" 
        placeholder="Price (₹)" 
        value="${v.price !== undefined && v.price !== '' ? Number(v.price) : ''}" 
      >
      <button type="button" class="btn-remove-variant" onclick="removeVariantRow(this)" title="Remove size">✕</button>
    </div>
  `).join('');
}

function addVariantRow(size = '', price = '') {
  const container = document.getElementById('variants-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'variant-row';
  div.innerHTML = `
    <input 
      type="text" 
      class="form-input variant-size-input" 
      placeholder="Size/Option (e.g. Large, Regular)" 
      value="${escapeHtml(size)}" 
    >
    <input 
      type="number" 
      step="1" 
      min="0" 
      class="form-input variant-price-input" 
      placeholder="Price (₹)" 
      value="${price}" 
    >
    <button type="button" class="btn-remove-variant" onclick="removeVariantRow(this)" title="Remove size">✕</button>
  `;
  container.appendChild(div);
}

function removeVariantRow(btn) {
  const row = btn.closest('.variant-row');
  const container = document.getElementById('variants-container');
  if (container.querySelectorAll('.variant-row').length <= 1) {
    showAdminToast('A product must have at least one size/price option.', 'warning');
    return;
  }
  row.remove();
}

/**
 * Image file selection & preview
 */
function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate size (< 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAdminToast('File size must be under 5MB.', 'error');
    event.target.value = '';
    return;
  }

  // Validate type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    showAdminToast('Please upload a valid image file (JPEG, PNG, WebP).', 'error');
    event.target.value = '';
    return;
  }

  _selectedImageFile = file;

  // Show local preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('product-image-preview').src = e.target.result;
    document.getElementById('product-preview-container').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage() {
  _selectedImageFile = null;
  const fileInput = document.getElementById('product-image-file');
  if (fileInput) fileInput.value = '';
  document.getElementById('product-image-preview').src = '';
  document.getElementById('product-preview-container').style.display = 'none';
  document.getElementById('product-image-url').value = '';
}

/**
 * Upload Image to Supabase Storage Bucket 'product-images'
 */
async function uploadProductImage(file) {
  const sb = getSupabase();
  if (!sb || !file) return null;

  const fileExt = file.name.split('.').pop();
  const cleanBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const fileName = `bb-${cleanBaseName}-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const progressBar = document.getElementById('upload-progress-bar');
  const progressContainer = document.getElementById('upload-progress');
  if (progressContainer) progressContainer.classList.add('show');
  if (progressBar) progressBar.style.width = '50%';

  try {
    const { data, error } = await sb.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn("Storage upload note:", error.message);
      showAdminToast(`Image upload notice: ${error.message}. Product will be saved with URL/fallback.`, 'warning');
      return null;
    }

    if (progressBar) progressBar.style.width = '100%';

    // Get public URL
    const { data: { publicUrl } } = sb.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error("Storage upload exception:", err);
    return null;
  } finally {
    setTimeout(() => {
      if (progressContainer) progressContainer.classList.remove('show');
      if (progressBar) progressBar.style.width = '0%';
    }, 600);
  }
}

/**
 * Save Product (Create or Update)
 */
async function saveProduct(event) {
  event.preventDefault();
  const sb = getSupabase();
  if (!sb) {
    showAdminToast('Database connection unavailable. Please check credentials.', 'error');
    return;
  }

  const saveBtn = document.getElementById('product-save-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span>Saving...</span>';

  let newlyCreatedProductId = null;

  try {
    const name = (document.getElementById('product-modal-name')?.value || '').trim();
    const description = (document.getElementById('product-modal-desc')?.value || '').trim();
    const category = document.getElementById('product-modal-category')?.value || '';
    const isAvailable = document.getElementById('product-modal-available')?.checked ?? true;
    let imageUrl = (document.getElementById('product-image-url')?.value || '').trim();

    // 1. Validate required fields
    if (!name) {
      document.getElementById('product-modal-name')?.focus();
      throw new Error('Please enter a product name.');
    }

    if (!category) {
      document.getElementById('product-modal-category')?.focus();
      throw new Error('Please select a category for this product.');
    }

    // 2. Gather and validate variants
    const variantRows = document.querySelectorAll('#variants-container .variant-row');
    const variants = [];
    const seenSizes = new Set();

    variantRows.forEach(row => {
      const sizeInput = row.querySelector('.variant-size-input');
      const priceInput = row.querySelector('.variant-price-input');
      if (sizeInput && priceInput) {
        const size = sizeInput.value.trim();
        const priceVal = priceInput.value.trim();

        // Skip completely blank rows
        if (!size && !priceVal) return;

        if (!size) {
          throw new Error('Please enter a size or option name for every row (e.g. Small, Medium, Large, or Regular).');
        }

        const price = parseFloat(priceVal);
        if (isNaN(price) || price < 0) {
          throw new Error(`Invalid price for size "${size}". Price must be ₹0 or higher.`);
        }

        const normalizedSize = size.toLowerCase();
        if (seenSizes.has(normalizedSize)) {
          throw new Error(`Duplicate size "${size}". Each size option must have a unique name.`);
        }
        seenSizes.add(normalizedSize);

        variants.push({ size, price: Math.round(price) });
      }
    });

    if (variants.length === 0) {
      throw new Error('Please add at least one valid size/option with a price.');
    }

    // 3. Base price = lowest variant price
    const basePrice = Math.min(...variants.map(v => v.price));

    // 4. Category mapping
    let finalCategory = category;
    let categoryId = null;

    const catObj = _adminCategories.find(c => 
      c.slug === category || 
      String(c.id) === category || 
      c.name.toLowerCase() === category.toLowerCase()
    );

    if (catObj) {
      finalCategory = catObj.slug || catObj.name.toLowerCase().replace(/\s+/g, '-');
      categoryId = catObj.id;
    }

    // 5. Upload image if a new file was chosen
    if (_selectedImageFile) {
      try {
        const uploadedUrl = await uploadProductImage(_selectedImageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } catch (imgErr) {
        console.warn("Image upload non-fatal warning:", imgErr);
      }
    }

    if (!imageUrl) {
      imageUrl = 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80';
    }

    // 6. Upsert into `products` table
    let productId = _editingProductId;

    if (productId) {
      // UPDATE existing product
      const { error: updateErr } = await sb
        .from('products')
        .update({
          name,
          description,
          category: finalCategory,
          category_id: categoryId,
          price: basePrice,
          image_url: imageUrl,
          is_available: isAvailable
        })
        .eq('id', productId);

      if (updateErr) throw updateErr;

      // Update variants: delete existing and re-insert
      const { error: delVarErr } = await sb
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      if (delVarErr) throw delVarErr;

    } else {
      // INSERT new product
      const { data: newProd, error: insertErr } = await sb
        .from('products')
        .insert([{
          name,
          description,
          category: finalCategory,
          category_id: categoryId,
          price: basePrice,
          image_url: imageUrl,
          is_available: isAvailable,
          badge: '',
          rating: 4.8,
          reviews: 120
        }])
        .select('id, name')
        .single();

      if (insertErr) throw insertErr;
      if (!newProd || !newProd.id) throw new Error("Failed to retrieve created product ID.");
      
      productId = newProd.id;
      newlyCreatedProductId = newProd.id;
    }

    // 7. Insert variants
    const variantRowsToInsert = variants.map(v => ({
      product_id: productId,
      size: v.size,
      price: v.price
    }));

    const { error: varInsertErr } = await sb
      .from('product_variants')
      .insert(variantRowsToInsert);

    if (varInsertErr) {
      // Rollback newly inserted product if variants fail
      if (newlyCreatedProductId) {
        await sb.from('products').delete().eq('id', newlyCreatedProductId);
      }
      throw new Error("Product saved, but failed to save sizes/prices: " + varInsertErr.message);
    }

    // 8. Invalidate all local caches so customer menu updates immediately
    if (typeof _cachedProducts !== 'undefined') _cachedProducts = [];
    if (typeof _cachedCategories !== 'undefined') _cachedCategories = [];

    // Close modal & notify
    closeProductModal();
    showAdminToast(
      _editingProductId ? `"${name}" updated successfully! ☕` : `"${name}" added to menu successfully! ☕`,
      'success'
    );

    // Refresh products table
    await loadAdminProducts();

    // Refresh dashboard stats if function exists
    if (typeof loadDashboardMetrics === 'function') {
      loadDashboardMetrics();
    }

  } catch (err) {
    console.error("Save product error:", err);
    showAdminToast(err.message || 'Failed to save product.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>Save Product</span>';
  }
}

/**
 * Delete Product Confirmation & Execution
 */
let _deletingProductId = null;

function confirmDeleteProduct(id, name) {
  _deletingProductId = id;
  const dialog = document.getElementById('confirm-dialog-overlay');
  document.getElementById('confirm-title').textContent = 'Delete Product';
  document.getElementById('confirm-msg').innerHTML = `Are you sure you want to delete <strong>${escapeHtml(name)}</strong>?<br>This will also remove all its size variants.`;
  dialog.classList.add('open');
}

async function executeDeleteProduct() {
  if (!_deletingProductId) return;
  const sb = getSupabase();
  if (!sb) return;

  closeConfirmDialog();

  try {
    // Foreign key CASCADE will remove product_variants
    const { error } = await sb
      .from('products')
      .delete()
      .eq('id', _deletingProductId);

    if (error) throw error;

    showAdminToast('Product deleted successfully.', 'success');
    await loadAdminProducts();

    if (typeof loadDashboardMetrics === 'function') {
      loadDashboardMetrics();
    }
  } catch (err) {
    console.error("Delete product error:", err);
    showAdminToast(`Could not delete product: ${err.message}`, 'error');
  } finally {
    _deletingProductId = null;
  }
}

function closeConfirmDialog() {
  document.getElementById('confirm-dialog-overlay').classList.remove('open');
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
