import React, { useState, useEffect } from 'react';
import { onAuthChange, isAuthorized, getImages } from './services/firebase';
import useAutoLock from './hooks/useAutoLock';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/UI/Header';
import FilterStrip from './components/UI/FilterStrip';
import ImageGrid from './components/Gallery/ImageGrid';
import ImageModal from './components/Gallery/ImageModal';
import UploadModal from './components/Upload/UploadModal';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Auto-lock functionality
  const { timeRemaining, formattedTime, resetTimer } = useAutoLock(10); // 10 minutes

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (authUser && isAuthorized()) {
        setUser(authUser);
        await loadImages();
      } else {
        setUser(null);
        setImages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadImages = async () => {
    setLoadingImages(true);
    const result = await getImages();
    if (result.success) {
      setImages(result.images);
    } else {
      console.error('Failed to load images:', result.error);
    }
    setLoadingImages(false);
  };

  const handleLogin = (authUser) => {
    setUser(authUser);
    resetTimer();
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    resetTimer();
  };

  const handleImageUpdate = (updatedImage) => {
    setImages(prev => prev.map(img => 
      img.id === updatedImage.id ? updatedImage : img
    ));
    setSelectedImage(updatedImage);
  };

  const handleImageDelete = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    if (selectedImage && selectedImage.id === imageId) {
      setSelectedImage(null);
    }
  };

  const handleUploadComplete = (newImage) => {
    setImages(prev => [newImage, ...prev]);
    resetTimer();
  };

  const handleTagsChange = (tags) => {
    setSelectedTags(tags);
    resetTimer();
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--vault-accent)]/30 border-t-[var(--vault-accent)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="loading-text text-lg">
            "Awakening the vault..."
          </p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header
        user={user}
        onUploadClick={() => setShowUploadModal(true)}
        timeRemaining={timeRemaining}
        formattedTime={formattedTime}
      />

      {/* Filter Strip */}
      <FilterStrip
        images={images}
        selectedTags={selectedTags}
        onTagsChange={handleTagsChange}
      />

      {/* Main Content */}
      <main className="vault-unlock">
        {loadingImages ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[var(--vault-accent)]/30 border-t-[var(--vault-accent)] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="loading-text">
                "Gathering your memories..."
              </p>
            </div>
          </div>
        ) : (
          <ImageGrid
            images={images}
            selectedTags={selectedTags}
            onImageClick={handleImageClick}
            onImageDelete={handleImageDelete}
          />
        )}
      </main>

      {/* Modals */}
      <ImageModal
        image={selectedImage}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        onUpdate={handleImageUpdate}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Ambient cursor effect */}
      <div className="ambient-cursor" id="ambient-cursor"></div>
    </div>
  );
}

export default App;
