import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

// Generate a stable conversation ID from two UIDs
export const getConversationId = (uid1, uid2) =>
  [uid1, uid2].sort().join("_");

export function useMessages(currentUser, otherUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const conversationId = currentUser && otherUserId
    ? getConversationId(currentUser.uid, otherUserId)
    : null;

  useEffect(() => {
    if (!conversationId) return;

    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [conversationId]);

  const sendMessage = useCallback(
    async (text, type = "text") => {
      if (!conversationId || !text.trim()) return;

      const convRef = doc(db, "conversations", conversationId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        await setDoc(convRef, {
          participants: [currentUser.uid, otherUserId],
          createdAt: serverTimestamp(),
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          lastMessageSender: currentUser.uid,
        });
      } else {
        await updateDoc(convRef, {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          lastMessageSender: currentUser.uid,
        });
      }

      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        text,
        type,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        readBy: [currentUser.uid],
      });
    },
    [conversationId, currentUser, otherUserId]
  );

  return { messages, loading, sendMessage };
}

// Hook to fetch all conversations for the current user
export function useConversations(currentUser) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const convs = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const otherId = data.participants.find((p) => p !== currentUser.uid);
          const userSnap = await getDoc(doc(db, "users", otherId));
          return {
            id: d.id,
            ...data,
            otherUser: userSnap.exists() ? { uid: otherId, ...userSnap.data() } : null,
          };
        })
      );
      setConversations(convs.filter((c) => c.otherUser));
      setLoading(false);
    });

    return unsub;
  }, [currentUser]);

  return { conversations, loading };
}

// Search users by display name
export async function searchUsers(query, currentUserId) {
  if (!query.trim()) return [];
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter(
      (u) =>
        u.uid !== currentUserId &&
        u.displayName?.toLowerCase().includes(query.toLowerCase())
    );
}
