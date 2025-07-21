import CryptoJS from 'crypto-js';

// Secret key for encryption - in production, this should be derived from user authentication
const getEncryptionKey = () => {
  // In a real implementation, this would be derived from user credentials
  // For now, we'll use a combination of user email and a secret
  const userEmail = localStorage.getItem('userEmail') || 'default';
  const secret = import.meta.env.VITE_ENCRYPTION_SECRET || 'vault-secret-key';
  return CryptoJS.SHA256(userEmail + secret).toString();
};

// Encrypt a message
export const encryptMessage = (message) => {
  try {
    if (!message || message.trim() === '') {
      return { success: true, encrypted: '' };
    }
    
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    
    return { success: true, encrypted };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Decrypt a message
export const decryptMessage = (encryptedMessage) => {
  try {
    if (!encryptedMessage || encryptedMessage.trim() === '') {
      return { success: true, decrypted: '' };
    }
    
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }
    
    return { success: true, decrypted };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate a secure hash for verification
export const generateHash = (data) => {
  try {
    const hash = CryptoJS.SHA256(data).toString();
    return { success: true, hash };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Verify if a message can be decrypted (without actually decrypting it)
export const canDecrypt = (encryptedMessage) => {
  try {
    const result = decryptMessage(encryptedMessage);
    return result.success && result.decrypted !== '';
  } catch (error) {
    return false;
  }
};

