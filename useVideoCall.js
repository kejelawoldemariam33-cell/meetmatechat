import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "peerjs";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useVideoCall(currentUserId) {
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callRef = useRef(null);
  const unsubRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle | calling | ringing | connected
  const [remoteUser, setRemoteUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;

    const peer = new Peer(currentUserId, {
      host: "0.peerjs.com",
      port: 443,
      secure: true,
      path: "/",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });

    peer.on("open", (id) => {
      console.log("[PeerJS] Connected with ID:", id);
    });

    peer.on("call", async (incomingCall) => {
      callRef.current = incomingCall;
      const callerId = incomingCall.peer;
      setRemoteUser(callerId);
      setCallState("ringing");

      // Listen for answer/reject on Firestore signal doc
      unsubRef.current = onSnapshot(
        doc(db, "calls", `${callerId}_${currentUserId}`),
        (snap) => {
          if (!snap.exists()) return;
          const data = snap.data();
          if (data.status === "rejected") {
            cleanupCall();
          }
        }
      );
    });

    peer.on("error", (err) => {
      console.error("[PeerJS] error:", err);
    });

    peerRef.current = peer;

    // Listen for incoming call signals
    const signalUnsub = onSnapshot(
      doc(db, "calls", `incoming_${currentUserId}`),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.callerId && data.callerId !== currentUserId) {
          setRemoteUser(data.callerId);
          setCallState("ringing");
        }
      }
    );

    return () => {
      peer.destroy();
      signalUnsub();
      if (unsubRef.current) unsubRef.current();
    };
  }, [currentUserId]);

  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const startCall = useCallback(async (targetUserId, targetUserInfo) => {
    setRemoteUser(targetUserInfo);
    setCallState("calling");

    try {
      const stream = await getLocalStream();

      // Signal the callee via Firestore
      await setDoc(doc(db, "calls", `incoming_${targetUserId}`), {
        callerId: currentUserId,
        callerName: targetUserInfo.displayName,
        timestamp: serverTimestamp(),
        status: "calling",
      });

      const call = peerRef.current.call(targetUserId, stream);
      callRef.current = call;

      call.on("stream", (remote) => {
        remoteStreamRef.current = remote;
        setRemoteStream(remote);
        setCallState("connected");
      });

      call.on("close", () => cleanupCall());
      call.on("error", () => cleanupCall());

    } catch (err) {
      console.error("startCall error:", err);
      cleanupCall();
    }
  }, [currentUserId]);

  const answerCall = useCallback(async () => {
    try {
      const stream = await getLocalStream();
      const call = callRef.current;
      if (!call) return;

      call.answer(stream);
      call.on("stream", (remote) => {
        remoteStreamRef.current = remote;
        setRemoteStream(remote);
        setCallState("connected");
      });
      call.on("close", () => cleanupCall());
    } catch (err) {
      console.error("answerCall error:", err);
    }
  }, []);

  const rejectCall = useCallback(async (callerId) => {
    await setDoc(
      doc(db, "calls", `${callerId}_${currentUserId}`),
      { status: "rejected" },
      { merge: true }
    );
    await deleteDoc(doc(db, "calls", `incoming_${currentUserId}`));
    cleanupCall();
  }, [currentUserId]);

  const endCall = useCallback(async () => {
    if (callRef.current) callRef.current.close();
    cleanupCall();
    // Cleanup signal docs
    try {
      if (remoteUser?.uid) {
        await deleteDoc(doc(db, "calls", `incoming_${remoteUser.uid}`));
        await deleteDoc(doc(db, "calls", `${currentUserId}_${remoteUser.uid}`));
      }
    } catch (_) {}
  }, [currentUserId, remoteUser]);

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setRemoteUser(null);
    callRef.current = null;
  };

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((c) => !c);
  }, []);

  return {
    localStream,
    remoteStream,
    callState,
    remoteUser,
    isMuted,
    isCameraOff,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
