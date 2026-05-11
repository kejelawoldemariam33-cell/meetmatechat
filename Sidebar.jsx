import React, { useState } from "react";
import { useConversations, searchUsers } from "../hooks/useMessages";
import { useAuth } from "../lib/AuthContext";

function Avatar({ user, size = 40 }) {
  const initials = (user?.displayName || "U").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  if (user?.photoURL) return <img src={user.photoURL} alt={user.displayName} className="avatar-img" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover"}} />;
  return <div className="avatar" style={{width:size,height:size,fontSize:size*0.36}}>{initials}</div>;
}

export default function Sidebar({ currentUser, selectedUser, onSelect }) {
  const { conversations, loading } = useConversations(currentUser);
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchUsers(q, currentUser.uid);
    setSearchResults(results);
    setSearching(false);
  };

  const displayList = query.trim() ? searchResults : conversations;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-mark-sm">C</span>
          <span>Chatterly</span>
        </div>
        <div className="sidebar-header-actions">
          <button className="sidebar-icon-btn" title="New conversation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="sidebar-icon-btn" title="Sign out" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>

      {/* Current user */}
      <div className="sidebar-me">
        <Avatar user={currentUser} size={32} />
        <div className="sidebar-me-info">
          <span className="sidebar-me-name">{currentUser?.displayName}</span>
          <span className="sidebar-me-status">
            <span className="status-indicator online" />
            Active now
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text"
          placeholder="Search people…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        {searching && <span className="search-spinner">⟳</span>}
      </div>

      <div className="sidebar-section-label">
        {query.trim() ? "People" : "Recent"}
      </div>

      {/* List */}
      <div className="contact-list">
        {loading && !query && <p className="sidebar-empty">Loading…</p>}

        {!loading && displayList.length === 0 && (
          <p className="sidebar-empty">
            {query.trim() ? "No users found" : "No conversations yet. Search for someone!"}
          </p>
        )}

        {displayList.map((item) => {
          const user = query.trim() ? item : item.otherUser;
          if (!user) return null;
          const isActive = selectedUser?.uid === user.uid;
          const preview = !query.trim() ? item.lastMessage : null;
          const time = !query.trim() && item.lastMessageAt?.toDate
            ? item.lastMessageAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : null;

          return (
            <div
              key={user.uid}
              className={`contact-item ${isActive ? "contact-item--active" : ""}`}
              onClick={() => { onSelect(user); setQuery(""); setSearchResults([]); }}
            >
              <div style={{ position: "relative" }}>
                <Avatar user={user} size={42} />
                {user.online && <span className="online-badge" />}
              </div>
              <div className="contact-info">
                <div className="contact-name">{user.displayName}</div>
                {preview && <div className="contact-preview">{preview}</div>}
              </div>
              {time && <span className="contact-time">{time}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
