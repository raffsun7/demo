class VercelImageKitManager {
    constructor() {
        this.baseURL = window.location.origin; // Use current domain for API calls
        this.currentPath = '/';
        this.selectedFiles = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadGallery();
    }

    setupEventListeners() {
        // Create folder button
        const createFolderBtn = document.getElementById('create-folder-btn');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => this.showCreateFolderModal());
        }

        // Upload images button
        const uploadBtn = document.getElementById('upload-images-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadModal());
        }

        // Back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.navigateBack());
        }

        // Search functionality
        const searchInput = document.getElementById('gallery-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchFiles(e.target.value));
        }

        // Bulk delete button
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => this.bulkDeleteFiles());
        }
    }

    async apiCall(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}/api/${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    async getAuthToken() {
        try {
            const response = await this.apiCall('imagekit-auth', {
                method: 'POST'
            });
            return response;
        } catch (error) {
            console.error('Failed to get auth token:', error);
            throw error;
        }
    }

    async createFolder(folderName, parentPath = '/') {
        try {
            const response = await this.apiCall('create-folder', {
                method: 'POST',
                body: JSON.stringify({
                    folderName: folderName,
                    parentFolderPath: parentPath
                })
            });

            if (response.success) {
                this.showNotification('Folder created successfully!', 'success');
                this.loadGallery();
            } else {
                throw new Error(response.error || 'Failed to create folder');
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
            this.showNotification('Failed to create folder: ' + error.message, 'error');
        }
    }

    async loadGallery(path = '/') {
        try {
            this.currentPath = path;
            this.showLoading(true);

            const response = await this.apiCall(`list-assets?path=${encodeURIComponent(path)}&limit=100`);

            if (response.success) {
                this.renderGallery(response.files, response.folders);
                this.updateBreadcrumb(path);
            } else {
                throw new Error(response.error || 'Failed to load gallery');
            }
        } catch (error) {
            console.error('Failed to load gallery:', error);
            this.showNotification('Failed to load gallery: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteFile(fileId) {
        try {
            const response = await this.apiCall('delete-file', {
                method: 'DELETE',
                body: JSON.stringify({ fileId })
            });

            if (response.success) {
                this.showNotification('File deleted successfully!', 'success');
                this.loadGallery(this.currentPath);
            } else {
                throw new Error(response.error || 'Failed to delete file');
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            this.showNotification('Failed to delete file: ' + error.message, 'error');
        }
    }

    async deleteFolder(folderPath) {
        try {
            const response = await this.apiCall('delete-folder', {
                method: 'DELETE',
                body: JSON.stringify({ folderPath })
            });

            if (response.success) {
                this.showNotification('Folder deleted successfully!', 'success');
                this.loadGallery(this.currentPath);
            } else {
                throw new Error(response.error || 'Failed to delete folder');
            }
        } catch (error) {
            console.error('Failed to delete folder:', error);
            this.showNotification('Failed to delete folder: ' + error.message, 'error');
        }
    }

    async bulkDeleteFiles() {
        if (this.selectedFiles.size === 0) {
            this.showNotification('Please select files to delete', 'warning');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${this.selectedFiles.size} selected files?`)) {
            return;
        }

        try {
            const fileIds = Array.from(this.selectedFiles);
            const response = await this.apiCall('bulk-delete', {
                method: 'DELETE',
                body: JSON.stringify({ fileIds })
            });

            if (response.success) {
                this.showNotification(`Successfully deleted ${fileIds.length} files!`, 'success');
                this.selectedFiles.clear();
                this.loadGallery(this.currentPath);
            } else {
                throw new Error(response.error || 'Failed to delete files');
            }
        } catch (error) {
            console.error('Failed to bulk delete files:', error);
            this.showNotification('Failed to delete files: ' + error.message, 'error');
        }
    }

    async updateFileMetadata(fileId, tags, customCoordinates = null) {
        try {
            const response = await this.apiCall('update-metadata', {
                method: 'PUT',
                body: JSON.stringify({
                    fileId,
                    tags,
                    customCoordinates
                })
            });

            if (response.success) {
                this.showNotification('Metadata updated successfully!', 'success');
                return response.file;
            } else {
                throw new Error(response.error || 'Failed to update metadata');
            }
        } catch (error) {
            console.error('Failed to update metadata:', error);
            this.showNotification('Failed to update metadata: ' + error.message, 'error');
            throw error;
        }
    }

    async searchFiles(query, tags = []) {
        try {
            if (!query.trim() && tags.length === 0) {
                this.loadGallery(this.currentPath);
                return;
            }

            this.showLoading(true);
            
            let searchUrl = `search-files?q=${encodeURIComponent(query)}`;
            tags.forEach(tag => {
                searchUrl += `&tags=${encodeURIComponent(tag)}`;
            });

            const response = await this.apiCall(searchUrl);

            if (response.success) {
                this.renderGallery(response.files, []);
                this.updateBreadcrumb('Search Results');
            } else {
                throw new Error(response.error || 'Search failed');
            }
        } catch (error) {
            console.error('Search failed:', error);
            this.showNotification('Search failed: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderGallery(files, folders) {
        const galleryGrid = document.getElementById('gallery-grid');
        if (!galleryGrid) return;

        galleryGrid.innerHTML = '';

        // Render folders first
        folders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            galleryGrid.appendChild(folderElement);
        });

        // Render files
        files.forEach(file => {
            const fileElement = this.createFileElement(file);
            galleryGrid.appendChild(fileElement);
        });

        // Show empty state if no content
        if (files.length === 0 && folders.length === 0) {
            this.showEmptyState();
        }
    }

    createFolderElement(folder) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'gallery-folder-item pookie-card';
        folderDiv.innerHTML = `
            <div class="folder-icon">
                <i class="fas fa-folder" style="font-size: 3rem; color: var(--pookie-purple);"></i>
            </div>
            <div class="folder-name">${folder.folderName}</div>
            <div class="folder-actions">
                <button class="btn-icon delete-folder-btn" data-path="${folder.folderPath}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add click handler to navigate into folder
        folderDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-actions')) {
                this.loadGallery(folder.folderPath);
            }
        });

        // Add delete handler
        const deleteBtn = folderDiv.querySelector('.delete-folder-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete the folder "${folder.folderName}" and all its contents?`)) {
                this.deleteFolder(folder.folderPath);
            }
        });

        return folderDiv;
    }

    createFileElement(file) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'gallery-file-item pookie-card';
        fileDiv.innerHTML = `
            <div class="file-checkbox">
                <input type="checkbox" id="file-${file.fileId}" data-file-id="${file.fileId}">
            </div>
            <div class="file-image">
                <img src="${file.thumbnail || file.url}" alt="${file.name}" loading="lazy">
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
                ${file.tags && file.tags.length > 0 ? `
                    <div class="file-tags">
                        ${file.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="file-actions">
                <button class="btn-icon preview-btn" data-file='${JSON.stringify(file)}'>
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon edit-metadata-btn" data-file='${JSON.stringify(file)}'>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-file-btn" data-file-id="${file.fileId}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const checkbox = fileDiv.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedFiles.add(file.fileId);
            } else {
                this.selectedFiles.delete(file.fileId);
            }
            this.updateBulkDeleteButton();
        });

        const previewBtn = fileDiv.querySelector('.preview-btn');
        previewBtn.addEventListener('click', () => this.showImagePreview(file));

        const editBtn = fileDiv.querySelector('.edit-metadata-btn');
        editBtn.addEventListener('click', () => this.showMetadataModal(file));

        const deleteBtn = fileDiv.querySelector('.delete-file-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                this.deleteFile(file.fileId);
            }
        });

        return fileDiv;
    }

    showCreateFolderModal() {
        // Implementation for create folder modal
        const folderName = prompt('Enter folder name:');
        if (folderName && folderName.trim()) {
            this.createFolder(folderName.trim(), this.currentPath);
        }
    }

    showUploadModal() {
        // Create file input for multiple file selection
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = 'image/*';
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadFiles(Array.from(e.target.files));
            }
        });
        
        fileInput.click();
    }

    async uploadFiles(files) {
        try {
            this.showLoading(true);
            const authToken = await this.getAuthToken();
            
            const uploadPromises = files.map(file => this.uploadSingleFile(file, authToken));
            await Promise.all(uploadPromises);
            
            this.showNotification(`Successfully uploaded ${files.length} files!`, 'success');
            this.loadGallery(this.currentPath);
        } catch (error) {
            console.error('Upload failed:', error);
            this.showNotification('Upload failed: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async uploadSingleFile(file, authToken) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('folder', this.currentPath);
        formData.append('token', authToken.token);
        formData.append('expire', authToken.expire);
        formData.append('signature', authToken.signature);

        const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
        }

        return response.json();
    }

    showImagePreview(file) {
        // Implementation for image preview modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content image-preview-modal">
                <div class="modal-header">
                    <h3>${file.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <img src="${file.url}" alt="${file.name}" style="max-width: 100%; max-height: 70vh;">
                    <div class="image-details">
                        <p><strong>Size:</strong> ${this.formatFileSize(file.size)}</p>
                        <p><strong>Format:</strong> ${file.fileType}</p>
                        <p><strong>Uploaded:</strong> ${new Date(file.createdAt).toLocaleDateString()}</p>
                        ${file.tags && file.tags.length > 0 ? `
                            <p><strong>Tags:</strong> ${file.tags.join(', ')}</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showMetadataModal(file) {
        // Implementation for metadata editing modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content metadata-modal">
                <div class="modal-header">
                    <h3>Edit Metadata - ${file.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Tags (comma-separated):</label>
                        <input type="text" id="metadata-tags" value="${file.tags ? file.tags.join(', ') : ''}" 
                               placeholder="Enter tags separated by commas">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-metadata">Cancel</button>
                    <button class="btn-primary" id="save-metadata">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#cancel-metadata').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#save-metadata').addEventListener('click', async () => {
            const tagsInput = modal.querySelector('#metadata-tags');
            const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            
            try {
                await this.updateFileMetadata(file.fileId, tags);
                document.body.removeChild(modal);
                this.loadGallery(this.currentPath);
            } catch (error) {
                // Error already handled in updateFileMetadata
            }
        });
    }

    updateBreadcrumb(path) {
        const breadcrumb = document.getElementById('gallery-breadcrumb');
        if (!breadcrumb) return;

        if (path === 'Search Results') {
            breadcrumb.innerHTML = '<span class="breadcrumb-item">Search Results</span>';
            return;
        }

        const parts = path.split('/').filter(part => part);
        let currentPath = '';
        
        let breadcrumbHTML = '<span class="breadcrumb-item clickable" data-path="/">Home</span>';
        
        parts.forEach(part => {
            currentPath += '/' + part;
            breadcrumbHTML += ` <i class="fas fa-chevron-right"></i> <span class="breadcrumb-item clickable" data-path="${currentPath}">${part}</span>`;
        });

        breadcrumb.innerHTML = breadcrumbHTML;

        // Add click handlers
        breadcrumb.querySelectorAll('.clickable').forEach(item => {
            item.addEventListener('click', () => {
                this.loadGallery(item.dataset.path);
            });
        });
    }

    navigateBack() {
        if (this.currentPath === '/') return;
        
        const parts = this.currentPath.split('/').filter(part => part);
        parts.pop();
        const parentPath = parts.length > 0 ? '/' + parts.join('/') : '/';
        this.loadGallery(parentPath);
    }

    updateBulkDeleteButton() {
        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.style.display = this.selectedFiles.size > 0 ? 'block' : 'none';
            bulkDeleteBtn.textContent = `Delete Selected (${this.selectedFiles.size})`;
        }
    }

    showEmptyState() {
        const galleryGrid = document.getElementById('gallery-grid');
        if (!galleryGrid) return;

        galleryGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images" style="font-size: 4rem; color: var(--pookie-purple); margin-bottom: 1rem;"></i>
                <h3>No images in this folder</h3>
                <p>Upload some images to get started!</p>
            </div>
        `;
    }

    showLoading(show) {
        const loadingElement = document.getElementById('gallery-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);

        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imagekitManager = new VercelImageKitManager();
});

