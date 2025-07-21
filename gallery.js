// Import the configurations from our config.js file
import { firebaseConfig, imagekitConfig } from './config.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. INITIALIZE SERVICES & GET DOM ELEMENTS ---
    firebase.initializeApp(firebaseConfig);
    const imagekit = new ImageKit(imagekitConfig);
    const db = firebase.firestore();
    const galleryCollection = db.collection("gallery");

    // Get all DOM elements
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const modal = document.getElementById('upload-modal');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('photo-files');
    const captionInput = document.getElementById('photo-caption');
    const submitBtn = document.getElementById('submit-upload-btn');
    const progressText = document.getElementById('upload-progress');
    const galleryGrid = document.getElementById('gallery-grid');
    const deleteModal = document.getElementById('delete-confirm-modal'); // This ID is NOT in index.html!
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    // --- 2. MODAL HANDLING ---
    const setupModalHandlers = () => {
        if (addPhotoBtn && modal) {
            addPhotoBtn.addEventListener('click', () => modal.classList.add('active'));
        }
        if (closeModalBtn && modal) {
            closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }
    };

    // --- 3. SECURE UPLOAD LOGIC ---
    const handleUpload = async (e) => {
        e.preventDefault();
        const files = fileInput.files;
        const caption = captionInput.value;

        if (files.length === 0 || !caption) {
            alert("Please select at least one image and provide a caption.");
            return;
        }
        
        submitBtn.disabled = true;
        progressText.textContent = 'Preparing to upload...';

        try {
            // ** START OF THE LOOP **
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                progressText.textContent = `Uploading ${i + 1} of ${files.length}...`;

                // ** FIX: Get a NEW token for EACH file inside the loop **
                const authResponse = await fetch('/api/auth');
                const { signature, expire, token } = await authResponse.json();
                
                // Upload the current file with its unique token
                const result = await imagekit.upload({
                    file,
                    fileName: file.name,
                    useUniqueFileName: true,
                    signature, expire, token,
                });

                // Save the result to Firestore
                await galleryCollection.add({
                    imageUrl: result.url,
                    thumbnailUrl: result.thumbnailUrl,
                    fileId: result.fileId,
                    caption: caption,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            // ** END OF THE LOOP **
            
            progressText.textContent = "All uploads complete!";
            uploadForm.reset();
            setTimeout(() => {
                modal.classList.remove('active');
                progressText.textContent = "";
                submitBtn.disabled = false;
            }, 1500);

        } catch (error) {
            console.error("Upload failed:", error);
            progressText.textContent = "An upload failed. Check console.";
            submitBtn.disabled = false;
        }
    };

    // --- 4. DISPLAY GALLERY FROM FIREBASE ---
    const displayPhotos = () => {
        if (!galleryCollection) return;
        console.log("Setting up Firestore listener...");
        galleryCollection.orderBy("createdAt", "desc").onSnapshot(snapshot => {
            console.log(`Received snapshot. Contains ${snapshot.size} documents.`);
            
            if (!galleryGrid) return;
            if (snapshot.empty) {
                galleryGrid.innerHTML = `<p class="loading-text">No photos yet. Click the '+' to add one!</p>`;
                return;
            }
            
            galleryGrid.innerHTML = ''; // Clear the grid before adding new photos

            snapshot.forEach(doc => {
                const photo = doc.data();
                console.log("Processing photo:", photo); // Log each photo's data

                if (photo && photo.thumbnailUrl && photo.imageUrl) {
                    const postDate = photo.createdAt ? photo.createdAt.toDate().toLocaleDateString() : 'Just now';

                    const card = document.createElement('div');
                    card.className = 'gallery-card';
                    card.innerHTML = `
                        <div class="delete-icon" data-doc-id="${doc.id}" data-file-id="${photo.fileId}">
                            <i class="fa-solid fa-trash"></i>
                        </div>
                        <img src="${photo.thumbnailUrl}" alt="Gallery Image" data-full-url="${photo.imageUrl}">
                        <p class="photo-caption">${photo.caption || ''}</p>
                        <small class="photo-date">${postDate}</small>
                    `;
                    
                    galleryGrid.appendChild(card);
                } else {
                    console.warn("Skipping a document due to missing data:", doc.id, photo);
                }
            });
            initializeLightboxForElement(galleryGrid);
        }, error => {
            console.error("Firestore listener failed:", error);
            if(galleryGrid) galleryGrid.innerHTML = `<p class="loading-text">Error loading photos. Check console for details.</p>`;
        });
    };

    // --- 5. DELETE LOGIC ---
    const setupDeleteHandlers = () => {
        // This check is important as it might indicate a missing element in index.html
        if (!galleryGrid || !deleteModal || !confirmDeleteBtn || !cancelDeleteBtn) {
            console.error("Delete functionality cannot be initialized because one or more required HTML elements are missing.");
            return;
        }

        galleryGrid.addEventListener('click', (e) => {
            const deleteIcon = e.target.closest('.delete-icon');
            if (deleteIcon) {
                const docId = deleteIcon.dataset.docId;
                const fileId = deleteIcon.dataset.fileId;
                openDeleteConfirmation(docId, fileId);
            }
        });

        const openDeleteConfirmation = (docId, fileId) => {
            deleteModal.classList.add('active');
            confirmDeleteBtn.dataset.docId = docId;
            confirmDeleteBtn.dataset.fileId = fileId;
        };

        const closeDeleteConfirmation = () => {
            deleteModal.classList.remove('active');
        };

        cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteConfirmation();
        });

        confirmDeleteBtn.addEventListener('click', async () => {
            const docId = confirmDeleteBtn.dataset.docId;
            const fileId = confirmDeleteBtn.dataset.fileId;
            if (!docId || !fileId) return;

            try {
                const response = await fetch('/api/delete-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileId: fileId })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to delete from storage: ${errorData.message || response.statusText}`);
                }
                await galleryCollection.doc(docId).delete();
                closeDeleteConfirmation();

            } catch (error) {
                console.error("Error deleting photo:", error);
                alert("Could not delete the photo. Please try again. Check console for details.");
            }
        });
    };

    // --- 6. LIGHTBOX LOGIC ---
    const initializeLightboxForElement = (container) => {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const closeBtn = lightbox ? lightbox.querySelector('.lightbox-close') : null;

        if (!lightbox || !lightboxImg || !closeBtn) {
            console.error("Lightbox functionality cannot be initialized because one or more required HTML elements are missing.");
            return;
        }
        
        const galleryImages = container.querySelectorAll('.gallery-card img');
        galleryImages.forEach(img => {
            img.addEventListener('click', () => {
                lightboxImg.src = img.dataset.fullUrl;
                lightbox.classList.add('active');
            });
        });

        closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) lightbox.classList.remove('active');
        });
    };

    // --- INITIALIZE THE APP ---
    // Make sure all required elements exist before setting up handlers
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    setupModalHandlers();
    setupDeleteHandlers();
    displayPhotos();
});