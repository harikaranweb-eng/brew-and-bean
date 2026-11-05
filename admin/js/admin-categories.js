/* ===================================================
   BREW & BEAN — Admin Category Management
   Handles: Add, Edit, View, and Safe Delete/Archive
   =================================================== */

let _categoriesList = [];
let _editingCategoryId = null;

async function loadAdminCategories() {
  const sb = getSupabase();
  if (!sb) return;

  const container = document.getElementById('categories-grid');
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray-400);">
        <div class="spinner" style="margin: 0 auto 12px;"></div>
        <p>Loading categories...</p>
      </div>
    `;
  }

  try {
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    _categoriesList = data || [];
    renderCategoriesGrid();
  } catch (err) {
    console.error("Error loading categories:", err);
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--error);">
          Failed to load categories: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}

function renderCategoriesGrid() {
  const container = document.getElementById('categories-grid');
  if (!container) return;

  if (_categoriesList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray-400);">
        No categories found. Click "+ Add Category" to create one.
      </div>
    `;
    return;
  }

  container.innerHTML = _categoriesList.map(cat => `
    <div class="cat-card">
      <div class="cat-info">
        <div class="cat-name">${escapeHtml(cat.name)}</div>
        <div class="cat-slug">Slug: <code>${escapeHtml(cat.slug)}</code></div>
        ${cat.description ? `<div style="font-size:0.75rem; color:var(--gray-400); margin-top:4px;">${escapeHtml(cat.description)}</div>` : ''}
      </div>
      <div class="cat-actions">
        <button class="btn btn-secondary btn-xs" onclick="openEditCategoryModal(${cat.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-xs" onclick="safeDeleteCategory(${cat.id}, '${escapeHtml(cat.name)}', '${escapeHtml(cat.slug)}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openAddCategoryModal() {
  _editingCategoryId = null;
  document.getElementById('cat-modal-title').textContent = 'Add Category';
  document.getElementById('cat-modal-form').reset();
  document.getElementById('cat-modal-id').value = '';
  document.getElementById('category-modal').classList.add('open');
}

function openEditCategoryModal(id) {
  const cat = _categoriesList.find(c => c.id === id);
  if (!cat) return;

  _editingCategoryId = id;
  document.getElementById('cat-modal-title').textContent = `Edit Category: ${cat.name}`;
  document.getElementById('cat-modal-id').value = cat.id;
  document.getElementById('cat-modal-name').value = cat.name;
  document.getElementById('cat-modal-slug').value = cat.slug;
  document.getElementById('cat-modal-desc').value = cat.description || '';
  document.getElementById('category-modal').classList.add('open');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('open');
}

// Auto slug generator on name input
function handleCategoryNameInput(input) {
  if (_editingCategoryId) return; // Don't overwrite slug when editing existing
  const slugInput = document.getElementById('cat-modal-slug');
  if (slugInput) {
    slugInput.value = input.value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

async function saveCategory(event) {
  event.preventDefault();
  const sb = getSupabase();
  if (!sb) return;

  const btn = document.getElementById('cat-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span>Saving...</span>';

  try {
    const name = document.getElementById('cat-modal-name').value.trim();
    const slug = document.getElementById('cat-modal-slug').value.trim();
    const description = document.getElementById('cat-modal-desc').value.trim();

    if (!name || !slug) {
      throw new Error('Category name and slug are required.');
    }

    if (_editingCategoryId) {
      // Update
      const { error } = await sb
        .from('categories')
        .update({ name, slug, description })
        .eq('id', _editingCategoryId);

      if (error) throw error;
      showAdminToast('Category updated successfully!', 'success');
    } else {
      // Insert
      const { error } = await sb
        .from('categories')
        .insert([{ name, slug, description }]);

      if (error) throw error;
      showAdminToast('New category added successfully!', 'success');
    }

    closeCategoryModal();
    await loadAdminCategories();

    // Also reload product categories dropdown
    if (typeof populateCategoryDropdowns === 'function') {
      _adminCategories = _categoriesList;
      populateCategoryDropdowns();
    }

  } catch (err) {
    console.error("Save category error:", err);
    showAdminToast(err.message || 'Failed to save category.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Save Category</span>';
  }
}

/**
 * Safe delete category — checks if any products use it first!
 */
async function safeDeleteCategory(id, name, slug) {
  const sb = getSupabase();
  if (!sb) return;

  try {
    // 1. Verify if any product uses this category
    const { count, error: countErr } = await sb
      .from('products')
      .select('*', { count: 'exact', head: true })
      .or(`category.eq.${slug},category_id.eq.${id}`);

    if (countErr) {
      console.warn("Category usage check error:", countErr);
    }

    if (count && count > 0) {
      showAdminToast(
        `Cannot delete "${name}". It is assigned to ${count} product(s). Please reassign those products first.`,
        'error'
      );
      return;
    }

    // 2. If unused, prompt confirmation
    const confirmed = confirm(`Are you sure you want to delete category "${name}"?`);
    if (!confirmed) return;

    const { error: delErr } = await sb
      .from('categories')
      .delete()
      .eq('id', id);

    if (delErr) throw delErr;

    showAdminToast(`Category "${name}" deleted.`, 'success');
    await loadAdminCategories();

  } catch (err) {
    console.error("Delete category error:", err);
    showAdminToast(`Failed to delete category: ${err.message}`, 'error');
  }
}

