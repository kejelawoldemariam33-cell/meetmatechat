import React, { useState, useRef, useEffect } from "react";
import { useMessages } from "../hooks/useMessages";

const EMOJIS = ["😊","👍","❤️","😂","🎉","🔥","👏","🙌","✅","🤔","😍","🥳"];

function Avatar({ user, size = 36 }) {
  const initials = (user?.displayName || "U").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  if (user?.photoURL) {
    return <img src={user.photoURL} alt={user.displayName} className="avatar-img" style={{width:size,height:size}} />;
  }
  return (
    <div className="avatar" style={{width:size,height:size,fontSize:size*0.36}}>
      {initials}
    </div>
  );
}

export default function ChatWindow({ currentUser, otherUser, onVideoCall, onVoiceCall }) {
  const { messages, sendMessage } = useMessages(currentUser, otherUser?.uid);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    await sendMessage(text);
    setText("");
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const addEmoji = (emoji) => { setText((t) => t + emoji); inputRef.current?.focus(); };

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : "Today";
    if (!acc.length || acc[acc.length - 1].date !== date) acc.push({ date, msgs: [] });
    acc[acc.length - 1].msgs.push(msg);
    return acc;
  }, []);

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <Avatar user={otherUser} size={38} />
        <div className="chat-header-info">
          <span className="chat-header-name">{otherUser?.displayName}</span>
          <span className={`status-dot ${otherUser?.online ? "online" : "offline"}`}>
            {otherUser?.online ? "Online" : "Offline"}
          </span>
        </div>
        <div className="chat-header-actions">
          <button className="hdr-btn" onClick={() => onVoiceCall(otherUser)} title="Voice call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 12 19.79 19.79 0 011 3.18 2 2 0 012.98 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.91A16 16 0 0015.09 16.91l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          </button>
          <button className="hdr-btn hdr-btn--video" onClick={() => onVideoCall(otherUser)} title="Video call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
          <button className="hdr-btn" title="Search in chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-list">
        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="date-divider"><span>{group.date}</span></div>
            {group.msgs.map((msg) => {
              const mine = msg.senderId === currentUser?.uid;
              const time = msg.createdAt?.toDate
                ? msg.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <div key={msg.id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
                  {!mine && <Avatar user={otherUser} size={28} />}
                  <div className="bubble-wrap">
                    <div className={`bubble ${mine ? "bubble-mine" : "bubble-theirs"}`}>
                      {msg.text}
                    </div>
                    <span className="msg-time">{time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="emoji-picker">
          {EMOJIS.map((e) => (
            <button key={e} className="emoji-btn" onClick={() => addEmoji(e)}>{e}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="input-bar">
        <button
          className="input-icon-btn"
          onClick={() => setShowEmoji((s) => !s)}
          title="Emoji"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
        </button>
        <button className="input-icon-btn" title="Attach file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <textarea
          ref={inputRef}
          className="msg-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a message…"
          rows={1}
        />
        <button className="send-btn" onClick={send} disabled={!text.trim()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
