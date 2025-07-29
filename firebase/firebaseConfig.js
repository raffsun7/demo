// Firebase configuration and Firestore functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    orderBy, 
    query,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyCuXZ-d1f4O0vn28Pt5ISqy5B04PZtuhi4",
  authDomain: "usss-8d9b6.firebaseapp.com",
  projectId: "usss-8d9b6",
  storageBucket: "usss-8d9b6.firebasestorage.app",
  messagingSenderId: "291519931061",
  appId: "1:291519931061:web:fd9b344b8b712aa24214fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore API functions
export const firestoreAPI = {
    // Add a new note
    async addNote(noteData) {
        try {
            const docRef = await addDoc(collection(db, 'notes'), {
                ...noteData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: docRef.id, ...noteData };
        } catch (error) {
            console.error('Error adding note:', error);
            throw error;
        }
    },

    // Get all notes
    async getNotes() {
        try {
            const q = query(collection(db, 'notes'), orderBy('updatedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const notes = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                notes.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate()
                });
            });
            return notes;
        } catch (error) {
            console.error('Error getting notes:', error);
            throw error;
        }
    },

    // Update a note
    async updateNote(noteId, noteData) {
        try {
            const noteRef = doc(db, 'notes', noteId);
            await updateDoc(noteRef, {
                ...noteData,
                updatedAt: serverTimestamp()
            });
            return { id: noteId, ...noteData };
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    },

    // Delete a note
    async deleteNote(noteId) {
        try {
            await deleteDoc(doc(db, 'notes', noteId));
            return noteId;
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }
};

export default app;

