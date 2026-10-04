import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc,
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const firebaseAuth = {
  async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      console.error('Firebase Google sign-in error:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch (error: any) {
      console.error('Firebase sign-out error:', error);
      throw error;
    }
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};

// Firebase File Upload & Storage Log Helper (Stores uploaded roster files metadata and parsed contents in Firestore)
export const firebaseStorage = {
  async uploadRosterFileLog(payload: {
    fileName: string;
    fileSize: number;
    recordsCount: number;
    uploadedBy: string;
    students: any[];
  }) {
    try {
      const docRef = await addDoc(collection(db, 'uploaded_files'), {
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        recordsCount: payload.recordsCount,
        uploadedBy: payload.uploadedBy || 'Admin',
        uploadedAt: new Date().toISOString(),
        status: 'processed',
      });
      return docRef.id;
    } catch (err) {
      console.warn('Could not record file upload in Firebase:', err);
      return null;
    }
  },

  async getUploadedFileLogs() {
    try {
      const snapshot = await getDocs(collection(db, 'uploaded_files'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn('Failed to fetch file logs from Firebase:', err);
      return [];
    }
  }
};
