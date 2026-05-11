import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user profile to Firestore
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "User",
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || null,
            createdAt: serverTimestamp(),
            online: true,
            lastSeen: serverTimestamp(),
          });
        } else {
          await setDoc(ref, { online: true, lastSeen: serverTimestamp() }, { merge: true });
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

  const signInWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signUpWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred;
  };

  const logout = async () => {
    if (auth.currentUser) {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { online: false, lastSeen: serverTimestamp() },
        { merge: true }
      );
    }
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
