import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import VideoCall from "../components/VideoCall";
import { useAuth } from "../lib/AuthContext";
import { useVideoCall } from "../hooks/useVideoCall";

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);

  const {
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
  } = useVideoCall(user?.uid);

  return (
    <div className="chat-page">
      <Sidebar
        currentUser={user}
        selectedUser={selectedUser}
        onSelect={setSelectedUser}
      />

      <main className="main-area">
        {selectedUser ? (
          <ChatWindow
            currentUser={user}
            otherUser={selectedUser}
            onVideoCall={(u) => startCall(u.uid, u)}
            onVoiceCall={(u) => startCall(u.uid, u)}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
                <path d="M32 4C16.536 4 4 16.536 4 32c0 5.404 1.56 10.445 4.254 14.702L4 60l13.298-4.254A27.842 27.842 0 0032 60c15.464 0 28-12.536 28-28S47.464 4 32 4z"/>
                <path d="M22 32h.01M32 32h.01M42 32h.01" strokeLinecap="round" strokeWidth="3"/>
              </svg>
            </div>
            <h2>Your messages</h2>
            <p>Search for someone to start a conversation, or select a recent chat.</p>
          </div>
        )}
      </main>

      <VideoCall
        localStream={localStream}
        remoteStream={remoteStream}
        callState={callState}
        remoteUser={remoteUser}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        currentUser={user}
        onAnswer={answerCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
      />
    </div>
  );
}
