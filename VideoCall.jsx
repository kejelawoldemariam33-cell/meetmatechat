import React, { useEffect, useRef, useState } from "react";

function VideoBox({ stream, muted = false, label, isLocal }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={`video-box ${isLocal ? "video-local" : "video-remote"}`}>
      {stream ? (
        <video ref={ref} autoPlay playsInline muted={muted} className="video-el" />
      ) : (
        <div className="video-placeholder">
          <div className="avatar-ring">{label?.[0]?.toUpperCase()}</div>
          <p>{label}</p>
        </div>
      )}
      <span className="video-label">{label}{muted ? " (muted)" : ""}</span>
    </div>
  );
}

export default function VideoCall({
  localStream,
  remoteStream,
  callState,
  remoteUser,
  isMuted,
  isCameraOff,
  currentUser,
  onAnswer,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (callState !== "connected") { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  const fmtTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (callState === "idle") return null;

  const calleeName =
    typeof remoteUser === "string" ? remoteUser : remoteUser?.displayName || "User";

  return (
    <div className="video-overlay">
      {callState === "ringing" && (
        <div className="ringing-screen">
          <div className="ringing-avatar">{calleeName[0]}</div>
          <h2>{calleeName}</h2>
          <p>Incoming video call…</p>
          <div className="ringing-actions">
            <button className="call-btn reject" onClick={() => onReject(remoteUser)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 1L1 23M1 1l22 22"/></svg>
            </button>
            <button className="call-btn answer" onClick={onAnswer}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 12 19.79 19.79 0 011 3.18 2 2 0 012.98 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.91A16 16 0 0015.09 16.91l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            </button>
          </div>
        </div>
      )}

      {callState === "calling" && (
        <div className="ringing-screen">
          <div className="ringing-avatar">{calleeName[0]}</div>
          <h2>{calleeName}</h2>
          <p className="calling-pulse">Calling…</p>
          <div className="ringing-actions">
            <button className="call-btn reject" onClick={onEnd}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 1L1 23M1 1l22 22"/></svg>
            </button>
          </div>
        </div>
      )}

      {callState === "connected" && (
        <div className="connected-screen">
          <div className="call-info-bar">
            <span className="call-with">{calleeName}</span>
            <span className="call-timer">{fmtTime(elapsed)}</span>
          </div>

          <div className="video-stage">
            <VideoBox
              stream={remoteStream}
              label={calleeName}
              isLocal={false}
            />
            <VideoBox
              stream={localStream}
              label={currentUser?.displayName || "You"}
              muted
              isLocal
            />
          </div>

          <div className="call-controls">
            <button
              className={`ctrl-btn ${isMuted ? "active" : ""}`}
              onClick={onToggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
              )}
              <span>{isMuted ? "Unmute" : "Mute"}</span>
            </button>

            <button
              className={`ctrl-btn ${isCameraOff ? "active" : ""}`}
              onClick={onToggleCamera}
              title={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10M1 1l22 22"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              )}
              <span>{isCameraOff ? "Start video" : "Stop video"}</span>
            </button>

            <button className="ctrl-btn end-call" onClick={onEnd} title="End call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c1.27.5 2.6.8 3.97.9a2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.42 19.42 0 01-3.33-2.67m-2.67-3.34a19.79 19.79 0 01-3.07-8.63A2 2 0 014.11 2h3a2 2 0 012 1.72c.1 1.37.4 2.7.9 3.97a2 2 0 01-.45 2.11L8.09 11.1M23 1L1 23"/></svg>
              <span>End call</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
