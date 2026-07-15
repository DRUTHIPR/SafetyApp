import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC7c8YHZv6cbQBJVyiBocXdF7NPT7OKbMA",
  authDomain: "womens-safety-app-dda3f.firebaseapp.com",
  projectId: "womens-safety-app-dda3f",
  storageBucket: "womens-safety-app-dda3f.firebasestorage.app",
  messagingSenderId: "841748649686",
  appId: "1:841748649686:android:fc2571fadb84890cee5b77",
};
let app, auth, db, storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.log('❌ Firebase initialization failed:', error);
  app = null;
  auth = null;
  db = null;
  storage = null;
}

export { app, auth, db, storage };

export const initializeFirebase = () => {
  return app;
};
