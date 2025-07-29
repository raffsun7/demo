class ImageKitManager {
    constructor() {
        this.baseUrl = 'https://us-central1-usss-8d9b6.cloudfunctions.net';
        this.currentPath = '/';
        this.currentFolder = null;
        this.selectedFiles = new Set();
        this.init();
    }

    async init() {
        // Initialize ImageKit SDK
        this.imagekit = new ImageKit({
            publicKey: "public_eCdfbKH9YfDTIy1kC+1yP+5WJ4U=", // Replace with actual public key
            urlEndpoint: "https://ik.imagekit.io/raffu", // Replace with actual endpoint
            authenticationEndpoint: `${this.baseUrl}/imagekitAuth`
        });
    }

    // Get authentication parameters for uploads
    async getAuthParams() {
        try {
            const response = await fetch(`${this.baseUrl}/imagekitAuth`);
            return await response.json();
        } catch (error) {
            console.error('Auth error:', error);
            throw error;
        }
    }

    // Create new folder
    async createFolder(folderName, parentPath = null) {
        try {
            const response = await fetch(`${this.baseUrl}/createFolder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    folderName: folderName,
                    parentFolderPath: parentPath || this.currentPath
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create folder');
            }

            const result = await response.json();
            this.showNotification('Folder created successfully!', 'success');
            return result;
        } catch (error) {
            console.error('Create folder error:', error);
            this.showNotification('Failed to create folder', 'error');
            throw error;
        }
    }

    // Delete folder
    async deleteFolder(folderPath) {
        try {
            const response = await fetch(`${this.baseUrl}/deleteFolder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    folderPath: folderPath
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete folder');
            }

            this.showNotification('Folder deleted successfully!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Delete folder error:', error);
            this.showNotification('Failed to delete folder', 'error');
            throw error;
        }
    }

    // List assets (files and folders)
    async listAssets(path = null, type = 'all') {
        try {
            const queryPath = path || this.currentPath;
            const response = await fetch(`${this.baseUrl}/listAssets?path=${encodeURIComponent(queryPath)}&type=${type}&limit=100`);
            
            if (!response.ok) {
                throw new Error('Failed to list assets');
            }

            return await response.json();
        } catch (error) {
            console.error('List assets error:', error);
            throw error;
        }
    }

    // Upload single file
    async uploadFile(file, folder = null, metadata = {}) {
        try {
            const uploadPath = folder || this.currentPath;
            
            const uploadOptions = {
                file: file,
                fileName: file.name,
                folder: uploadPath,
                useUniqueFileName: true,
                tags: metadata.tags || [],
                customMetadata: metadata.customMetadata || {}
            };

            const result = await this.imagekit.upload(uploadOptions);
            this.showNotification('File uploaded successfully!', 'success');
            return result;
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Failed to upload file', 'error');
            throw error;
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(files, folder = null, metadata = {}) {
        try {
            const uploadPromises = Array.from(files).map(file => 
                this.uploadFile(file, folder, metadata)
            );

            const results = await Promise.all(uploadPromises);
            this.showNotification(`${results.length} files uploaded successfully!`, 'success');
            return results;
        } catch (error) {
            console.error('Multiple upload error:', error);
            this.showNotification('Failed to upload some files', 'error');
            throw error;
        }
    }

    // Delete file
    async deleteFile(fileId) {
        try {
            const response = await fetch(`${this.baseUrl}/deleteFile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileId: fileId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete file');
            }

            this.showNotification('File deleted successfully!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Delete file error:', error);
            this.showNotification('Failed to delete file', 'error');
            throw error;
        }
    }

    // Bulk delete files
    async bulkDeleteFiles(fileIds) {
        try {
            const response = await fetch(`${this.baseUrl}/bulkDeleteFiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileIds: fileIds
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete files');
            }

            const result = await response.json();
            this.showNotification(`${result.deletedCount} files deleted successfully!`, 'success');
            return result;
        } catch (error) {
            console.error('Bulk delete error:', error);
            this.showNotification('Failed to delete files', 'error');
            throw error;
        }
    }

    // Update file metadata
    async updateFileMetadata(fileId, metadata) {
        try {
            const response = await fetch(`${this.baseUrl}/updateFileMetadata`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileId: fileId,
                    customMetadata: metadata.customMetadata,
                    tags: metadata.tags
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update metadata');
            }

            this.showNotification('Metadata updated successfully!', 'success');
            return await response.json();
        } catch (error) {
            console.error('Update metadata error:', error);
            this.showNotification('Failed to update metadata', 'error');
            throw error;
        }
    }

    // Get file metadata
    async getFileMetadata(fileId) {
        try {
            const response = await fetch(`${this.baseUrl}/getFileMetadata?fileId=${fileId}`);
            
            if (!response.ok) {
                throw new Error('Failed to get metadata');
            }

            return await response.json();
        } catch (error) {
            console.error('Get metadata error:', error);
            throw error;
        }
    }

    // Search files
    async searchFiles(query, tags = null, path = null) {
        try {
            let searchUrl = `${this.baseUrl}/searchFiles?query=${encodeURIComponent(query)}`;
            if (tags) searchUrl += `&tags=${encodeURIComponent(tags)}`;
            if (path) searchUrl += `&path=${encodeURIComponent(path)}`;

            const response = await fetch(searchUrl);
            
            if (!response.ok) {
                throw new Error('Failed to search files');
            }

            return await response.json();
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    // Navigate to folder
    navigateToFolder(folderPath) {
        this.currentPath = folderPath;
        this.currentFolder = folderPath;
        this.refreshGallery();
    }

    // Go back to parent folder
    navigateBack() {
        if (this.currentPath !== '/') {
            const pathParts = this.currentPath.split('/').filter(part => part);
            pathParts.pop();
            this.currentPath = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
            this.refreshGallery();
        }
    }

    // Toggle file selection
    toggleFileSelection(fileId) {
        if (this.selectedFiles.has(fileId)) {
            this.selectedFiles.delete(fileId);
        } else {
            this.selectedFiles.add(fileId);
        }
        this.updateSelectionUI();
    }

    // Clear selection
    clearSelection() {
        this.selectedFiles.clear();
        this.updateSelectionUI();
    }

    // Get selected files
    getSelectedFiles() {
        return Array.from(this.selectedFiles);
    }

    // Update selection UI
    updateSelectionUI() {
        const selectedCount = this.selectedFiles.size;
        const selectionInfo = document.getElementById('selection-info');
        const bulkActions = document.getElementById('bulk-actions');

        if (selectedCount > 0) {
            selectionInfo.textContent = `${selectedCount} file(s) selected`;
            selectionInfo.style.display = 'block';
            bulkActions.style.display = 'block';
        } else {
            selectionInfo.style.display = 'none';
            bulkActions.style.display = 'none';
        }

        // Update checkboxes
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            const fileId = checkbox.dataset.fileId;
            checkbox.checked = this.selectedFiles.has(fileId);
        });
    }

    // Refresh gallery
    async refreshGallery() {
        try {
            const assets = await this.listAssets();
            this.renderGallery(assets);
        } catch (error) {
            console.error('Refresh gallery error:', error);
        }
    }

    // Render gallery
    renderGallery(assets) {
        const galleryContainer = document.getElementById('gallery-container');
        if (!galleryContainer) return;

        // Update breadcrumb
        this.updateBreadcrumb();

        // Separate folders and files
        const folders = assets.filter(asset => asset.type === 'folder');
        const files = assets.filter(asset => asset.type === 'file');

        let html = '';

        // Render folders
        if (folders.length > 0) {
            html += '<div class="folders-section"><h3>Folders</h3><div class="folders-grid">';
            folders.forEach(folder => {
                html += this.renderFolderCard(folder);
            });
            html += '</div></div>';
        }

        // Render files
        if (files.length > 0) {
            html += '<div class="files-section"><h3>Images</h3><div class="files-grid">';
            files.forEach(file => {
                html += this.renderFileCard(file);
            });
            html += '</div></div>';
        }

        // Empty state
        if (folders.length === 0 && files.length === 0) {
            html = this.renderEmptyState();
        }

        galleryContainer.innerHTML = html;
        this.attachEventListeners();
    }

    // Render folder card
    renderFolderCard(folder) {
        return `
            <div class="folder-card" data-folder-path="${folder.folderPath}">
                <div class="folder-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="folder-name">${folder.name}</div>
                <div class="folder-actions">
                    <button class="btn-icon delete-folder" data-folder-path="${folder.folderPath}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Render file card
    renderFileCard(file) {
        return `
            <div class="file-card" data-file-id="${file.fileId}">
                <div class="file-checkbox-container">
                    <input type="checkbox" class="file-checkbox" data-file-id="${file.fileId}">
                </div>
                <div class="file-image">
                    <img src="${file.thumbnail || file.url}" alt="${file.name}" loading="lazy">
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                    <div class="file-tags">
                        ${file.tags ? file.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn-icon edit-metadata" data-file-id="${file.fileId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-file" data-file-id="${file.fileId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Render empty state
    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-images empty-icon"></i>
                <h3>No images or folders yet</h3>
                <p>Create a folder or upload some images to get started</p>
                <button class="btn-primary" onclick="imagekitManager.showCreateFolderModal()">
                    <i class="fas fa-folder-plus"></i> Create Folder
                </button>
            </div>
        `;
    }

    // Update breadcrumb
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('gallery-breadcrumb');
        if (!breadcrumb) return;

        const pathParts = this.currentPath.split('/').filter(part => part);
        let html = '<span class="breadcrumb-item" onclick="imagekitManager.navigateToFolder(\'/\')">Home</span>';

        let currentPath = '';
        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            html += ` <i class="fas fa-chevron-right"></i> `;
            if (index === pathParts.length - 1) {
                html += `<span class="breadcrumb-item active">${part}</span>`;
            } else {
                html += `<span class="breadcrumb-item" onclick="imagekitManager.navigateToFolder('${currentPath}')">${part}</span>`;
            }
        });

        breadcrumb.innerHTML = html;
    }

    // Attach event listeners
    attachEventListeners() {
        // Folder double-click to navigate
        document.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('dblclick', (e) => {
                const folderPath = e.currentTarget.dataset.folderPath;
                this.navigateToFolder(folderPath);
            });
        });

        // File selection
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const fileId = e.target.dataset.fileId;
                this.toggleFileSelection(fileId);
            });
        });

        // Delete folder buttons
        document.querySelectorAll('.delete-folder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderPath = e.target.closest('[data-folder-path]').dataset.folderPath;
                this.confirmDeleteFolder(folderPath);
            });
        });

        // Delete file buttons
        document.querySelectorAll('.delete-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = e.target.closest('[data-file-id]').dataset.fileId;
                this.confirmDeleteFile(fileId);
            });
        });

        // Edit metadata buttons
        document.querySelectorAll('.edit-metadata').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = e.target.closest('[data-file-id]').dataset.fileId;
                this.showMetadataModal(fileId);
            });
        });
    }

    // Show create folder modal
    showCreateFolderModal() {
        // Implementation will be added in the next phase
        console.log('Show create folder modal');
    }

    // Show metadata modal
    showMetadataModal(fileId) {
        // Implementation will be added in the next phase
        console.log('Show metadata modal for file:', fileId);
    }

    // Confirm delete folder
    confirmDeleteFolder(folderPath) {
        if (confirm('Are you sure you want to delete this folder and all its contents?')) {
            this.deleteFolder(folderPath).then(() => {
                this.refreshGallery();
            });
        }
    }

    // Confirm delete file
    confirmDeleteFile(fileId) {
        if (confirm('Are you sure you want to delete this file?')) {
            this.deleteFile(fileId).then(() => {
                this.refreshGallery();
            });
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show notification
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
}

// Initialize ImageKit manager
const imagekitManager = new ImageKitManager();

