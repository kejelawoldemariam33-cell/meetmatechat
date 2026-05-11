import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ─── FIREBASE PROJECT CONFIG ────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDiCk1hZuxwWi-BepzkCDzih5JbjrRGUSQ",
  authDomain: "chatterly-e21be.firebaseapp.com",
  databaseURL: "https://chatterly-e21be-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chatterly-e21be",
  storageBucket: "chatterly-e21be.firebasestorage.app",
  messagingSenderId: "165922730833",
  appId: "1:165922730833:web:6b14ce4f22d8d517a3d970",
  measurementId: "G-XXYEEH2TB5"
};
// ────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
