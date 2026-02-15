// Data storage key
const STORAGE_KEY = 'crazymama_quilts';

// Current state
let allQuilts = [];
let activeCategory = 'all';
let favoriteCategory = 'all';
let isEditing = false;
let editingQuiltId = null;
let hasLoadedData = false;

// Initialize application
function initializeApp() {
    loadQuiltData();
    displayQuilts();
    displayCharityQuilts();
    displayFavorites();
    updateProjectListing();
    const hasFavorites = allQuilts.some(quilt => quilt.isFavorite);
    const shouldShowAll = allQuilts.length > 0 && !hasFavorites;
    handleViewSelect(shouldShowAll ? 'view' : 'favorites');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Tab switching
function switchTab(tabName, clickedButton) {
    const buttons = document.querySelectorAll('.tab-button');
    const sections = document.querySelectorAll('.tab-content');
    
    if (buttons.length) {
        buttons.forEach(btn => btn.classList.remove('selected'));
        const targetButton = clickedButton || Array.from(buttons).find(btn => {
            const handler = btn.getAttribute('onclick');
            return handler && handler.includes(`'${tabName}'`);
        });
        if (targetButton) {
            targetButton.classList.add('selected');
        }
    }
    sections.forEach(sec => sec.classList.remove('visible'));
    
    const targetSection = document.getElementById(tabName + '-section');
    if (targetSection) {
        targetSection.classList.add('visible');
    }
    const viewSelect = document.querySelector('.view-select');
    if (viewSelect) {
        viewSelect.classList.toggle('hidden', tabName === 'admin' || tabName === 'new-quilt');
    }
    updateViewFilterVisibility(tabName);
    const projectListing = document.getElementById('project-listing');
    if (projectListing) {
        projectListing.style.display = tabName === 'new-quilt' ? 'none' : '';
    }
    
    if (tabName === 'view') {
        displayQuilts();
    } else if (tabName === 'admin') {
        closeQuiltEditor();
        updateProjectListing();
    } else if (tabName === 'charity') {
        displayCharityQuilts();
    } else if (tabName === 'favorites') {
        displayFavorites();
    } else if (tabName === 'new-quilt') {
        openQuiltEditor(false);
    }
}

function handleViewSelect(viewName) {
    const select = document.getElementById('view-select');
    if (select && viewName) {
        select.value = viewName;
    }
    switchTab(viewName, null);
    if (viewName === 'view') {
        updateCategoryButtonSelection('.category-btn:not(.favorite-category-btn)', activeCategory);
        displayQuilts();
    } else if (viewName === 'favorites') {
        updateCategoryButtonSelection('.favorite-category-btn', favoriteCategory);
        displayFavorites();
    } else if (viewName === 'charity') {
        displayCharityQuilts();
    }
}

function updateViewFilterVisibility(viewName) {
    const viewFilters = document.querySelector('.view-select .view-filters');
    const favoriteFilters = document.querySelector('.view-select .favorite-filters');
    if (viewFilters) {
        viewFilters.style.display = viewName === 'view' ? 'flex' : 'none';
    }
    if (favoriteFilters) {
        favoriteFilters.style.display = viewName === 'favorites' ? 'flex' : 'none';
    }
}

function reapplyCurrentViewFilters() {
    const select = document.getElementById('view-select');
    const viewName = select ? select.value : null;
    if (!viewName) {
        return;
    }
    updateViewFilterVisibility(viewName);
    if (viewName === 'view') {
        updateCategoryButtonSelection('.category-btn:not(.favorite-category-btn)', activeCategory);
        displayQuilts();
    } else if (viewName === 'favorites') {
        updateCategoryButtonSelection('.favorite-category-btn', favoriteCategory);
        displayFavorites();
    } else if (viewName === 'charity') {
        displayCharityQuilts();
    }
}

function updateCategoryButtonSelection(buttonSelector, category, clickedButton) {
    const buttons = document.querySelectorAll(buttonSelector);
    buttons.forEach(btn => btn.classList.remove('selected'));
    let targetButton = clickedButton;
    if (!targetButton && category) {
        targetButton = Array.from(buttons).find(btn => {
            const handler = btn.getAttribute('onclick');
            return handler && handler.includes(`'${category}'`);
        });
    }
    if (targetButton) {
        targetButton.classList.add('selected');
    }
}

// Category filtering
function filterByCategory(category, clickedButton) {
    activeCategory = category;
    updateCategoryButtonSelection('.category-btn:not(.favorite-category-btn)', category, clickedButton);
    displayQuilts();
}

// Favorite category filtering
function filterFavoritesByCategory(category, clickedButton) {
    favoriteCategory = category;
    updateCategoryButtonSelection('.favorite-category-btn', category, clickedButton);
    displayFavorites();
}

// Load data from localStorage
function loadQuiltData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            allQuilts = JSON.parse(stored);
        } catch (e) {
            allQuilts = [];
        }
    } else {
        allQuilts = [];
    }

    if (!Array.isArray(allQuilts)) {
        allQuilts = [];
    }

    allQuilts = allQuilts.map(quilt => {
        const normalizedCategory = normalizeCategory(quilt.category);
        return {
            ...quilt,
            category: normalizedCategory,
            isCharity: Boolean(quilt.isCharity),
            isFavorite: Boolean(quilt.isFavorite)
        };
    });
    hasLoadedData = true;
}

function ensureQuiltDataLoaded() {
    if (!hasLoadedData) {
        loadQuiltData();
    }
}

// Save data to localStorage
function saveQuiltData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allQuilts));
}

function exportQuilts() {
    ensureQuiltDataLoaded();
    const payload = JSON.stringify(allQuilts, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `crazymama-quilts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showBanner('Backup downloaded successfully.', { type: 'success' });
}

function handleImportFile(event) {
    const input = event ? event.target : null;
    const file = input && input.files ? input.files[0] : null;
    if (!file) {
        showBanner('Please select a quilt data file to import.', { type: 'error' });
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        let imported;
        try {
            imported = JSON.parse(e.target.result);
        } catch (error) {
            showBanner('Import failed. The file does not contain valid JSON.', { type: 'error' });
            if (input) {
                input.value = '';
            }
            return;
        }

        if (!Array.isArray(imported)) {
            showBanner('Import failed. Expected a list of quilt projects.', { type: 'error' });
            if (input) {
                input.value = '';
            }
            return;
        }

        const todayStamp = new Date().toISOString().split('T')[0];
        let skipped = 0;
        const normalized = imported.map(entry => {
            const source = entry && typeof entry === 'object' ? entry : {};
            const title = typeof source.title === 'string' ? source.title.trim() : '';
            if (!title) {
                skipped += 1;
                return null;
            }
            const category = normalizeCategory(typeof source.category === 'string' ? source.category : '') || 'upcoming';
            const notes = typeof source.notes === 'string' ? source.notes : '';
            let deadline = typeof source.deadline === 'string' ? source.deadline : '';
            if (category === 'completed' && isFutureDate(deadline)) {
                deadline = '';
            }
            const completedDate = typeof source.completedDate === 'string' ? source.completedDate : '';
            const photo = typeof source.photo === 'string' ? source.photo : null;
            const timestamp = typeof source.timestamp === 'string' && source.timestamp ? source.timestamp : todayStamp;
            const isCharity = Boolean(source.isCharity);
            const isFavorite = Boolean(source.isFavorite);
            const id = typeof source.id === 'string' && source.id.trim() ? source.id.trim() : generateUniqueId();

            return {
                id: id,
                title: title,
                category: category,
                notes: notes,
                deadline: deadline,
                completedDate: completedDate,
                photo: photo,
                isCharity: isCharity,
                isFavorite: isFavorite,
                timestamp: timestamp
            };
        }).filter(Boolean);

        if (normalized.length === 0) {
            showBanner('No valid projects found in that backup.', { type: 'error' });
            if (input) {
                input.value = '';
            }
            return;
        }

        allQuilts = normalized;
        hasLoadedData = true;
        saveQuiltData();
        displayQuilts();
        displayCharityQuilts();
        displayFavorites();
        updateProjectListing();
        const hasFavorites = allQuilts.some(quilt => quilt.isFavorite);
        const shouldShowAll = allQuilts.length > 0 && !hasFavorites;
        if (shouldShowAll) {
            handleViewSelect('view');
        } else {
            reapplyCurrentViewFilters();
        }
        if (skipped > 0) {
            showBanner(`Imported ${normalized.length} project${normalized.length === 1 ? '' : 's'}. ${skipped} item${skipped === 1 ? '' : 's'} skipped.`, { type: 'warning' });
        } else {
            showBanner(`Imported ${normalized.length} project${normalized.length === 1 ? '' : 's'} successfully.`, { type: 'success' });
        }

        if (input) {
            input.value = '';
        }
    };

    reader.onerror = function() {
        showBanner('Import failed. Unable to read the selected file.', { type: 'error' });
        if (input) {
            input.value = '';
        }
    };

    reader.readAsText(file);
}

// Banner notifications
function ensureBannerContainer() {
    let container = document.getElementById('banner-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'banner-container';
        container.classList.add('banner-container');
        const wrapper = document.querySelector('.page-wrapper') || document.body;
        wrapper.insertBefore(container, wrapper.firstChild);
    }
    return container;
}

function showBanner(message, options = {}) {
    const container = ensureBannerContainer();
    container.innerHTML = '';
    const banner = document.createElement('div');
    banner.classList.add('banner');
    const type = options.type || 'info';
    if (['success', 'warning', 'info', 'error'].includes(type)) {
        banner.classList.add(`banner-${type}`);
    }

    const text = document.createElement('span');
    text.textContent = message;
    banner.appendChild(text);

    if (Array.isArray(options.actions) && options.actions.length > 0) {
        const actions = document.createElement('div');
        actions.classList.add('banner-actions');
        options.actions.forEach(action => {
            const button = document.createElement('button');
            button.type = 'button';
            button.classList.add('banner-btn');
            if (action.danger) {
                button.classList.add('danger');
            }
            button.textContent = action.label;
            button.addEventListener('click', () => {
                if (typeof action.onClick === 'function') {
                    action.onClick();
                }
            });
            actions.appendChild(button);
        });
        banner.appendChild(actions);
    }

    container.appendChild(banner);
    if (!Array.isArray(options.actions) || options.actions.length === 0) {
        const timeout = typeof options.timeout === 'number' ? options.timeout : 4000;
        if (timeout > 0) {
            window.setTimeout(() => dismissBanner(banner), timeout);
        }
    }
    return banner;
}

function dismissBanner(banner) {
    const container = document.getElementById('banner-container');
    const target = banner || (container ? container.firstElementChild : null);
    if (!target) return;

    target.classList.add('closing');
    window.setTimeout(() => {
        if (target.parentElement) {
            target.parentElement.removeChild(target);
        }
    }, 300);
}

// Render quilts in gallery
function renderQuiltGallery(quilts, galleryId, emptyId, emptyMessage) {
    const gallery = document.getElementById(galleryId);
    const emptyMsg = document.getElementById(emptyId);
    
    if (!gallery || !emptyMsg) return;
    
    if (quilts.length === 0) {
        gallery.style.display = 'none';
        emptyMsg.style.display = 'block';
        if (emptyMessage) {
            emptyMsg.textContent = emptyMessage;
        }
        return;
    }
    
    gallery.style.display = 'grid';
    emptyMsg.style.display = 'none';
    
    gallery.innerHTML = quilts.map(quilt => {
        const photoHtml = quilt.photo 
            ? `<img src="${quilt.photo}" alt="${sanitizeText(quilt.title)}" class="quilt-photo">`
            : '<div class="quilt-photo"></div>';
        
        const descSnippet = quilt.notes 
            ? truncateText(quilt.notes, 120)
            : '';
        
        const dateDisplay = quilt.deadline 
            ? `<p class="quilt-date">Due: ${formatDateDisplay(quilt.deadline)}</p>`
            : '';
        
        const charityTag = quilt.isCharity
            ? '<span class="status-tag status-charity">Charity</span>'
            : '';
        
        const favoriteLabel = quilt.isFavorite ? 'Unfavorite' : 'Favorite';
        const favoriteIcon = quilt.isFavorite ? '&#9733;' : '&#9734;';
        
        return `
            <div class="quilt-item" onclick="showDetails('${quilt.id}')">
                <button class="favorite-toggle ${quilt.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${quilt.id}', event)" aria-label="${favoriteLabel} ${sanitizeText(quilt.title)}" title="${favoriteLabel}">${favoriteIcon}</button>
                ${photoHtml}
                <div class="quilt-details">
                    <div class="quilt-header">
                        <h3 class="quilt-title">${sanitizeText(quilt.title)}</h3>
                        <div class="status-group">
                            <span class="status-tag ${getCategoryClass(quilt.category)}">${getCategoryLabel(quilt.category)}</span>
                            ${charityTag}
                        </div>
                    </div>
                    ${descSnippet ? `<p class="quilt-description">${sanitizeText(descSnippet)}</p>` : ''}
                    ${dateDisplay}
                </div>
            </div>
        `;
    }).join('');
}

function filterQuiltsByCategory(quilts, category) {
    if (category === 'all') {
        return quilts;
    }
    const normalizedCategory = normalizeCategory(category);
    if (normalizedCategory === 'upcoming') {
        return quilts.filter(quilt => isDueSoon(quilt) || normalizeCategory(quilt.category) === 'upcoming');
    }
    return quilts.filter(quilt => normalizeCategory(quilt.category) === normalizedCategory);
}

// Display quilts in gallery
function displayQuilts() {
    const filtered = filterQuiltsByCategory(allQuilts, activeCategory);
    renderQuiltGallery(filtered, 'quilt-display', 'empty-message');
}

// Display charity quilts
function displayCharityQuilts() {
    const charityQuilts = allQuilts.filter(q => q.isCharity);
    renderQuiltGallery(charityQuilts, 'charity-display', 'charity-empty');
}

// Display favorites
function displayFavorites() {
    let favoriteQuilts = allQuilts.filter(q => q.isFavorite);
    favoriteQuilts = filterQuiltsByCategory(favoriteQuilts, favoriteCategory);
    renderQuiltGallery(favoriteQuilts, 'favorites-display', 'favorites-empty');
}

// Update project listing in admin view
function updateProjectListing() {
    const listing = document.getElementById('project-listing');
    
    if (allQuilts.length === 0) {
        listing.innerHTML = '<p class="empty-state" style="display: block;">No projects to show.</p>';
        return;
    }
    
    listing.innerHTML = allQuilts.map(quilt => {
        const dateInfo = quilt.deadline 
            ? `<span class="project-date">Due: ${formatDateDisplay(quilt.deadline)}</span>`
            : '';
        const charityTag = quilt.isCharity
            ? '<span class="status-tag status-charity">Charity</span>'
            : '';
        const favoriteAction = quilt.isFavorite ? 'Unfavorite' : 'Favorite';
        const favoriteIcon = quilt.isFavorite ? '&#9733;' : '&#9734;';
        const photoHtml = quilt.photo 
            ? `<img src="${quilt.photo}" alt="${sanitizeText(quilt.title)}">`
            : '<div class="project-photo-placeholder"></div>';
        
        return `
            <div class="project-entry">
                <div class="project-main">
                    <div class="project-thumb">
                        ${photoHtml}
                    </div>
                    <div class="project-data">
                        <h4>${sanitizeText(quilt.title)}</h4>
                        <p class="project-meta">
                            <span class="status-tag ${getCategoryClass(quilt.category)}">${getCategoryLabel(quilt.category)}</span>
                            ${charityTag}
                            ${dateInfo}
                        </p>
                    </div>
                </div>
                <div class="project-controls">
                    <button class="favorite-btn ${quilt.isFavorite ? 'active' : ''}" onclick="toggleFavorite('${quilt.id}', event)" title="${favoriteAction}">${favoriteIcon} ${favoriteAction}</button>
                    <button class="modify-btn" onclick="startEdit('${quilt.id}')">Edit</button>
                    <button class="remove-btn" onclick="removeQuilt('${quilt.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Show quilt details in popup
function showDetails(quiltId) {
    const quilt = allQuilts.find(q => q.id === quiltId);
    if (!quilt) return;
    
    const popup = document.getElementById('detail-popup');
    const content = document.getElementById('popup-content');
    
    const photoHtml = quilt.photo 
        ? `<img src="${quilt.photo}" alt="${sanitizeText(quilt.title)}" class="popup-photo">`
        : '';
    
    const notesHtml = quilt.notes 
        ? `<p><strong>Description:</strong> ${sanitizeText(quilt.notes)}</p>`
        : '';
    
    const deadlineHtml = quilt.deadline 
        ? `<p><strong>Due Date:</strong> ${formatDateDisplay(quilt.deadline)}</p>`
        : '';
    
    const completedDateHtml = quilt.completedDate
        ? `<p><strong>Completed Date:</strong> ${formatDateDisplay(quilt.completedDate)}</p>`
        : '';
    
    const favoriteHtml = quilt.isFavorite
        ? '<p><strong>Favorite:</strong> Yes</p>'
        : '';
    
    const charityHtml = quilt.isCharity
        ? '<p><strong>Charity Quilt:</strong> Yes</p>'
        : '';
    
    const createdHtml = quilt.timestamp 
        ? `<p><strong>Added:</strong> ${formatDateDisplay(quilt.timestamp)}</p>`
        : '';
    
    content.innerHTML = `
        ${photoHtml}
        <h2>${sanitizeText(quilt.title)}</h2>
        <p><span class="status-tag ${getCategoryClass(quilt.category)}">${getCategoryLabel(quilt.category)}</span></p>
        ${favoriteHtml}
        ${charityHtml}
        ${notesHtml}
        ${deadlineHtml}
        ${completedDateHtml}
        ${createdHtml}
    `;
    
    popup.classList.add('active');
}

// Close popup
function closePopup() {
    document.getElementById('detail-popup').classList.remove('active');
}

// Open quilt editor
function openQuiltEditor(shouldNavigate = true) {
    if (shouldNavigate) {
        switchTab('new-quilt');
        return;
    }
    isEditing = false;
    editingQuiltId = null;
    
    document.getElementById('editor-heading').textContent = 'Add Quilt Project';
    resetQuiltEditorFields();
    document.getElementById('editor-panel').classList.remove('hidden');
    
    document.getElementById('editor-panel').scrollIntoView({ behavior: 'smooth' });
}

// Close quilt editor
function closeQuiltEditor() {
    document.getElementById('editor-panel').classList.add('hidden');
    resetQuiltEditorFields();
    isEditing = false;
    editingQuiltId = null;
}

function resetQuiltEditorFields() {
    const form = document.getElementById('quilt-editor');
    if (form) {
        form.reset();
    }
    document.getElementById('edit-id').value = '';
    document.getElementById('photo-display').innerHTML = '';
    const photoInput = document.getElementById('photo-upload');
    if (photoInput) {
        photoInput.value = '';
    }
    const titleInput = document.getElementById('project-title');
    if (titleInput) {
        titleInput.value = '';
    }
    const categoryInput = document.getElementById('project-category');
    if (categoryInput) {
        categoryInput.value = '';
    }
    const notesInput = document.getElementById('project-notes');
    if (notesInput) {
        notesInput.value = '';
    }
    const deadlineInput = document.getElementById('deadline');
    if (deadlineInput) {
        deadlineInput.value = '';
    }
    document.getElementById('project-charity').checked = false;
    document.getElementById('project-favorite').checked = false;
    const completedDateInput = document.getElementById('completed-date');
    if (completedDateInput) {
        completedDateInput.value = '';
    }
}

// Start editing a quilt
function startEdit(quiltId) {
    const quilt = allQuilts.find(q => q.id === quiltId);
    if (!quilt) return;
    
    switchTab('new-quilt');
    isEditing = true;
    editingQuiltId = quiltId;
    
    document.getElementById('editor-heading').textContent = 'Edit Quilt Project';
    document.getElementById('edit-id').value = quilt.id;
    document.getElementById('project-title').value = quilt.title;
    document.getElementById('project-category').value = quilt.category;
    document.getElementById('project-notes').value = quilt.notes || '';
    document.getElementById('deadline').value = quilt.deadline || '';
    document.getElementById('project-charity').checked = Boolean(quilt.isCharity);
    document.getElementById('project-favorite').checked = Boolean(quilt.isFavorite);
    const completedDateInput = document.getElementById('completed-date');
    if (completedDateInput) {
        completedDateInput.value = quilt.completedDate || '';
    }
    
    if (quilt.photo) {
        document.getElementById('photo-display').innerHTML = `<img src="${quilt.photo}" alt="Current photo">`;
    }
    
    document.getElementById('editor-panel').classList.remove('hidden');
    document.getElementById('editor-panel').scrollIntoView({ behavior: 'smooth' });
}

// Handle photo selection
function handlePhotoSelect(event) {
    const fileInput = event.target;
    const photoDisplay = document.getElementById('photo-display');
    
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const editorPanel = document.getElementById('editor-panel');
            if (editorPanel && editorPanel.classList.contains('hidden')) {
                return;
            }
            photoDisplay.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    ensureQuiltDataLoaded();
    const quiltId = document.getElementById('edit-id').value || generateUniqueId();
    const titleInput = document.getElementById('project-title');
    const title = titleInput ? titleInput.value.trim() : '';
    let category = document.getElementById('project-category').value;
    const notes = document.getElementById('project-notes').value.trim();
    const deadlineInput = document.getElementById('deadline');
    let deadline = deadlineInput ? deadlineInput.value : '';
    const photoInput = document.getElementById('photo-upload');
    const isCharity = document.getElementById('project-charity').checked;
    const isFavorite = document.getElementById('project-favorite').checked;
    const existing = allQuilts.find(q => q.id === quiltId);
    const completedDateInput = document.getElementById('completed-date');
    const completedDate = completedDateInput
        ? completedDateInput.value
        : (existing ? existing.completedDate || '' : '');
    const timestamp = existing ? existing.timestamp : new Date().toISOString().split('T')[0];

    if (!title) {
        showBanner('Please enter a project name before saving.', { type: 'error' });
        if (titleInput) {
            titleInput.focus();
        }
        return;
    }

    category = normalizeCategory(category);

    if (category === 'completed' && isFutureDate(deadline)) {
        showBanner('Completed projects cannot have a future due date. Update the due date or status to continue.', { type: 'error' });
        if (deadlineInput) {
            deadlineInput.focus();
        }
        return;
    }
    
    const quiltData = {
        id: quiltId,
        title: title,
        category: category,
        notes: notes,
        deadline: deadline,
        completedDate: completedDate,
        photo: null,
        timestamp: timestamp,
        isCharity: isCharity,
        isFavorite: isFavorite
    };
    
    // Handle photo upload
    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            quiltData.photo = e.target.result;
            saveQuiltRecord(quiltData);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        // Keep existing photo if editing
        if (existing) {
            quiltData.photo = existing.photo;
        }
        saveQuiltRecord(quiltData);
    }
}

// Save quilt record
function saveQuiltRecord(quiltData) {
    const existingIndex = allQuilts.findIndex(q => q.id === quiltData.id);
    
    if (existingIndex !== -1) {
        allQuilts[existingIndex] = quiltData;
        showBanner(`"${quiltData.title}" has been updated successfully!`, { type: 'success' });
    } else {
        allQuilts.unshift(quiltData);
        showBanner(`"${quiltData.title}" has been added successfully!`, { type: 'success' });
    }
    
    saveQuiltData();
    closeQuiltEditor();
    resetQuiltEditorFields();
    displayQuilts();
    displayCharityQuilts();
    displayFavorites();
    reapplyCurrentViewFilters();
    updateProjectListing();
    switchTab('admin');
}

// Toggle favorite status
function toggleFavorite(quiltId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    ensureQuiltDataLoaded();
    const quilt = allQuilts.find(q => q.id === quiltId);
    if (!quilt) return;
    
    quilt.isFavorite = !quilt.isFavorite;
    saveQuiltData();
    displayQuilts();
    displayCharityQuilts();
    displayFavorites();
    updateProjectListing();
    reapplyCurrentViewFilters();
    
    if (isEditing && editingQuiltId === quiltId) {
        document.getElementById('project-favorite').checked = quilt.isFavorite;
    }
}

// Remove a quilt
function removeQuilt(quiltId) {
    ensureQuiltDataLoaded();
    const quilt = allQuilts.find(q => q.id === quiltId);
    if (!quilt) return;
    
    showBanner(`Are you sure you want to delete "${quilt.title}"? This cannot be undone.`, {
        type: 'warning',
        actions: [
            {
                label: 'Delete',
                danger: true,
                onClick: () => {
                    allQuilts = allQuilts.filter(q => q.id !== quiltId);
                    saveQuiltData();
                    displayQuilts();
                    displayCharityQuilts();
                    displayFavorites();
                    updateProjectListing();
                    reapplyCurrentViewFilters();
                    showBanner('Quilt deleted successfully!', { type: 'success' });
                }
            },
            {
                label: 'Cancel',
                onClick: () => dismissBanner()
            }
        ]
    });
}

// Generate unique ID
function generateUniqueId() {
    return 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

function normalizeCategory(category) {
    if (!category) {
        return 'upcoming';
    }
    if (category === 'wip') {
        return 'in-progress';
    }
    if (category === 'not-started') {
        return 'upcoming';
    }
    return category;
}

// Get category display label
function getCategoryLabel(category) {
    const normalized = normalizeCategory(category);
    const labels = {
        'upcoming': 'Upcoming',
        'in-progress': 'In Progress',
        'completed': 'Completed'
    };
    return labels[normalized] || normalized;
}

function getCategoryClass(category) {
    const normalized = normalizeCategory(category);
    if (!normalized) {
        return '';
    }
    const classMap = {
        'upcoming': 'upcoming',
        'in-progress': 'wip',
        'completed': 'completed'
    };
    const mappedClass = classMap[normalized] || normalized;
    return `status-${mappedClass}`;
}

function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function isFutureDate(dateString) {
    if (!dateString) {
        return false;
    }
    const date = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(date.getTime())) {
        return false;
    }
    return date > getTodayDate();
}

function isDueSoon(quilt) {
    return normalizeCategory(quilt.category) !== 'completed' && isFutureDate(quilt.deadline);
}

// Format date for display
function formatDateDisplay(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Sanitize text to prevent XSS
function sanitizeText(text) {
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
}

// Truncate text with ellipsis
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
