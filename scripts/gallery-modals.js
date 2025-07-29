// Gallery Modal Functions

// Create Folder Modal
function showCreateFolderModal() {
    const modal = document.getElementById('createFolderModal');
    const pathDisplay = document.getElementById('currentPathDisplay');
    const folderNameInput = document.getElementById('folderName');
    
    // Update current path display
    pathDisplay.textContent = imagekitManager.currentPath === '/' ? 'Home' : imagekitManager.currentPath;
    
    // Clear form
    folderNameInput.value = '';
    
    // Show modal
    modal.classList.remove('hidden');
    folderNameInput.focus();
}

function hideCreateFolderModal() {
    const modal = document.getElementById('createFolderModal');
    modal.classList.add('hidden');
}

// Handle create folder form submission
document.getElementById('createFolderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const folderName = document.getElementById('folderName').value.trim();
    
    if (!folderName) {
        imagekitManager.showNotification('Please enter a folder name', 'error');
        return;
    }
    
    try {
        await imagekitManager.createFolder(folderName);
        hideCreateFolderModal();
        imagekitManager.refreshGallery();
    } catch (error) {
        console.error('Create folder error:', error);
    }
});

// Upload Modal
let selectedFiles = [];

function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    const pathDisplay = document.getElementById('uploadPathDisplay');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    // Update current path display
    pathDisplay.textContent = imagekitManager.currentPath === '/' ? 'Home' : imagekitManager.currentPath;
    
    // Clear form
    fileInput.value = '';
    selectedFiles = [];
    updateSelectedFilesDisplay();
    uploadBtn.disabled = true;
    
    // Reset progress
    hideUploadProgress();
    
    // Show modal
    modal.classList.remove('hidden');
}

function hideUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('hidden');
    selectedFiles = [];
    updateSelectedFilesDisplay();
}

// File input change handler
document.getElementById('fileInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    selectedFiles = files;
    updateSelectedFilesDisplay();
    
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = selectedFiles.length === 0;
});

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    selectedFiles = files;
    updateSelectedFilesDisplay();
    
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = selectedFiles.length === 0;
});

// Update selected files display
function updateSelectedFilesDisplay() {
    const selectedFilesDiv = document.getElementById('selectedFiles');
    const filesList = document.getElementById('filesList');
    
    if (selectedFiles.length === 0) {
        selectedFilesDiv.classList.add('hidden');
        return;
    }
    
    selectedFilesDiv.classList.remove('hidden');
    
    filesList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <span class="file-item-name">${file.name}</span>
            <span class="file-item-size">${formatFileSize(file.size)}</span>
            <button type="button" class="file-item-remove" onclick="removeSelectedFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Remove selected file
function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    updateSelectedFilesDisplay();
    
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = selectedFiles.length === 0;
}

// Handle upload form submission
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
        imagekitManager.showNotification('Please select files to upload', 'error');
        return;
    }
    
    const tags = document.getElementById('uploadTags').value.trim();
    const category = document.getElementById('uploadCategory').value;
    
    const metadata = {
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        customMetadata: {
            category: category || 'uncategorized',
            uploadedAt: new Date().toISOString()
        }
    };
    
    try {
        showUploadProgress();
        
        // Upload files one by one to show progress
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            updateUploadProgress((i / selectedFiles.length) * 100, `Uploading ${file.name}...`);
            
            await imagekitManager.uploadFile(file, imagekitManager.currentPath, metadata);
        }
        
        updateUploadProgress(100, 'Upload complete!');
        
        setTimeout(() => {
            hideUploadModal();
            imagekitManager.refreshGallery();
        }, 1000);
        
    } catch (error) {
        console.error('Upload error:', error);
        hideUploadProgress();
    }
});

// Upload progress functions
function showUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    const uploadBtn = document.getElementById('uploadBtn');
    
    progressDiv.classList.remove('hidden');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';
}

function hideUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    const uploadBtn = document.getElementById('uploadBtn');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressDiv.classList.add('hidden');
    uploadBtn.disabled = selectedFiles.length === 0;
    uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload Images';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
}

function updateUploadProgress(percentage, message) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${Math.round(percentage)}%`;
    
    if (message) {
        const progressDiv = document.getElementById('uploadProgress');
        const messageSpan = progressDiv.querySelector('.text-sm.font-semibold');
        if (messageSpan) {
            messageSpan.textContent = message;
        }
    }
}

// Metadata Modal
function showMetadataModal(fileId) {
    const modal = document.getElementById('metadataModal');
    const fileIdInput = document.getElementById('metadataFileId');
    
    fileIdInput.value = fileId;
    
    // Load current metadata
    loadFileMetadata(fileId);
    
    // Show modal
    modal.classList.remove('hidden');
}

function hideMetadataModal() {
    const modal = document.getElementById('metadataModal');
    modal.classList.add('hidden');
}

// Load file metadata
async function loadFileMetadata(fileId) {
    try {
        const metadata = await imagekitManager.getFileMetadata(fileId);
        
        // Update form fields
        document.getElementById('metadataFileName').textContent = metadata.name;
        document.getElementById('metadataImagePreview').src = metadata.thumbnail || metadata.url;
        document.getElementById('metadataTags').value = metadata.tags ? metadata.tags.join(', ') : '';
        document.getElementById('metadataCategory').value = metadata.customMetadata?.category || '';
        document.getElementById('metadataDescription').value = metadata.customMetadata?.description || '';
        
    } catch (error) {
        console.error('Load metadata error:', error);
        imagekitManager.showNotification('Failed to load metadata', 'error');
    }
}

// Handle metadata form submission
document.getElementById('metadataForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileId = document.getElementById('metadataFileId').value;
    const tags = document.getElementById('metadataTags').value.trim();
    const category = document.getElementById('metadataCategory').value;
    const description = document.getElementById('metadataDescription').value.trim();
    
    const metadata = {
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        customMetadata: {
            category: category || 'uncategorized',
            description: description,
            updatedAt: new Date().toISOString()
        }
    };
    
    try {
        await imagekitManager.updateFileMetadata(fileId, metadata);
        hideMetadataModal();
        imagekitManager.refreshGallery();
    } catch (error) {
        console.error('Update metadata error:', error);
    }
});

// Bulk delete function
async function bulkDeleteSelected() {
    const selectedFiles = imagekitManager.getSelectedFiles();
    
    if (selectedFiles.length === 0) {
        imagekitManager.showNotification('No files selected', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} selected file(s)?`)) {
        return;
    }
    
    try {
        await imagekitManager.bulkDeleteFiles(selectedFiles);
        imagekitManager.clearSelection();
        imagekitManager.refreshGallery();
    } catch (error) {
        console.error('Bulk delete error:', error);
    }
}

// Utility function
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'createFolderModal') hideCreateFolderModal();
        if (e.target.id === 'uploadModal') hideUploadModal();
        if (e.target.id === 'metadataModal') hideMetadataModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideCreateFolderModal();
        hideUploadModal();
        hideMetadataModal();
    }
});

