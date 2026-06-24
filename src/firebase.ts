import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
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
// ignoreUndefinedProperties: los campos `undefined` (p. ej. opcionales de
// ReportImage como croppedUrl/slotUbicacion) se omiten en vez de lanzar
// "Unsupported field value: undefined" al guardar en Firestore.
export const db      = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const storage = getStorage(app, 'gs://certimar-1511-doctos-storage');
