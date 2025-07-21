// Import the configurations from our config.js file
import { firebaseConfig, imagekitConfig } from './config.js';
// Import authentication functions from security.js
import { isAuthenticated, showPinModal } from './security.js';

document.addEventListener('DOMContentLoaded', () => {

    const appContainer = document.getElementById('app-container');

    // --- PIN AUTHENTICATION INTEGRATION ---
    const startApp = () => {
        if (isAuthenticated()) {
            appContainer.style.display = 'flex'; // Show the main app
            initializeGalleryApp(); // Initialize the main gallery app after successful login
        } else {
            showPinModal(); // Show PIN modal if not authenticated
        }
    };

    // Listen for the custom 'authenticated' event dispatched by security.js
    document.addEventListener('authenticated', () => {
        appContainer.style.display = 'flex'; // Show the main app
        initializeGalleryApp(); // Initialize the main gallery app
    });

    // --- Main Gallery App Initialization Function ---
    // This function will only be called after successful PIN authentication
    const initializeGalleryApp = () => {

        // --- 1. INITIALIZE SERVICES & GET DOM ELEMENTS ---
        firebase.initializeApp(firebaseConfig);
        const imagekit = new ImageKit(imagekitConfig);
        const db = firebase.firestore();

        // Firestore Collections
        const collectionsCollection = db.collection("collections"); // New collection for memories

        // Global Buttons
        const addPhotoBtn = document.getElementById('add-photo-btn'); // For adding photos to a collection
        const createCollectionBtn = document.getElementById('create-collection-btn'); // For creating new collections

        // Modals & their elements
        const uploadModal = document.getElementById('upload-modal');
        const uploadModalCloseBtn = document.getElementById('modal-close-btn');
        const uploadForm = document.getElementById('upload-form');
        const fileInput = document.getElementById('photo-files');
        const captionInput = document.getElementById('photo-caption'); // Now optional
        const tagButtonsContainer = document.getElementById('tag-buttons-container'); // New: Tag buttons container
        const selectedTagsInput = document.getElementById('selected-tags'); // New: Hidden input for selected tags
        let currentSelectedTags = new Set(); // To manage selected tags
        const submitUploadBtn = document.getElementById('submit-upload-btn');
        const uploadProgressText = document.getElementById('upload-progress');

        const createCollectionModal = document.getElementById('create-collection-modal');
        const createCollectionCloseBtn = document.getElementById('create-collection-close-btn');
        const createCollectionForm = document.getElementById('create-collection-form');
        const collectionNameInput = document.getElementById('collection-name');
        const collectionDescriptionInput = document.getElementById('collection-description'); // New: Description input
        const submitCreateCollectionBtn = document.getElementById('submit-create-collection-btn');

        const deleteConfirmModal = document.getElementById('delete-confirm-modal');
        const deleteModalCloseBtn = document.getElementById('delete-modal-close-btn');
        const deleteConfirmMessage = document.getElementById('delete-confirm-message');
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCloseBtn = lightbox ? lightbox.querySelector('.lightbox-close') : null;

        // State Variables for Delete Operation
        let currentDeleteTarget = { type: null, id: null, fileId: null, collectionId: null, imageUrl: null, thumbnailUrl: null, caption: null, uploadedAt: null };
        let currentCollectionId = null; // To keep track of the currently viewed collection


        // --- Functions to manage tag selection (Moved to broader scope) ---
        const updateSelectedTagsInput = () => {
            selectedTagsInput.value = JSON.stringify(Array.from(currentSelectedTags));
        };

        const highlightSelectedTags = () => {
            document.querySelectorAll('.tag-button').forEach(btn => {
                if (currentSelectedTags.has(btn.dataset.tag)) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        };


        // --- 2. GLOBAL MODAL HANDLERS ---
        const setupGlobalModalHandlers = () => {
            // Upload Modal
            if (addPhotoBtn && uploadModal) {
                addPhotoBtn.addEventListener('click', () => {
                    if (currentCollectionId) { // Only open if a collection is selected
                        uploadModal.classList.add('active');
                        uploadForm.reset(); // Clear form on open
                        currentSelectedTags.clear(); // Clear selected tags
                        updateSelectedTagsInput(); // Update hidden input
                        highlightSelectedTags(); // Clear highlight
                        fileInput.required = true; // Ensure file input is required on open
                        uploadProgressText.textContent = '';
                    } else {
                        alert("Please select or create a memory/collection first.");
                    }
                });
            }
            if (uploadModalCloseBtn && uploadModal) {
                uploadModalCloseBtn.addEventListener('click', () => uploadModal.classList.remove('active'));
            }
            if (uploadModal) {
                uploadModal.addEventListener('click', (e) => {
                    if (e.target === uploadModal) uploadModal.classList.remove('active');
                });
            }

            // Tag Button Logic
            if (tagButtonsContainer) {
                tagButtonsContainer.addEventListener('click', (e) => {
                    const button = e.target.closest('.tag-button');
                    if (button) {
                        const tag = button.dataset.tag;
                        if (currentSelectedTags.has(tag)) {
                            currentSelectedTags.delete(tag);
                        } else {
                            currentSelectedTags.add(tag);
                        }
                        updateSelectedTagsInput();
                        highlightSelectedTags();
                    }
                });
            }

            // Create Collection Modal
            if (createCollectionBtn && createCollectionModal) {
                createCollectionBtn.addEventListener('click', () => {
                    createCollectionModal.classList.add('active');
                    createCollectionForm.reset(); // Reset form on open
                });
            }
            if (createCollectionCloseBtn && createCollectionModal) {
                createCollectionCloseBtn.addEventListener('click', () => createCollectionModal.classList.remove('active'));
            }
            if (createCollectionModal) {
                createCollectionModal.addEventListener('click', (e) => {
                    if (e.target === createCollectionModal) createCollectionModal.classList.remove('active');
                });
            }

            // Delete Confirmation Modal
            if (deleteModalCloseBtn) {
                deleteModalCloseBtn.addEventListener('click', closeDeleteConfirmation);
            }
            if (deleteConfirmModal) {
                deleteConfirmModal.addEventListener('click', (e) => {
                    if (e.target === deleteConfirmModal) closeDeleteConfirmation();
                });
            }
            if (cancelDeleteBtn) {
                cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
            }
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
            }
        };

        const openDeleteConfirmation = (type, id, name = '', fileId = null, collectionId = null, imageUrl = null, thumbnailUrl = null, caption = null, uploadedAt = null) => {
            currentDeleteTarget = { type, id, fileId, collectionId, imageUrl, thumbnailUrl, caption, uploadedAt };
            let message = '';
            if (type === 'collection') {
                message = `Are you sure you want to delete the entire memory "${name}" and all its photos? This cannot be undone.`;
            } else if (type === 'photo') {
                message = `Are you sure you want to delete this photo from the memory "${name}"?`;
            }
            deleteConfirmMessage.textContent = message;
            deleteConfirmModal.classList.add('active');
        };

        const closeDeleteConfirmation = () => {
            deleteConfirmModal.classList.remove('active');
            currentDeleteTarget = { type: null, id: null, fileId: null, collectionId: null, imageUrl: null, thumbnailUrl: null, caption: null, uploadedAt: null }; // Reset state
        };

        const handleConfirmDelete = async () => {
            const { type, id, fileId, collectionId, imageUrl, thumbnailUrl, caption, uploadedAt } = currentDeleteTarget;
            if (!type || !id) {
                console.error("Invalid delete target.");
                closeDeleteConfirmation();
                return;
            }

            try {
                if (type === 'collection') {
                    // 1. Fetch all photos in the collection to get their ImageKit fileIds
                    const collectionDoc = await collectionsCollection.doc(id).get();
                    const collectionData = collectionDoc.data();
                    if (collectionData && collectionData.photos && collectionData.photos.length > 0) {
                        // Delete each photo from ImageKit
                        for (const photo of collectionData.photos) {
                            if (photo.fileId) {
                                await fetch('/api/delete-image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ fileId: photo.fileId })
                                });
                            }
                        }
                    }
                    // 2. Delete the collection document from Firestore
                    await collectionsCollection.doc(id).delete();
                    closeDeleteConfirmation();
                    navigate('#collections'); // Go back to collections view
                } else if (type === 'photo') {
                    // Delete photo from ImageKit
                    const response = await fetch('/api/delete-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileId: fileId })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Failed to delete from storage: ${errorData.message || response.statusText}`);
                    }

                    // Prepare the photo object to be removed (must match exactly)
                    const photoToRemove = {
                        fileId: fileId,
                        imageUrl: imageUrl,
                        thumbnailUrl: thumbnailUrl,
                        caption: caption,
                        uploadedAt: uploadedAt // This should already be a Firestore Timestamp or a Date object
                    };

                    // Check if the deleted photo was the cover photo
                    const currentCollectionDoc = await collectionsCollection.doc(collectionId).get();
                    const currentCollectionData = currentCollectionDoc.data();
                    if (currentCollectionData.coverPhotoUrl === thumbnailUrl) {
                        // If it was the cover, remove it and potentially set a new one
                        // For simplicity, we'll just remove it. A more advanced feature would find the next earliest photo.
                        await collectionsCollection.doc(collectionId).update({
                            coverPhotoUrl: firebase.firestore.FieldValue.delete() // Remove the field
                        });
                    }

                    // Remove photo from the array in the Firestore collection document
                    await collectionsCollection.doc(collectionId).update({
                        photos: firebase.firestore.FieldValue.arrayRemove(photoToRemove)
                    });
                    closeDeleteConfirmation();
                }
            } catch (error) {
                console.error("Error during deletion:", error);
                alert(`Could not delete the ${type}. Please try again. Check console for details.`);
            }
        };


        // --- 3. CREATE NEW COLLECTION LOGIC ---
        const handleCreateCollection = async (e) => {
            e.preventDefault();
            const collectionName = collectionNameInput.value.trim();
            const collectionDescription = collectionDescriptionInput.value.trim(); // Get new description

            if (!collectionName) {
                alert("Please enter a name for your memory.");
                return;
            }

            submitCreateCollectionBtn.disabled = true;

            try {
                await collectionsCollection.add({
                    name: collectionName,
                    description: collectionDescription, // Save the description
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    photos: [], // Initialize with an empty array of photos
                    coverPhotoUrl: null // Initialize cover photo as null
                });
                createCollectionForm.reset();
                createCollectionModal.classList.remove('active');
            } catch (error) {
                console.error("Error creating collection:", error);
                alert("Could not create memory. Please try again.");
            } finally {
                submitCreateCollectionBtn.disabled = false;
            }
        };

        // --- 4. UPLOAD PHOTO TO COLLECTION LOGIC ---
        const handleUploadPhotoToCollection = async (e) => {
            e.preventDefault();
            const files = fileInput.files;
            const caption = captionInput.value.trim(); // Get caption (now optional)
            const tags = JSON.parse(selectedTagsInput.value || '[]'); // Get selected tags

            if (files.length === 0) { // Only file is strictly required now
                alert("Please select at least one image.");
                return;
            }
            if (!currentCollectionId) {
                alert("No collection selected. Please navigate to a memory to add photos.");
                return;
            }

            submitUploadBtn.disabled = true;
            uploadProgressText.textContent = 'Preparing to upload...';

            try {
                const currentPhotosSnapshot = await collectionsCollection.doc(currentCollectionId).get();
                const existingPhotosCount = (currentPhotosSnapshot.data()?.photos || []).length;
                let isFirstPhoto = (existingPhotosCount === 0);
                let firstUploadedThumbnailUrl = null;

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    uploadProgressText.textContent = `Uploading ${i + 1} of ${files.length}...`;

                    const authResponse = await fetch('/api/auth');
                    const { signature, expire, token } = await authResponse.json();

                    const result = await imagekit.upload({
                        file,
                        fileName: file.name,
                        useUniqueFileName: true,
                        signature, expire, token,
                    });

                    const currentClientTimestamp = new Date();

                    const newPhoto = {
                        fileId: result.fileId,
                        imageUrl: result.url,
                        thumbnailUrl: result.thumbnailUrl,
                        caption: caption, // Save the caption (can be empty)
                        tags: tags,       // Save the selected tags
                        uploadedAt: currentClientTimestamp
                    };

                    // Add photo details to the 'photos' array of the current collection document
                    await collectionsCollection.doc(currentCollectionId).update({
                        photos: firebase.firestore.FieldValue.arrayUnion(newPhoto)
                    });

                    // If this is the very first photo being added to this collection, set it as cover
                    if (isFirstPhoto && firstUploadedThumbnailUrl === null) {
                        firstUploadedThumbnailUrl = newPhoto.thumbnailUrl;
                        await collectionsCollection.doc(currentCollectionId).update({
                            coverPhotoUrl: firstUploadedThumbnailUrl
                        });
                    }
                    // After the first photo is added, subsequent photos won't be "the first"
                    isFirstPhoto = false; 
                }

                uploadForm.reset();
                currentSelectedTags.clear(); // Clear tags after successful upload
                updateSelectedTagsInput();
                highlightSelectedTags(); // Remove tag highlights
                setTimeout(() => {
                    uploadModal.classList.remove('active');
                    uploadProgressText.textContent = ""; // Clear progress text after closing
                    submitUploadBtn.disabled = false;
                }, 100);
                
            } catch (error) {
                console.error("Upload failed:", error);
                uploadProgressText.textContent = "An upload failed. Check console.";
                submitUploadBtn.disabled = false;
            }
        };

        // --- 5. RENDER UI FUNCTIONS ---

        // Renders the main collections view
        const renderCollectionsView = () => {
            currentCollectionId = null; // No collection selected
            appContainer.innerHTML = `
                <h2 class="page-title">Sweet Memories</h2>
                <p class="page-description">Click a memory to view photos or create a new one!</p>
                <div id="collections-grid" class="collections-grid">
                    <p class="loading-text">Loading memories...</p>
                </div>
            `;
            addPhotoBtn.style.display = 'none'; // Hide add photo button on collections page
            createCollectionBtn.style.display = 'flex'; // Show create collection button
            document.body.classList.remove('viewing-collection'); // Remove this class
            document.body.classList.add('viewing-collections'); // Add this class

            const collectionsGrid = document.getElementById('collections-grid');

            collectionsCollection.orderBy("createdAt", "desc").onSnapshot(snapshot => {
                if (!collectionsGrid) return; // Grid might not be rendered yet if nav changed quickly

                if (snapshot.empty) {
                    collectionsGrid.innerHTML = `<p class="loading-text">No memories yet. Click the '+' button to create your first one!</p>`;
                    return;
                }

                collectionsGrid.innerHTML = ''; // Clear existing collections

                snapshot.forEach(doc => {
                    const collection = doc.data();
                    const collectionId = doc.id;
                    const photoCount = (collection.photos && Array.isArray(collection.photos)) ? collection.photos.length : 0;
                    const coverPhotoUrl = collection.coverPhotoUrl;
                    const collectionDescription = collection.description || ''; // Get the description

                    const collectionCard = document.createElement('div');
                    collectionCard.className = 'collection-card';
                    collectionCard.innerHTML = `
                        <div class="delete-collection-icon" data-collection-id="${collectionId}" data-collection-name="${collection.name}">
                            <i class="fa-solid fa-trash"></i>
                        </div>
                        ${coverPhotoUrl ? `<div class="collection-cover"><img src="${coverPhotoUrl}" alt="${collection.name} Cover"></div>` : '<div class="collection-placeholder"></div>'}
                        <h3>${collection.name}</h3>
                        ${collectionDescription ? `<p class="collection-short-description">${collectionDescription}</p>` : ''} <p class="collection-photo-count">${photoCount} photo${photoCount === 1 ? '' : 's'}</p>
                    `;
                    collectionCard.dataset.collectionId = collectionId; // For click event
                    collectionsGrid.appendChild(collectionCard);
                });

                // Add event listeners for navigating to collection details
                collectionsGrid.querySelectorAll('.collection-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        // If trash icon was clicked, let its handler manage it
                        if (e.target.closest('.delete-collection-icon')) return;
                        
                        const id = card.dataset.collectionId;
                        if (id) navigate(`#collection/${id}`);
                    });
                });

                // Add event listeners for deleting collections
                collectionsGrid.querySelectorAll('.delete-collection-icon').forEach(icon => {
                    icon.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent card click event from firing
                        const collectionIdToDelete = icon.dataset.collectionId;
                        const collectionNameToDelete = icon.dataset.collectionName;
                        openDeleteConfirmation('collection', collectionIdToDelete, collectionNameToDelete);
                    });
                });

            }, error => {
                console.error("Firestore collections listener failed:", error);
                if (collectionsGrid) collectionsGrid.innerHTML = `<p class="loading-text">Error loading memories. Check console for details.</p>`;
            });
        };

        // Renders the photos within a specific collection
        const renderCollectionDetailsView = async (collectionId) => {
            currentCollectionId = collectionId; // Set current collection context
            addPhotoBtn.style.display = 'flex'; // Show add photo button
            createCollectionBtn.style.display = 'none'; // Hide create collection button
            document.body.classList.remove('viewing-collections'); // Remove this class
            document.body.classList.add('viewing-collection'); // Add this class

            // Fetch collection details to get its name and description
            const collectionDoc = await collectionsCollection.doc(collectionId).get();
            if (!collectionDoc.exists) {
                appContainer.innerHTML = `
                    <h2 class="page-title" style="color:red;">Memory Not Found</h2>
                    <p class="page-description">The memory you are looking for does not exist.</p>
                    <button onclick="window.location.hash='#collections'" class="btn-secondary" style="padding: 10px 20px; font-size: 1rem; cursor: pointer;">Go Back to Memories</button>
                `;
                return;
            }
            const collectionData = collectionDoc.data();
            const collectionName = collectionData.name || 'Untitled Memory';
            const collectionDescription = collectionData.description || 'A collection of beautiful moments.'; // Updated default description

            // Updated HTML structure to match index2.html's photo gallery
            appContainer.innerHTML = `
                <button onclick="window.location.hash='#collections'" class="back-btn"><i class="fa-solid fa-arrow-left"></i> Back to Memories</button>
                <div id="photo-gallery" class="photo-gallery">
                    <h2 class="gallery-title">${collectionName}</h2>
                    <p class="gallery-des">${collectionDescription}</p> <div id="photo-grid" class="gallery-grid">
                        <p class="loading-text">Loading photos...</p>
                    </div>
                </div>
            `;
            const photoGrid = document.getElementById('photo-grid');

            // Listen for changes to the specific collection's photos array
            collectionsCollection.doc(collectionId).onSnapshot(docSnapshot => {
                if (!docSnapshot.exists) {
                    // If collection was deleted while viewing it
                    navigate('#collections');
                    return;
                }
                const data = docSnapshot.data();
                const photos = data.photos || [];

                if (!photoGrid) return;

                if (photos.length === 0) {
                    photoGrid.innerHTML = `<p class="loading-text">No photos in this memory yet. Click the '+' to add one!</p>`;
                    return;
                }

                photoGrid.innerHTML = ''; // Clear the grid

                // Sort photos by uploadedAt in descending order
                photos.sort((a, b) => {
                    const dateA = a.uploadedAt ? a.uploadedAt.toDate().getTime() : 0;
                    const dateB = b.uploadedAt ? b.uploadedAt.toDate().getTime() : 0;
                    return dateB - dateA;
                });


                photos.forEach(photo => {
                    const postDate = photo.uploadedAt ? photo.uploadedAt.toDate().toLocaleDateString() : 'Just now';
                    const photoCaption = photo.caption || ''; // Get caption
                    const photoTags = photo.tags || []; // Get tags

                    // Generate tag HTML
                    const tagsHtml = photoTags.map(tag => `<span class="photo-tag tag-${tag}">${tag}</span>`).join('');

                    const card = document.createElement('div');
                    card.className = 'gallery-card'; // Use gallery-card class
                    card.innerHTML = `
                        <div class="delete-icon"
                            data-file-id="${photo.fileId}"
                            data-image-url="${photo.imageUrl}"
                            data-thumbnail-url="${photo.thumbnailUrl}"
                            data-caption="${photo.caption || ''}"
                            data-uploaded-at="${photo.uploadedAt ? photo.uploadedAt.toDate().toISOString() : ''}"
                            data-collection-id="${collectionId}"
                            data-collection-name="${collectionName}"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </div>
                        <img class="lazy" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-src="${photo.imageUrl}" alt="${photo.caption || 'Gallery Image'}">
                        <div class="photo-tags-container"> ${tagsHtml}
                        </div>
                        ${photoCaption ? `<p class="photo-caption"><span lang="bn" class="bangla-word">${photoCaption}</span></p>` : ''}
                        <small class="photo-date">${postDate}</small>
                    `;
                    photoGrid.appendChild(card);
                });
                setupLazyLoading(photoGrid); // Initialize lazy loading for new photos
                initializeLightboxForElement(photoGrid); // Re-initialize lightbox for new photos
                
                // Add delete event listeners for photos
                photoGrid.querySelectorAll('.delete-icon').forEach(icon => {
                    icon.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent lightbox from opening if clicking trash
                        const fileIdToDelete = icon.dataset.fileId;
                        const photoCollectionId = icon.dataset.collectionId;
                        const photoCollectionName = icon.dataset.collectionName;

                        // Pass all necessary photo details to currentDeleteTarget for arrayRemove to work
                        currentDeleteTarget = {
                            type: 'photo',
                            id: fileIdToDelete, // For photos, id refers to fileId
                            fileId: fileIdToDelete,
                            collectionId: photoCollectionId,
                            imageUrl: icon.dataset.imageUrl,
                            thumbnailUrl: icon.dataset.thumbnailUrl,
                            caption: icon.dataset.caption,
                            uploadedAt: icon.dataset.uploadedAt ? firebase.firestore.Timestamp.fromDate(new Date(icon.dataset.uploadedAt)) : null // Reconstruct timestamp for precise arrayRemove
                        };
                        openDeleteConfirmation('photo', fileIdToDelete, photoCollectionName, fileIdToDelete, photoCollectionId, currentDeleteTarget.imageUrl, currentDeleteTarget.thumbnailUrl, currentDeleteTarget.caption, currentDeleteTarget.uploadedAt);
                    });
                });


            }, error => {
                console.error("Firestore photos listener failed for collection:", collectionId, error);
                if (photoGrid) photoGrid.innerHTML = `<p class="loading-text">Error loading photos. Check console for details.</p>`;
            });
        };

        // --- 6. LIGHTBOX LOGIC (Remains largely the same) ---
        const initializeLightboxForElement = (container) => {
            if (!lightbox || !lightboxImg || !lightboxCloseBtn) {
                console.error("Lightbox functionality cannot be initialized because one or more required HTML elements are missing.");
                return;
            }

            // Select images that are part of the new gallery-card structure
            const galleryImages = container.querySelectorAll('.gallery-card img'); 
            galleryImages.forEach(img => {
                img.addEventListener('click', () => {
                    // Use the `src` attribute which will be updated by lazy loading to the full image
                    lightboxImg.src = img.src; 
                    lightbox.classList.add('active');
                });
            });

            lightboxCloseBtn.addEventListener('click', () => lightbox.classList.remove('active'));
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) lightbox.classList.remove('active');
            });
        };

        // --- 7. LAZY LOADING LOGIC ---
        const setupLazyLoading = (container) => {
            const lazyImages = container.querySelectorAll('img.lazy');

            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const lazyImage = entry.target;
                            lazyImage.src = lazyImage.dataset.src;
                            observer.unobserve(lazyImage);
                            lazyImage.onload = () => {
                                lazyImage.classList.add('loaded');
                            };
                        }
                    });
                });

                lazyImages.forEach(image => {
                    observer.observe(image);
                });
            } else {
                // Fallback for older browsers
                lazyImages.forEach(lazyImage => {
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.add('loaded');
                });
            }
        };


        // --- 8. ROUTING / SPA LOGIC ---
        const navigate = (hash) => {
            window.location.hash = hash;
        };

        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#collection/')) {
                const collectionId = hash.substring('#collection/'.length);
                renderCollectionDetailsView(collectionId);
            } else {
                // Default to collections view if hash is empty or unrecognized
                renderCollectionsView();
            }
        };

        // --- INITIALIZE THE APP ---
        // Attach event listeners for forms and global modals
        if (createCollectionForm) {
            createCollectionForm.addEventListener('submit', handleCreateCollection);
        }
        if (uploadForm) {
            uploadForm.addEventListener('submit', handleUploadPhotoToCollection);
        }

        setupGlobalModalHandlers(); // Set up all modal open/close handlers

        // Initial route handling
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Call once on load to render the correct view
    }; // End of initializeGalleryApp function

    // Start the authentication flow when the DOM is ready
    startApp();
});