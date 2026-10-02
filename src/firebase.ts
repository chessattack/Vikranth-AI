import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyB5EGfTR8VcXvjNyX4oDLHj7zrU78ty8QI",
  authDomain: "vikranth-ai-web.firebaseapp.com",
  projectId: "vikranth-ai-web",
  storageBucket: "vikranth-ai-web.firebasestorage.app",
  messagingSenderId: "100452782489",
  appId: "1:100452782489:web:b8838c48fd474f7c914308",
  measurementId: "G-0381BRG33C",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Google Auth Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics if supported
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized for vikranth-ai-web');
    }
  }).catch((err) => {
    console.warn('Firebase Analytics not supported in this environment:', err);
  });
}

