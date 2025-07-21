import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Tag, Trash2, Lock } from 'lucide-react';
import { deleteImage, updateImageMetadata } from '../../services/firebase';
import { decryptMessage } from '../../services/encryption';
import { getThumbnailUrl } from '../../services/imagekit';

const ImageGrid = ({ images, onImageClick, onImageDelete, selectedTags = [] }) => {
  const [filteredImages, setFilteredImages] = useState(images);
  const [loadedImages, setLoadedImages] = useState(new Set());

  useEffect(() => {
    // Filter images based on selected tags
    if (selectedTags.length === 0) {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(image => 
        image.tags && image.tags.some(tag => selectedTags.includes(tag))
      );
      setFilteredImages(filtered);
    }
  }, [images, selectedTags]);

  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => new Set([...prev, imageId]));
  };

  const handleImageDelete = async (imageId, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      const result = await deleteImage(imageId);
      if (result.success) {
        onImageDelete(imageId);
      } else {
        alert('Failed to delete image: ' + result.error);
      }
    }
  };

  const getImageUrl = (image) => {
    if (image.thumbnailUrl) {
      return image.thumbnailUrl;
    }
    
    const thumbnailResult = getThumbnailUrl(image.imageUrl, 400, 400);
    return thumbnailResult.success ? thumbnailResult.url : image.imageUrl;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasEncryptedNote = (image) => {
    return image.encryptedNote && image.encryptedNote.trim() !== '';
  };

  if (filteredImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4 opacity-50">📸</div>
        <h3 className="text-xl text-[var(--vault-text)] mb-2">No memories found</h3>
        <p className="text-[var(--vault-text-muted)] italic">
          {selectedTags.length > 0 
            ? "No images match the selected tags" 
            : "Upload your first memory to begin your vault"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {filteredImages.map((image) => (
        <div
          key={image.id}
          className="image-glow cursor-pointer group relative"
          onClick={() => onImageClick(image)}
        >
          {/* Image container */}
          <div className="relative overflow-hidden rounded-lg bg-gray-800">
            <img
              src={getImageUrl(image)}
              alt={image.title || 'Memory'}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={() => handleImageLoad(image.id)}
              loading="lazy"
            />
            
            {/* Loading overlay */}
            {!loadedImages.has(image.id) && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--vault-accent)]/30 border-t-[var(--vault-accent)] rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-white text-center">
                <Heart className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">View Memory</p>
              </div>
            </div>
            
            {/* Delete button */}
            <button
              onClick={(e) => handleImageDelete(image.id, e)}
              className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Image metadata */}
          <div className="mt-3 space-y-2">
            {/* Title and date */}
            <div className="flex justify-between items-start">
              <h4 className="text-[var(--vault-text)] font-medium text-sm truncate flex-1">
                {image.title || 'Untitled Memory'}
              </h4>
              <span className="text-[var(--vault-text-muted)] text-xs ml-2">
                {formatDate(image.createdAt)}
              </span>
            </div>
            
            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {image.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="tag-pill text-xs">
                    {tag}
                  </span>
                ))}
                {image.tags.length > 3 && (
                  <span className="text-[var(--vault-text-muted)] text-xs">
                    +{image.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            {/* Indicators */}
            <div className="flex items-center space-x-2 text-[var(--vault-text-muted)]">
              {hasEncryptedNote(image) && (
                <div className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span className="text-xs">Secret note</span>
                </div>
              )}
              
              {image.aiGenerated && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span className="text-xs">AI tagged</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;

