import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, Edit3, Heart, Calendar, Tag } from 'lucide-react';
import { decryptMessage, encryptMessage } from '../../services/encryption';
import { updateImageMetadata } from '../../services/firebase';
import { getSignedUrl } from '../../services/imagekit';

const ImageModal = ({ image, isOpen, onClose, onUpdate }) => {
  const [fullImageUrl, setFullImageUrl] = useState('');
  const [decryptedNote, setDecryptedNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (image && isOpen) {
      // Get signed URL for full resolution image
      const signedResult = getSignedUrl(image.imageUrl, 3600);
      if (signedResult.success) {
        setFullImageUrl(signedResult.url);
      }
      
      // Reset states
      setShowNote(false);
      setIsEditingNote(false);
      setIsEditingTags(false);
      setDecryptedNote('');
      setNoteInput('');
      setTagsInput(image.tags ? image.tags.join(', ') : '');
    }
  }, [image, isOpen]);

  const handleDecryptNote = async () => {
    if (!image.encryptedNote) return;
    
    setLoading(true);
    const result = decryptMessage(image.encryptedNote);
    
    if (result.success) {
      setDecryptedNote(result.decrypted);
      setShowNote(true);
      setNoteInput(result.decrypted);
      
      // Auto-hide after 30 seconds for security
      setTimeout(() => {
        setShowNote(false);
        setDecryptedNote('');
      }, 30000);
    } else {
      alert('Failed to decrypt note: ' + result.error);
    }
    setLoading(false);
  };

  const handleSaveNote = async () => {
    setLoading(true);
    
    const encryptResult = encryptMessage(noteInput);
    if (encryptResult.success) {
      const updateResult = await updateImageMetadata(image.id, {
        encryptedNote: encryptResult.encrypted
      });
      
      if (updateResult.success) {
        onUpdate({ ...image, encryptedNote: encryptResult.encrypted });
        setIsEditingNote(false);
        setShowNote(false);
      } else {
        alert('Failed to save note: ' + updateResult.error);
      }
    } else {
      alert('Failed to encrypt note: ' + encryptResult.error);
    }
    
    setLoading(false);
  };

  const handleSaveTags = async () => {
    setLoading(true);
    
    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const updateResult = await updateImageMetadata(image.id, { tags });
    
    if (updateResult.success) {
      onUpdate({ ...image, tags });
      setIsEditingTags(false);
    } else {
      alert('Failed to save tags: ' + updateResult.error);
    }
    
    setLoading(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative z-10 max-w-6xl max-h-[90vh] w-full mx-4 bg-[var(--vault-secondary)] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-medium text-[var(--vault-text)]">
            {image.title || 'Untitled Memory'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--vault-text-muted)] hover:text-[var(--vault-text)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Image section */}
          <div className="flex-1 flex items-center justify-center p-4 bg-black/20">
            <img
              src={fullImageUrl || image.imageUrl}
              alt={image.title || 'Memory'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          
          {/* Metadata section */}
          <div className="w-full lg:w-80 p-6 space-y-6 overflow-y-auto">
            {/* Date */}
            <div className="flex items-center space-x-2 text-[var(--vault-text-muted)]">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(image.createdAt)}</span>
            </div>
            
            {/* Tags section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-[var(--vault-text-muted)]" />
                  <span className="text-sm font-medium text-[var(--vault-text)]">Tags</span>
                </div>
                <button
                  onClick={() => setIsEditingTags(!isEditingTags)}
                  className="text-[var(--vault-accent)] hover:text-[var(--vault-accent-soft)] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              
              {isEditingTags ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Enter tags separated by commas"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vault-text)] text-sm"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveTags}
                      disabled={loading}
                      className="px-3 py-1 bg-[var(--vault-accent)] text-white text-sm rounded-md hover:bg-[var(--vault-accent-soft)] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingTags(false)}
                      className="px-3 py-1 bg-white/10 text-[var(--vault-text)] text-sm rounded-md hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {image.tags && image.tags.length > 0 ? (
                    image.tags.map((tag, index) => (
                      <span key={index} className="tag-pill text-xs">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--vault-text-muted)] text-sm italic">No tags</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Encrypted note section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[var(--vault-text-muted)]" />
                  <span className="text-sm font-medium text-[var(--vault-text)]">Secret Note</span>
                </div>
                <button
                  onClick={() => setIsEditingNote(!isEditingNote)}
                  className="text-[var(--vault-accent)] hover:text-[var(--vault-accent-soft)] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              
              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Write a secret note for this memory..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vault-text)] text-sm resize-none h-20"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveNote}
                      disabled={loading}
                      className="px-3 py-1 bg-[var(--vault-accent)] text-white text-sm rounded-md hover:bg-[var(--vault-accent-soft)] transition-colors"
                    >
                      {loading ? 'Encrypting...' : 'Save & Encrypt'}
                    </button>
                    <button
                      onClick={() => setIsEditingNote(false)}
                      className="px-3 py-1 bg-white/10 text-[var(--vault-text)] text-sm rounded-md hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {image.encryptedNote && image.encryptedNote.trim() !== '' ? (
                    <div className="space-y-2">
                      {showNote ? (
                        <div className="p-3 bg-[var(--vault-accent)]/10 border border-[var(--vault-accent)]/20 rounded-lg">
                          <p className="text-[var(--vault-text)] text-sm italic">
                            "{decryptedNote}"
                          </p>
                          <p className="text-xs text-[var(--vault-text-muted)] mt-2">
                            This note will hide automatically in 30 seconds for security.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleDecryptNote}
                          disabled={loading}
                          className="flex items-center space-x-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vault-text)] text-sm hover:bg-white/10 transition-colors"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>{loading ? 'Decrypting...' : '💬 Tap to Reveal Secret'}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[var(--vault-text-muted)] text-sm italic">No secret note</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Image info */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-[var(--vault-text)] mb-2">Memory Details</h4>
              <div className="space-y-1 text-xs text-[var(--vault-text-muted)]">
                <p>Size: {image.size ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
                <p>Type: {image.type || 'Image'}</p>
                {image.dimensions && (
                  <p>Dimensions: {image.dimensions.width} × {image.dimensions.height}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;

