import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Tag, Lock, Sparkles } from 'lucide-react';
import { uploadImage } from '../../services/imagekit';
import { addImageMetadata } from '../../services/firebase';
import { encryptMessage } from '../../services/encryption';

const UploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [encryptNote, setEncryptNote] = useState(true);
  const [aiTagging, setAiTagging] = useState(true);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList) => {
    const validFiles = Array.from(fileList).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (validFiles.length > 0) {
      setFiles(validFiles);
      setCurrentFile(validFiles[0]);
      
      // Generate AI tags if enabled
      if (aiTagging) {
        generateAITags(validFiles[0]);
      }
    }
  };

  const generateAITags = async (file) => {
    // Simulate AI tagging - in production, this would call an AI service
    const mockTags = [
      'beautiful', 'memory', 'precious', 'love', 'joy', 'peaceful',
      'sunset', 'nature', 'portrait', 'candid', 'romantic', 'nostalgic'
    ];
    
    // Simulate API delay
    setTimeout(() => {
      const randomTags = mockTags
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setSuggestedTags(randomTags);
    }, 1500);
  };

  const handleUpload = async () => {
    if (!currentFile) return;
    
    setUploading(true);
    setUploadProgress({ [currentFile.name]: 0 });
    
    try {
      // Upload to ImageKit
      const fileName = `${Date.now()}_${currentFile.name}`;
      const uploadResult = await uploadImage(currentFile, fileName);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }
      
      setUploadProgress({ [currentFile.name]: 50 });
      
      // Prepare tags
      const allTags = [
        ...tags.split(',').map(tag => tag.trim()).filter(Boolean),
        ...suggestedTags
      ];
      
      // Encrypt note if needed
      let encryptedNote = '';
      if (note.trim() && encryptNote) {
        const encryptResult = encryptMessage(note);
        if (encryptResult.success) {
          encryptedNote = encryptResult.encrypted;
        }
      }
      
      // Save metadata to Firebase
      const metadata = {
        title: title || currentFile.name,
        imageUrl: uploadResult.result.url,
        fileId: uploadResult.result.fileId,
        tags: allTags,
        encryptedNote: encryptedNote,
        plainNote: encryptNote ? '' : note,
        size: currentFile.size,
        type: currentFile.type,
        dimensions: {
          width: uploadResult.result.width,
          height: uploadResult.result.height
        },
        aiGenerated: aiTagging && suggestedTags.length > 0
      };
      
      const metadataResult = await addImageMetadata(metadata);
      
      if (!metadataResult.success) {
        throw new Error(metadataResult.error);
      }
      
      setUploadProgress({ [currentFile.name]: 100 });
      
      // Success animation
      setTimeout(() => {
        onUploadComplete({ id: metadataResult.id, ...metadata });
        handleClose();
      }, 1000);
      
    } catch (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setCurrentFile(null);
    setTitle('');
    setTags('');
    setNote('');
    setSuggestedTags([]);
    setUploadProgress({});
    setUploading(false);
    onClose();
  };

  const addSuggestedTag = (tag) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      setTags(currentTags.concat(tag).join(', '));
    }
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative z-10 vault-container w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-medium text-[var(--vault-text)]">
            Upload Memory
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-[var(--vault-text-muted)] hover:text-[var(--vault-text)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* File drop zone */}
          {!currentFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-[var(--vault-accent)] bg-[var(--vault-accent)]/5' 
                  : 'border-white/20 hover:border-[var(--vault-accent)]/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-[var(--vault-accent)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--vault-text)] mb-2">
                Drop your memories here
              </h3>
              <p className="text-[var(--vault-text-muted)] mb-4">
                or click to select from your device
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-[var(--vault-accent)] text-white rounded-lg hover:bg-[var(--vault-accent-soft)] transition-colors"
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
          )}
          
          {/* File preview and details */}
          {currentFile && (
            <div className="space-y-6">
              {/* Image preview */}
              <div className="relative">
                <img
                  src={URL.createObjectURL(currentFile)}
                  alt="Preview"
                  className="w-full max-h-60 object-contain rounded-lg bg-black/20"
                />
                {uploadProgress[currentFile.name] !== undefined && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium">
                        {uploadProgress[currentFile.name]}%
                      </p>
                      <p className="text-sm opacity-80">Uploading to vault...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Title input */}
              <div>
                <label className="block text-sm font-medium text-[var(--vault-text)] mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this memory a name..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vault-text)] placeholder-[var(--vault-text-muted)]"
                />
              </div>
              
              {/* AI suggested tags */}
              {suggestedTags.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[var(--vault-accent)]" />
                    <span className="text-sm font-medium text-[var(--vault-text)]">
                      AI Suggested Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => addSuggestedTag(tag)}
                        className="px-3 py-1 bg-[var(--vault-accent)]/20 text-[var(--vault-accent)] rounded-full text-sm hover:bg-[var(--vault-accent)]/30 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags input */}
              <div>
                <label className="block text-sm font-medium text-[var(--vault-text)] mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="love, sunset, beautiful (separate with commas)"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vault-text)] placeholder-[var(--vault-text-muted)]"
                />
              </div>
              
              {/* Secret note */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--vault-text)]">
                    Secret Note
                  </label>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-[var(--vault-text-muted)]" />
                    <label className="flex items-center space-x-2 text-sm text-[var(--vault-text-muted)]">
                      <input
                        type="checkbox"
                        checked={encryptNote}
                        onChange={(e) => setEncryptNote(e.target.checked)}
                        className="rounded"
                      />
                      <span>Encrypt</span>
                    </label>
                  </div>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a secret message for this memory..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--vault-text)] placeholder-[var(--vault-text-muted)] resize-none h-20"
                />
              </div>
              
              {/* Upload button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-3 bg-gradient-to-r from-[var(--vault-accent)] to-[var(--vault-accent-soft)] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[var(--vault-glow)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Add to Vault'}
                </button>
                <button
                  onClick={() => setCurrentFile(null)}
                  disabled={uploading}
                  className="px-6 py-3 bg-white/10 text-[var(--vault-text)] rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;

