class NoteNestApp {
    constructor() {
        this.notes = [];
        this.currentNote = null;
        this.currentTab = 'notes';
        this.searchTerm = '';
        this.selectedTag = '';
        this.sortBy = 'updatedAt';
        this.predefinedImages = [
            'sample1.jpg',
            'sample2.jpg',
            'sample3.jpg'
        ];
    }

    async init() {
        this.setupEventListeners();
        await this.loadNotes();
        this.showTab('notes');
        this.renderNotes();
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('notesTab').addEventListener('click', () => {
            this.switchTab('notes');
        });

        document.getElementById('galleryTab').addEventListener('click', () => {
            this.switchTab('gallery');
            // Initialize gallery when switching to it
            if (window.imagekitManager) {
                imagekitManager.loadGallery();
            }
        });

        // New Note modal
        document.getElementById('newNoteBtn').addEventListener('click', () => this.openNoteModal());
        document.getElementById('closeModal').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeNoteModal();
        });
        document.getElementById('cancelBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeNoteModal();
        });
        document.getElementById('deleteBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.deleteCurrentNote();
        });

        // Create First Note button
        const createFirstNoteBtn = document.getElementById('createFirstNoteBtn');
        if (createFirstNoteBtn) {
            createFirstNoteBtn.addEventListener('click', () => this.openNoteModal());
        }

        // Note form submission
        document.getElementById('noteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote();
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.renderNotes();
        });

        document.getElementById('tagFilter').addEventListener('change', (e) => {
            this.selectedTag = e.target.value;
            this.renderNotes();
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderNotes();
        });

        // Modal backdrop click
        document.getElementById('noteModal').addEventListener('click', (e) => {
            if (e.target.id === 'noteModal') {
                this.closeNoteModal();
            }
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.showTab(tab);
    }

    showTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (tab === 'notes') {
            document.getElementById('notesTab').classList.add('active');
            document.getElementById('notesSection').style.display = 'block';
            document.getElementById('gallerySection').style.display = 'none';
        } else if (tab === 'gallery') {
            document.getElementById('galleryTab').classList.add('active');
            document.getElementById('notesSection').style.display = 'none';
            document.getElementById('gallerySection').style.display = 'block';
        }
    }

    async loadNotes() {
        try {
            const notesCollection = firebase.firestore().collection('notes');
            const snapshot = await notesCollection.orderBy('updatedAt', 'desc').get();
            
            this.notes = [];
            snapshot.forEach(doc => {
                this.notes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.updateTagFilter();
        } catch (error) {
            console.error('Error loading notes:', error);
            this.showNotification('Failed to load notes', 'error');
        }
    }

    async saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        const tags = document.getElementById('noteTags').value.trim();

        if (!title || !content) {
            this.showNotification('Please fill in both title and content', 'error');
            return;
        }

        const noteData = {
            title,
            content,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (this.currentNote) {
                // Update existing note
                await firebase.firestore().collection('notes').doc(this.currentNote.id).update(noteData);
                this.showNotification('Note updated successfully!', 'success');
            } else {
                // Create new note
                noteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await firebase.firestore().collection('notes').add(noteData);
                this.showNotification('Note created successfully!', 'success');
            }

            this.closeNoteModal();
            await this.loadNotes();
            this.renderNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            this.showNotification('Failed to save note', 'error');
        }
    }

    async deleteCurrentNote() {
        if (!this.currentNote) return;

        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            await firebase.firestore().collection('notes').doc(this.currentNote.id).delete();
            this.showNotification('Note deleted successfully!', 'success');
            this.closeNoteModal();
            await this.loadNotes();
            this.renderNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showNotification('Failed to delete note', 'error');
        }
    }

    openNoteModal(note = null) {
        this.currentNote = note;
        
        const modal = document.getElementById('noteModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteBtn');
        
        if (note) {
            // Edit mode
            modalTitle.textContent = 'Edit Pookie Note';
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';
            deleteBtn.style.display = 'inline-flex';
        } else {
            // Create mode
            modalTitle.textContent = 'New Pookie Note';
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            document.getElementById('noteTags').value = '';
            deleteBtn.style.display = 'none';
        }
        
        modal.classList.remove('hidden');
        document.getElementById('noteTitle').focus();
    }

    closeNoteModal() {
        const modal = document.getElementById('noteModal');
        modal.classList.add('hidden');
        this.currentNote = null;
    }

    renderNotes() {
        const filteredNotes = this.getFilteredNotes();
        const notesGrid = document.getElementById('notesGrid');
        const emptyState = document.getElementById('emptyNotesState');

        if (filteredNotes.length === 0) {
            notesGrid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            notesGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            
            notesGrid.innerHTML = filteredNotes.map(note => this.createNoteCard(note)).join('');
        }
    }

    createNoteCard(note) {
        const formattedDate = this.formatDate(note.updatedAt);
        const tagsHtml = note.tags && note.tags.length > 0 
            ? note.tags.map(tag => `<span class="tag"><i class="fas fa-tag mr-1"></i>${tag}</span>`).join('')
            : '';

        return `
            <div class="note-card" onclick="app.openNoteModal(${JSON.stringify(note).replace(/"/g, '&quot;')})">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <div class="note-date">
                        <i class="fas fa-clock mr-1"></i>
                        Updated: ${formattedDate}
                    </div>
                </div>
                <div class="note-content">
                    ${this.escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}
                </div>
                ${tagsHtml ? `<div class="note-tags">${tagsHtml}</div>` : ''}
                <div class="note-actions">
                    <button class="btn-icon edit-note" onclick="event.stopPropagation(); app.openNoteModal(${JSON.stringify(note).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredNotes() {
        let filtered = [...this.notes];

        // Filter by search term
        if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(note => 
                note.title.toLowerCase().includes(searchLower) ||
                note.content.toLowerCase().includes(searchLower) ||
                (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchLower)))
            );
        }

        // Filter by tag
        if (this.selectedTag) {
            filtered = filtered.filter(note => 
                note.tags && note.tags.includes(this.selectedTag)
            );
        }

        // Sort notes
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'createdAt':
                    return (b.createdAt?.toDate() || new Date()) - (a.createdAt?.toDate() || new Date());
                case 'updatedAt':
                default:
                    return (b.updatedAt?.toDate() || new Date()) - (a.updatedAt?.toDate() || new Date());
            }
        });

        return filtered;
    }

    updateTagFilter() {
        const tagFilter = document.getElementById('tagFilter');
        const allTags = new Set();
        
        this.notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(tag => allTags.add(tag));
            }
        });

        // Clear existing options except "All Tags"
        tagFilter.innerHTML = '<option value="">All Tags</option>';
        
        // Add tag options
        Array.from(allTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Legacy image loading for backward compatibility
    async loadImages() {
        // This method is kept for backward compatibility
        // ImageKit integration handles image loading now
        console.log('Image loading handled by ImageKit manager');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NoteNestApp();
    
    // Wait for authentication before initializing
    if (window.spaAuth) {
        spaAuth.onAuthStateChanged((user) => {
            if (user && spaAuth.isUserAuthorized(user)) {
                app.init();
            }
        });
    }
});

