import React, { useState, useEffect } from 'react';
import { Heart, Cloud, Plane, Mail, Moon, Sparkles, Tag } from 'lucide-react';

const FilterStrip = ({ images, selectedTags, onTagsChange }) => {
  const [availableTags, setAvailableTags] = useState([]);
  
  // Predefined mood categories with icons
  const moodCategories = [
    { name: 'Love', icon: Heart, color: 'text-pink-400' },
    { name: 'Rain', icon: Cloud, color: 'text-blue-400' },
    { name: 'Travel', icon: Plane, color: 'text-green-400' },
    { name: 'Letters', icon: Mail, color: 'text-yellow-400' },
    { name: 'Night', icon: Moon, color: 'text-purple-400' },
    { name: 'Beautiful', icon: Sparkles, color: 'text-pink-300' }
  ];

  useEffect(() => {
    // Extract all unique tags from images
    const allTags = new Set();
    images.forEach(image => {
      if (image.tags) {
        image.tags.forEach(tag => allTags.add(tag.toLowerCase()));
      }
    });
    
    // Combine mood categories with actual tags
    const moodTags = moodCategories.map(cat => cat.name.toLowerCase());
    const otherTags = Array.from(allTags).filter(tag => !moodTags.includes(tag));
    
    setAvailableTags([
      ...moodCategories.map(cat => ({
        name: cat.name.toLowerCase(),
        displayName: cat.name,
        icon: cat.icon,
        color: cat.color,
        isMood: true
      })),
      ...otherTags.map(tag => ({
        name: tag,
        displayName: tag,
        icon: Tag,
        color: 'text-gray-400',
        isMood: false
      }))
    ]);
  }, [images]);

  const handleTagClick = (tagName) => {
    const newSelectedTags = selectedTags.includes(tagName)
      ? selectedTags.filter(tag => tag !== tagName)
      : [...selectedTags, tagName];
    
    onTagsChange(newSelectedTags);
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-[var(--vault-primary)]/80 backdrop-blur-md border-b border-white/10">
      <div className="px-6 py-4">
        <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
          {/* All button */}
          <button
            onClick={clearAllTags}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedTags.length === 0
                ? 'bg-[var(--vault-accent)] text-white shadow-lg shadow-[var(--vault-glow)]'
                : 'bg-white/10 text-[var(--vault-text-muted)] hover:bg-white/20 hover:text-[var(--vault-text)]'
            }`}
          >
            All
          </button>
          
          {/* Tag buttons */}
          {availableTags.map((tag) => {
            const Icon = tag.icon;
            const isSelected = selectedTags.includes(tag.name);
            
            return (
              <button
                key={tag.name}
                onClick={() => handleTagClick(tag.name)}
                className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isSelected
                    ? 'bg-[var(--vault-accent)] text-white shadow-lg shadow-[var(--vault-glow)] scale-105'
                    : 'bg-white/10 text-[var(--vault-text-muted)] hover:bg-white/20 hover:text-[var(--vault-text)] hover:scale-105'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : tag.color}`} />
                <span className="capitalize">{tag.displayName}</span>
              </button>
            );
          })}
        </div>
        
        {/* Selected tags indicator */}
        {selectedTags.length > 0 && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-[var(--vault-text-muted)]">
            <span>Filtering by:</span>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag, index) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-[var(--vault-accent)]/20 text-[var(--vault-accent)] rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={clearAllTags}
              className="text-[var(--vault-accent)] hover:text-[var(--vault-accent-soft)] transition-colors ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterStrip;

