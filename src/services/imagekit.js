import ImageKit from 'imagekit-javascript';

// ImageKit configuration
const imagekit = new ImageKit({
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
  authenticationEndpoint: `${import.meta.env.VITE_API_BASE_URL}/api/auth`
});

// Upload image to ImageKit
export const uploadImage = async (file, fileName, folder = 'vault') => {
  try {
    const result = await imagekit.upload({
      file: file,
      fileName: fileName,
      folder: folder,
      isPrivateFile: true, // Make images private by default
      tags: ['private-vault', 'secure'],
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        vaultImage: 'true'
      }
    });
    
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate signed URL for private image access
export const getSignedUrl = (imageUrl, expireSeconds = 3600) => {
  try {
    const signedUrl = imagekit.url({
      src: imageUrl,
      signed: true,
      expireSeconds: expireSeconds
    });
    
    return { success: true, url: signedUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete image from ImageKit
export const deleteImage = async (fileId) => {
  try {
    // Note: Deletion requires server-side implementation
    // This would typically be handled by a serverless function
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delete-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId })
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate thumbnail URL
export const getThumbnailUrl = (imageUrl, width = 300, height = 300) => {
  try {
    const thumbnailUrl = imagekit.url({
      src: imageUrl,
      transformation: [{
        width: width,
        height: height,
        crop: 'maintain_ratio',
        quality: 80,
        format: 'webp'
      }],
      signed: true,
      expireSeconds: 3600
    });
    
    return { success: true, url: thumbnailUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default imagekit;

