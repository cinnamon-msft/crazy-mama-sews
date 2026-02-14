// Data storage key
const STORAGE_KEY = 'crazymama_quilts';

// Current state
let allQuilts = [];
let activeCategory = 'all';
let isEditing = false;
let editingQuiltId = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadQuiltData();
    displayQuilts();
    updateProjectListing();
});

// Tab switching
function switchTab(tabName, clickedButton) {
    const buttons = document.querySelectorAll('.tab-button');
    const sections = document.querySelectorAll('.tab-content');
    
    buttons.forEach(btn => btn.classList.remove('selected'));
    sections.forEach(sec => sec.classList.remove('visible'));
    
    clickedButton.classList.add('selected');
    document.getElementById(tabName + '-section').classList.add('visible');
    
    if (tabName === 'view') {
        displayQuilts();
    } else if (tabName === 'admin') {
        updateProjectListing();
    }
}

// Category filtering
function filterByCategory(category, clickedButton) {
    activeCategory = category;
    
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    clickedButton.classList.add('selected');
    
    displayQuilts();
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
}

// Save data to localStorage
function saveQuiltData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allQuilts));
}

// Display quilts in gallery
function displayQuilts() {
    const gallery = document.getElementById('quilt-display');
    const emptyMsg = document.getElementById('empty-message');
    
    let filtered = allQuilts;
    if (activeCategory !== 'all') {
        filtered = allQuilts.filter(q => q.category === activeCategory);
    }
    
    if (filtered.length === 0) {
        gallery.style.display = 'none';
        emptyMsg.style.display = 'block';
        return;
    }
    
    gallery.style.display = 'grid';
    emptyMsg.style.display = 'none';
    
    gallery.innerHTML = filtered.map(quilt => {
        const photoHtml = quilt.photo 
            ? `<img src="${quilt.photo}" alt="${sanitizeText(quilt.title)}" class="quilt-photo">`
            : '<div class="quilt-photo"></div>';
        
        const descSnippet = quilt.notes 
            ? truncateText(quilt.notes, 120)
            : '';
        
        const dateDisplay = quilt.deadline 
            ? `<p class="quilt-date">Due: ${formatDateDisplay(quilt.deadline)}</p>`
            : '';
        
        return `
            <div class="quilt-item" onclick="showDetails('${quilt.id}')">
                ${photoHtml}
                <div class="quilt-details">
                    <div class="quilt-header">
                        <h3 class="quilt-title">${sanitizeText(quilt.title)}</h3>
                        <span class="status-tag status-${quilt.category}">${getCategoryLabel(quilt.category)}</span>
                    </div>
                    ${descSnippet ? `<p class="quilt-description">${sanitizeText(descSnippet)}</p>` : ''}
                    ${dateDisplay}
                </div>
            </div>
        `;
    }).join('');
}

// Update project listing in admin view
function updateProjectListing() {
    const listing = document.getElementById('project-listing');
    
    if (allQuilts.length === 0) {
        listing.innerHTML = '<p class="empty-state" style="display: block;">No projects yet. Click "New Quilt" to add your first project!</p>';
        return;
    }
    
    listing.innerHTML = allQuilts.map(quilt => {
        const dateInfo = quilt.deadline 
            ? ` | Due: ${formatDateDisplay(quilt.deadline)}`
            : '';
        
        return `
            <div class="project-entry">
                <div class="project-data">
                    <h4>${sanitizeText(quilt.title)}</h4>
                    <p>
                        <span class="status-tag status-${quilt.category}">${getCategoryLabel(quilt.category)}</span>
                        ${dateInfo}
                    </p>
                </div>
                <div class="project-controls">
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
    
    const createdHtml = quilt.timestamp 
        ? `<p><strong>Added:</strong> ${formatDateDisplay(quilt.timestamp)}</p>`
        : '';
    
    content.innerHTML = `
        ${photoHtml}
        <h2>${sanitizeText(quilt.title)}</h2>
        <p><span class="status-tag status-${quilt.category}">${getCategoryLabel(quilt.category)}</span></p>
        ${notesHtml}
        ${deadlineHtml}
        ${createdHtml}
    `;
    
    popup.classList.add('active');
}

// Close popup
function closePopup() {
    document.getElementById('detail-popup').classList.remove('active');
}

// Open quilt editor
function openQuiltEditor() {
    isEditing = false;
    editingQuiltId = null;
    
    document.getElementById('editor-heading').textContent = 'Add Quilt Project';
    document.getElementById('quilt-editor').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('photo-display').innerHTML = '';
    document.getElementById('editor-panel').classList.remove('hidden');
    
    document.getElementById('editor-panel').scrollIntoView({ behavior: 'smooth' });
}

// Close quilt editor
function closeQuiltEditor() {
    document.getElementById('editor-panel').classList.add('hidden');
    document.getElementById('quilt-editor').reset();
    document.getElementById('photo-display').innerHTML = '';
    isEditing = false;
    editingQuiltId = null;
}

// Start editing a quilt
function startEdit(quiltId) {
    const quilt = allQuilts.find(q => q.id === quiltId);
    if (!quilt) return;
    
    isEditing = true;
    editingQuiltId = quiltId;
    
    document.getElementById('editor-heading').textContent = 'Edit Quilt Project';
    document.getElementById('edit-id').value = quilt.id;
    document.getElementById('project-title').value = quilt.title;
    document.getElementById('project-category').value = quilt.category;
    document.getElementById('project-notes').value = quilt.notes || '';
    document.getElementById('deadline').value = quilt.deadline || '';
    
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
            photoDisplay.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    const quiltId = document.getElementById('edit-id').value || generateUniqueId();
    const title = document.getElementById('project-title').value.trim();
    const category = document.getElementById('project-category').value;
    const notes = document.getElementById('project-notes').value.trim();
    const deadline = document.getElementById('deadline').value;
    const photoInput = document.getElementById('photo-upload');
    
    const quiltData = {
        id: quiltId,
        title: title,
        category: category,
        notes: notes,
        deadline: deadline,
        photo: null,
        timestamp: new Date().toISOString().split('T')[0]
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
        const existing = allQuilts.find(q => q.id === quiltId);
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
        alert(`"${quiltData.title}" has been updated successfully!`);
    } else {
        allQuilts.unshift(quiltData);
        alert(`"${quiltData.title}" has been added successfully!`);
    }
    
    saveQuiltData();
    closeQuiltEditor();
    displayQuilts();
    updateProjectListing();
}

// Remove a quilt
function removeQuilt(quiltId) {
    const quilt = allQuilts.find(q => q.id === quiltId);
    if (!quilt) return;
    
    if (confirm(`Are you sure you want to delete "${quilt.title}"? This cannot be undone.`)) {
        allQuilts = allQuilts.filter(q => q.id !== quiltId);
        saveQuiltData();
        displayQuilts();
        updateProjectListing();
        alert('Quilt deleted successfully!');
    }
}

// Generate unique ID
function generateUniqueId() {
    return 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

// Get category display label
function getCategoryLabel(category) {
    const labels = {
        'completed': 'Completed',
        'wip': 'In Progress',
        'upcoming': 'Due Soon'
    };
    return labels[category] || category;
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
