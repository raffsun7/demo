import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';

// Firebase configuration - these will be set as environment variables in Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Whitelisted emails - only these two accounts can access the vault
const WHITELISTED_EMAILS = [
  import.meta.env.VITE_ALLOWED_EMAIL_1,
  import.meta.env.VITE_ALLOWED_EMAIL_2
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const signIn = async (email, password) => {
  try {
    // Check if email is whitelisted
    if (!WHITELISTED_EMAILS.includes(email)) {
      throw new Error('Access denied. This vault is private.');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore functions for image metadata
export const addImageMetadata = async (imageData) => {
  try {
    const docRef = await addDoc(collection(db, 'images'), {
      ...imageData,
      createdAt: new Date(),
      userId: auth.currentUser?.uid
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getImages = async () => {
  try {
    const q = query(
      collection(db, 'images'),
      where('userId', '==', auth.currentUser?.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const images = [];
    querySnapshot.forEach((doc) => {
      images.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, images };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteImage = async (imageId) => {
  try {
    await deleteDoc(doc(db, 'images', imageId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateImageMetadata = async (imageId, updates) => {
  try {
    await updateDoc(doc(db, 'images', imageId), {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper function to check if user is authenticated and authorized
export const isAuthorized = () => {
  const user = auth.currentUser;
  return user && WHITELISTED_EMAILS.includes(user.email);
};

