import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyANSlT4OBfxru8uiRj7lKhKTfpqjN5BEdc",
  authDomain: "certimar-1511-doctos.firebaseapp.com",
  projectId: "certimar-1511-doctos",
  storageBucket: "certimar-1511-doctos.firebasestorage.app",
  messagingSenderId: "542219488222",
  appId: "1:542219488222:web:841566d7f8a7489982ab4f",
};

export const app     = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app, 'gs://certimar-1511-doctos-storage');
