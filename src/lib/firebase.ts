import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, GoogleAuthProvider, OAuthProvider, browserPopupRedirectResolver } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
}, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
